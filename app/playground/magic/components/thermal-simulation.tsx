"use client";

import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

const SKY_TEXTURE_URL =
  "https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?q=80&w=2574&auto=format&fit=crop"; // Placeholder
const GROUND_TEXTURE_URL =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2832&auto=format&fit=crop"; // Placeholder

const FOCAL_LENGTH = 20;
const DISH_RADIUS = 10;
const MIRROR_SIZE = 0.45;
const MIRROR_GAP = 0.05;
const TUBE_THICKNESS = 0.2;
const RAY_SPEED = 0.8;
const PLATE_WIDTH = 1.5;
const PLATE_DEPTH = 1.5;
const FOCUS_OFFSET_MIN = -2.5;
const FOCUS_OFFSET_MAX = 0;
const MATRIX_SIZE_MIN = 1;
const MATRIX_SIZE_MAX = 5;

import init, { run_thermal_simulation } from "../wasm-embeddings/v3/solar.js";
import { on } from "events";

const tempColor = new THREE.Color();

function updateHeatColor(t: number, targetArray: Uint8Array, offset: number) {
  const val = Math.min(Math.max(t, 0), 1);

  // Create a Gradient from Black (Low) -> Red (Med) -> White (High)
  if (val < 0.5) {
    // 0.0 to 0.5 maps to Black (0,0,0) -> Red (1,0,0)
    const intensity = val * 2;
    tempColor.setRGB(intensity, 0, 0);
  } else {
    // 0.5 to 1.0 maps to Red (1,0,0) -> White (1,1,1)
    const intensity = (val - 0.5) * 2;
    tempColor.setRGB(1, intensity, intensity);
  }

  targetArray[offset] = tempColor.r * 255;
  targetArray[offset + 1] = tempColor.g * 255;
  targetArray[offset + 2] = tempColor.b * 255;
  targetArray[offset + 3] = 255; // Alpha always 255
}

type LayerTextures = [
  THREE.Texture,
  THREE.Texture,
  THREE.Texture,
  THREE.Texture,
  THREE.Texture,
  THREE.Texture,
];

interface SimStats {
  maxTemp: number;
  pElectric: number;
  status: string;
  loading: boolean;
}
const ThermalBox = ({
  matrixSize,
  focusOffset,
  magicArea,
  onUpdateStats,
}: {
  matrixSize: number | null;
  focusOffset: number | null;
  magicArea: number | null;
  onUpdateStats: (stats: Partial<SimStats>) => void;
}) => {
  const [texSink, setTexSink] = useState<LayerTextures | null>(null);
  const [texBase, setTexBase] = useState<LayerTextures | null>(null);
  const [texCPV, setTexCPV] = useState<LayerTextures | null>(null);

  const fwhm = useMemo(() => {
    // Handle null case safely
    if (focusOffset === null) return 0.1;
    const ratio = Math.abs(focusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [focusOffset]);

  // Initial Load of WASM only
  useEffect(() => {
    init()
      .then(() => onUpdateStats({ status: "Ready to Simulate" }))
      .catch((err) => {
        console.error("Failed to load WASM:", err);
        onUpdateStats({ status: "Error Loading WASM" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Simulation Trigger Effect
  useEffect(() => {
    // CRITICAL FIX: Guard clause.
    // If we don't have active parameters (initial load), do NOT run the simulation.
    if (matrixSize === null || magicArea === null || focusOffset === null) {
      return;
    }

    onUpdateStats({ loading: true, status: "Calculating..." });

    // We use a slightly longer timeout to ensure the UI has time to render
    // the "Calculating" state before the heavy JS loop freezes the thread.
    console.log("Starting simulation with params:", {
      fwhm,
      magicArea,
      matrixSize,
    });
    const timer = setTimeout(() => {
      try {
        console.time("Simulation Run"); // Debugging for "lasts too much"

        const result = run_thermal_simulation(fwhm, magicArea, matrixSize);

        onUpdateStats({
          maxTemp: result.get_t_max(),
          pElectric: result.get_p_elec(),
          loading: false,
          status: "Done",
        });

        const nx = result.get_nx();
        const ny = result.get_ny();
        const nz = result.get_nz();
        const tempArray = result.get_t_3d();

        let gMin = Infinity;
        let gMax = -Infinity;

        // Optimize: use a simple loop
        const len = tempArray.length;
        for (let i = 0; i < len; i++) {
          const val = tempArray[i];
          if (val < gMin) gMin = val;
          if (val > gMax) gMax = val;
        }
        const range = Math.max(gMax - gMin, 0.1);

        const generateXYTexture = (zIndex: number) => {
          const fullNx = nx * 2;
          const fullNy = ny * 2;
          const dataSize = fullNx * fullNy * 4;
          const textureData = new Uint8Array(dataSize);
          const zOffset = zIndex * nx * ny;

          for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++) {
              const val = tempArray[zOffset + j * nx + i];
              const norm = (val - gMin) / range;

              // Pre-calculate base indices to save math ops
              const row1 = (ny + j) * fullNx;
              const row2 = (ny - 1 - j) * fullNx;
              const col1 = nx + i;
              const col2 = nx - 1 - i;

              updateHeatColor(norm, textureData, (row1 + col1) * 4);
              updateHeatColor(norm, textureData, (row1 + col2) * 4);
              updateHeatColor(norm, textureData, (row2 + col2) * 4);
              updateHeatColor(norm, textureData, (row2 + col1) * 4);
            }
          }
          const tex = new THREE.DataTexture(textureData, fullNx, fullNy);
          tex.format = THREE.RGBAFormat;
          tex.type = THREE.UnsignedByteType;
          tex.magFilter = THREE.LinearFilter;
          tex.minFilter = THREE.LinearFilter;
          tex.needsUpdate = true;
          return tex;
        };

        const generateSideTexture = (
          zStart: number,
          zEnd: number,
          isXFace: boolean
        ) => {
          const depth = zEnd - zStart + 1;
          const width = isXFace ? nx * 2 : ny * 2;
          const dataSize = width * depth * 4;
          const textureData = new Uint8Array(dataSize);

          for (let k = 0; k < depth; k++) {
            const zIdx = zStart + k;
            const zOffset = zIdx * nx * ny;
            const quarterDim = isXFace ? nx : ny;

            // Optimization: Pull invariant calculation out of inner loop
            const rowOffset = k * width;

            for (let q = 0; q < quarterDim; q++) {
              let val;
              if (isXFace) val = tempArray[zOffset + (ny - 1) * nx + q];
              else val = tempArray[zOffset + q * nx + (nx - 1)];

              const norm = (val - gMin) / range;

              const idxRight = (rowOffset + (quarterDim + q)) * 4;
              const idxLeft = (rowOffset + (quarterDim - 1 - q)) * 4;

              updateHeatColor(norm, textureData, idxRight);
              updateHeatColor(norm, textureData, idxLeft);
            }
          }
          const tex = new THREE.DataTexture(textureData, width, depth);
          tex.format = THREE.RGBAFormat;
          tex.type = THREE.UnsignedByteType;
          tex.magFilter = THREE.LinearFilter;
          tex.minFilter = THREE.LinearFilter;
          tex.needsUpdate = true;
          return tex;
        };

        const buildLayerSet = (zStart: number, zEnd: number): LayerTextures => {
          const texTop = generateXYTexture(zEnd);
          const texBottom = generateXYTexture(zStart);
          const texFrontBack = generateSideTexture(zStart, zEnd, true);
          const texRightLeft = generateSideTexture(zStart, zEnd, false);
          return [
            texRightLeft,
            texRightLeft,
            texTop,
            texBottom,
            texFrontBack,
            texFrontBack,
          ];
        };

        setTexSink(buildLayerSet(0, 4));
        setTexBase(buildLayerSet(5, 12));
        setTexCPV(buildLayerSet(13, nz - 1));

        result.free();
        console.timeEnd("Simulation Run"); // Check console for timing
      } catch (e) {
        console.error("Simulation failed:", e);
        onUpdateStats({ loading: false, status: "Error" });
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [fwhm, magicArea, matrixSize, focusOffset, onUpdateStats]);

  const hasData = texCPV && texBase && texSink;

  return (
    <group
      rotation={[Math.PI / 6, Math.PI / 4, 0]}
      position={[0, 0, 0]}
      visible={!!hasData}
    >
      {texSink && (
        <mesh position={[0, -0.6, 0]}>
          <boxGeometry args={[PLATE_WIDTH, 0.1, PLATE_DEPTH]} />
          {texSink.map((tex, i) => (
            <meshStandardMaterial
              key={i}
              attach={`material-${i}`}
              emissiveMap={tex}
              emissiveIntensity={2.0}
              emissive="white"
              roughness={0.4}
              metalness={0.2}
              color="gray"
            />
          ))}
        </mesh>
      )}
      {texBase && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[PLATE_WIDTH, 0.3, PLATE_DEPTH]} />
          {texBase.map((tex, i) => (
            <meshStandardMaterial
              key={i}
              attach={`material-${i}`}
              emissiveMap={tex}
              emissiveIntensity={2.0}
              emissive="white"
              roughness={0.3}
              metalness={0.5}
              color="#8B4513" // Brown
            />
          ))}
        </mesh>
      )}
      {texCPV && (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[PLATE_WIDTH, 0.02, PLATE_DEPTH]} />
          {texCPV.map((tex, i) => (
            <meshStandardMaterial
              key={i}
              attach={`material-${i}`}
              emissiveMap={tex}
              emissiveIntensity={2.0}
              emissive="white"
              roughness={0.5}
              color="#333" // Dark Gray
            />
          ))}
        </mesh>
      )}
    </group>
  );
};

// --- THERMAL PAGE (Main Component for Page 2) ---
export default function ThermalPage() {
  const [simStats, setSimStats] = useState<SimStats>({
    maxTemp: 0,
    pElectric: 0,
    status: "Ready to Start",
    loading: false,
  });

  // UI STATE: What the user is currently editing (Does not trigger simulation)
  const [uiFocusOffset, setUiFocusOffset] = useState(-1.5);
  const [uiMatrixSize, setUiMatrixSize] = useState(5);
  const [uiMagicArea, setUiMagicArea] = useState(75);

  // ACTIVE STATE: Controls when simulation runs.
  // CRITICAL FIX: Initialize as NULL so it doesn't run on load.
  const [activeParams, setActiveParams] = useState<{
    focusOffset: number;
    matrixSize: number;
    magicArea: number;
  } | null>(null);

  // Derived FWHM for display (based on UI params since Active might be null)
  // We use UI params here so the stats panel updates instantly as user adjusts slider
  const displayFwhm = useMemo(() => {
    const ratio = Math.abs(uiFocusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [uiFocusOffset]);

  // Handler to commit UI changes to Active state
  const handleRunSimulation = () => {
    setActiveParams({
      focusOffset: uiFocusOffset,
      matrixSize: uiMatrixSize,
      magicArea: uiMagicArea,
    });
  };

  const onUpdateStats = useCallback((stats: Partial<SimStats>) => {
    setSimStats((prev) => ({ ...prev, ...stats }));
  }, []);

  // Check if there are pending changes
  // If activeParams is null (first run), we consider it "pending"
  const hasPendingChanges =
    !activeParams ||
    uiFocusOffset !== activeParams.focusOffset ||
    uiMatrixSize !== activeParams.matrixSize ||
    uiMagicArea !== activeParams.magicArea;

  return (
    <div className="relative w-full h-full">
      <div className="absolute w-full top-0 left-0 px-10 py-3 text-black bg-gray-300 z-50 pointer-events-none select-none drop-shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter">
            Telescopi MAGIC
          </h1>
          <p className="text-xs opacity-90">
            Aissam Khadraoui, Candela García, Filip Denis
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = "/playground/magic";
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold hover:bg-blue-500 transition active:scale-95 pointer-events-auto"
        >
          Visualització del telescopi &rarr;
        </button>
      </div>
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={["#bbf3fc"]} />
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
        <OrbitControls
          makeDefault
          minDistance={2}
          maxDistance={50}
          target={[0, 0, 0]}
          enablePan={true}
          panSpeed={1.0}
        />
        <ambientLight intensity={1.0} />
        <directionalLight
          position={[10, 20, 5]}
          intensity={2.0}
          castShadow
          color="#fffaed"
        />

        {/* Thermal 3D Box - Receives ACTIVE params */}
        <ThermalBox
          matrixSize={activeParams?.matrixSize ?? null}
          focusOffset={activeParams?.focusOffset ?? null}
          magicArea={activeParams?.magicArea ?? null}
          onUpdateStats={onUpdateStats}
        />
      </Canvas>

      {/* UI Controls */}
      <div className="absolute top-24 left-8 flex flex-col items-center gap-4 pointer-events-auto">
        {/* Focus Offset Control */}
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white shadow-lg border border-white/20">
          <button
            onClick={() =>
              setUiFocusOffset((prev) => Math.max(prev - 0.5, FOCUS_OFFSET_MIN))
            }
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
          >
            -
          </button>
          <div className="flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">
              Desplaçament
            </span>
            <span className="font-mono text-lg font-bold text-cyan-400">
              {uiFocusOffset > 0 ? "+" : ""}
              {uiFocusOffset.toFixed(1)}
            </span>
          </div>
          <button
            onClick={() =>
              setUiFocusOffset((prev) => Math.min(prev + 0.5, FOCUS_OFFSET_MAX))
            }
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
          >
            +
          </button>
        </div>

        {/* Matrix Control */}
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white shadow-lg border border-white/20">
          <button
            onClick={() =>
              setUiMatrixSize((prev) => Math.max(prev - 1, MATRIX_SIZE_MIN))
            }
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
          >
            -
          </button>
          <div className="flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">
              Matriu NxN
            </span>
            <span className="font-mono text-lg font-bold text-yellow-400">
              {uiMatrixSize}x{uiMatrixSize}
            </span>
          </div>
          <button
            onClick={() =>
              setUiMatrixSize((prev) => Math.min(prev + 1, MATRIX_SIZE_MAX))
            }
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
          >
            +
          </button>
        </div>

        {/* Area Control */}
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white shadow-lg border border-white/20">
          <button
            onClick={() => setUiMagicArea((prev) => Math.max(prev - 5, 10))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
          >
            -
          </button>
          <div className="flex flex-col items-center min-w-[100px]">
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">
              Àrea (m²)
            </span>
            <span className="font-mono text-lg font-bold text-green-400">
              {uiMagicArea}
            </span>
          </div>
          <button
            onClick={() => setUiMagicArea((prev) => Math.min(prev + 5, 200))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
          >
            +
          </button>
        </div>

        {/* Run Simulation Button */}
        <button
          onClick={handleRunSimulation}
          disabled={simStats.loading}
          className={`
            group flex items-center gap-3 px-6 py-3 rounded-full shadow-xl transition-all duration-300
            ${
              hasPendingChanges
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:scale-105 hover:shadow-cyan-500/50 ring-2 ring-white/50"
                : "bg-gray-800/80 text-gray-400"
            }
            ${
              simStats.loading
                ? "opacity-70 cursor-not-allowed"
                : "cursor-pointer"
            }
          `}
        >
          {simStats.loading ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <div
              className={`w-3 h-3 rounded-full ${
                hasPendingChanges ? "bg-red-400 animate-pulse" : "bg-green-500"
              }`}
            />
          )}
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            {simStats.loading
              ? "Calculant..."
              : activeParams === null
                ? "Iniciar Simulació"
                : hasPendingChanges
                  ? "Simular Canvis"
                  : "Actualitzat"}
          </span>
        </button>
      </div>

      {/* Stats Panel - Shows ACTIVE simulation results */}
      <div className="absolute top-24 right-8 pointer-events-auto bg-gray-900/90 p-4 rounded-lg border border-cyan-500/50 w-80 text-left shadow-2xl backdrop-blur-sm">
        <h3 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
          Resultats Simulació
          {simStats.loading && (
            <span className="flex items-center gap-2 text-xs text-yellow-400 animate-pulse border border-yellow-400/30 px-2 py-0.5 rounded bg-yellow-900/20">
              Calculant...
            </span>
          )}
        </h3>
        <div className="space-y-1 text-xs font-mono text-gray-300">
          <div className="flex justify-between">
            {/* Show UI params here if activeParams is null (not run yet) */}
            <span>Àrea Màgica:</span>{" "}
            <span>{activeParams?.magicArea ?? uiMagicArea} m²</span>
          </div>
          <div className="flex justify-between">
            <span>Matriu CPV:</span>{" "}
            <span>
              {activeParams?.matrixSize ?? uiMatrixSize}x
              {activeParams?.matrixSize ?? uiMatrixSize}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Desplaçament:</span>{" "}
            <span>
              {(activeParams?.focusOffset ?? uiFocusOffset).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>FWHM Est.:</span> <span>{displayFwhm.toFixed(3)} m</span>
          </div>
          <div className="h-px bg-white/20 my-3"></div>

          {/* Only show results if data exists (maxTemp > 0 implies run finished) */}
          {activeParams ? (
            <>
              <div className="flex justify-between text-red-400 font-bold text-sm items-center">
                <span>T. Màx:</span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    simStats.loading ? "opacity-50" : ""
                  } bg-red-900/30 border-red-500/30`}
                >
                  {simStats.maxTemp.toFixed(1)} °C
                </span>
              </div>
              <div className="flex justify-between text-green-300 font-bold text-sm items-center mt-1">
                <span>Potència Elèc:</span>
                <span
                  className={`px-2 py-0.5 rounded border ${
                    simStats.loading ? "opacity-50" : ""
                  } bg-green-900/30 border-green-500/30`}
                >
                  {simStats.pElectric.toFixed(2)} W
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 italic py-2">
              Prem Iniciar Simulació per veure resultats
            </div>
          )}

          <div className="h-px bg-white/20 my-3"></div>
          <p className="text-[10px] text-gray-500 leading-tight">
            Motor: Rust + nalgebra-sparse + PCG
            <br /> Estat: {simStats.status}
          </p>
        </div>
      </div>
    </div>
  );
}
