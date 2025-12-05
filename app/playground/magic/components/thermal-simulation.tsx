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
  Html, // Import Html for tags
} from "@react-three/drei";
import * as THREE from "three";

// Constants
const PLATE_WIDTH = 1.5;
const PLATE_DEPTH = 1.5;
const FOCUS_OFFSET_MIN = -3.5;
const FOCUS_OFFSET_MAX = 0;
const MATRIX_SIZE_MIN = 1;
const MATRIX_SIZE_MAX = 5;

// WASM Import
import init, { run_thermal_simulation } from "../wasm-embeddings/v3/solar.js";

const tempColor = new THREE.Color();

// Helper to generate heatmap gradients
function updateHeatColor(t: number, targetArray: Uint8Array, offset: number) {
  const val = Math.min(Math.max(t, 0), 1);

  // Gradient: Black -> Red -> White
  if (val < 0.5) {
    const intensity = val * 2;
    tempColor.setRGB(intensity, 0, 0);
  } else {
    const intensity = (val - 0.5) * 2;
    tempColor.setRGB(1, intensity, intensity);
  }

  targetArray[offset] = tempColor.r * 255;
  targetArray[offset + 1] = tempColor.g * 255;
  targetArray[offset + 2] = tempColor.b * 255;
  targetArray[offset + 3] = 255;
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

// --- 3D COMPONENT: THERMAL BOX ---
const ThermalBox = ({
  matrixSize,
  focusOffset,
  magicArea,
  status,
  onUpdateStats,
}: {
  matrixSize: number | null;
  focusOffset: number | null;
  magicArea: number | null;
  status: SimStats;
  onUpdateStats: (stats: Partial<SimStats>) => void;
}) => {
  const [texSink, setTexSink] = useState<LayerTextures | null>(null);
  const [texBase, setTexBase] = useState<LayerTextures | null>(null);
  const [texCPV, setTexCPV] = useState<LayerTextures | null>(null);

  const fwhm = useMemo(() => {
    if (focusOffset === null) return 0.1;
    const ratio = Math.abs(focusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [focusOffset]);

  // Init WASM
  useEffect(() => {
    init()
      .then(() => onUpdateStats({ status: "Ready" }))
      .catch((err) => {
        console.error("Failed to load WASM:", err);
        onUpdateStats({ status: "Error Loading WASM" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulation Logic
  useEffect(() => {
    // If params are null, it means we stopped or haven't started.
    // We do NOT clear the textures here so the last result stays visible,
    // unless you prefer to reset them. For now, let's keep them if they exist.
    if (matrixSize === null || magicArea === null || focusOffset === null) {
      return;
    }

    onUpdateStats({ loading: true, status: "Calculating..." });

    // Timeout allows UI to update before blocking
    const timer = setTimeout(() => {
      try {
        const result = run_thermal_simulation(fwhm, magicArea, matrixSize);

        onUpdateStats({
          maxTemp: result.get_t_max(),
          pElectric: result.get_p_elec(),
          loading: false,
          status: "Done",
        });

        // --- Texture Generation Logic (Same as before) ---
        const nx = result.get_nx();
        const ny = result.get_ny();
        const nz = result.get_nz();
        const tempArray = result.get_t_3d();

        let gMin = Infinity;
        let gMax = -Infinity;
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
      } catch (e) {
        console.error("Simulation failed:", e);
        onUpdateStats({ loading: false, status: "Error" });
      }
    }, 100); // 100ms delay to allow UI update before lock

    return () => clearTimeout(timer);
  }, [fwhm, magicArea, matrixSize, focusOffset, onUpdateStats]);

  // Annotation Style
  const annotationStyle = {
    color: "white",
    background: "rgba(0,0,0,0.7)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontFamily: "monospace",
    border: "1px solid rgba(255,255,255,0.2)",
    fontWeight: "bold",
    pointerEvents: "none" as const,
  };

  // Define geometry constants for cleaner JSX
  const SINK_POS: [number, number, number] = [0, -0.6, 0];
  const BASE_POS: [number, number, number] = [0, 0, 0];
  const CPV_POS: [number, number, number] = [0, 0.4, 0];

  return (
    <group rotation={[Math.PI / 6, Math.PI / 4, 0]} position={[0, 0, 0]}>
      {/* --- LAYER 1: SINK (Aluminum) --- */}
      <mesh position={SINK_POS}>
        <boxGeometry args={[PLATE_WIDTH, 0.1, PLATE_DEPTH]} />
        {texSink ? (
          texSink.map((tex, i) => (
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
          ))
        ) : (
          // Default Aluminum Look
          <meshStandardMaterial
            color="#A0A0A0"
            roughness={0.3}
            metalness={0.8}
          />
        )}
        <Html position={[0.8, 0, 0]} center>
          <div
            style={{
              ...annotationStyle,
              opacity: status.loading ? "0" : "100",
            }}
          >
            Al
          </div>
        </Html>
      </mesh>

      {/* --- LAYER 2: BASE (Copper) --- */}
      <mesh position={BASE_POS}>
        <boxGeometry args={[PLATE_WIDTH, 0.3, PLATE_DEPTH]} />
        {texBase ? (
          texBase.map((tex, i) => (
            <meshStandardMaterial
              key={i}
              attach={`material-${i}`}
              emissiveMap={tex}
              emissiveIntensity={2.0}
              emissive="white"
              roughness={0.3}
              metalness={0.5}
              color="#8B4513"
            />
          ))
        ) : (
          // Default Copper Look
          <meshStandardMaterial
            color="#B87333"
            roughness={0.3}
            metalness={0.8}
          />
        )}
        <Html position={[0.8, 0, 0]} center>
          <div
            style={{
              ...annotationStyle,
              opacity: status.loading ? "0" : "100",
            }}
          >
            Cu
          </div>
        </Html>
      </mesh>

      {/* --- LAYER 3: CPV (Silicon) --- */}
      <mesh position={CPV_POS}>
        <boxGeometry args={[PLATE_WIDTH, 0.02, PLATE_DEPTH]} />
        {texCPV ? (
          texCPV.map((tex, i) => (
            <meshStandardMaterial
              key={i}
              attach={`material-${i}`}
              emissiveMap={tex}
              emissiveIntensity={2.0}
              emissive="white"
              roughness={0.5}
              color="gray"
            />
          ))
        ) : (
          // Default Silicon Look
          <meshStandardMaterial
            color="#aaaaaa"
            roughness={0.2}
            metalness={0.5}
          />
        )}
        <Html position={[0.8, 0, 0]} center>
          <div
            style={{
              ...annotationStyle,
              opacity: status.loading ? "0" : "100",
            }}
          >
            Si+Ag
          </div>
        </Html>
      </mesh>
    </group>
  );
};

// --- MAIN COMPONENT ---
export default function ThermalPage() {
  const [simStats, setSimStats] = useState<SimStats>({
    maxTemp: 0,
    pElectric: 0,
    status: "Ready to Start",
    loading: false,
  });

  const [uiFocusOffset, setUiFocusOffset] = useState(-1.5);
  const [uiMatrixSize, setUiMatrixSize] = useState(5);
  const [uiMagicArea, setUiMagicArea] = useState(75);

  const [activeParams, setActiveParams] = useState<{
    focusOffset: number;
    matrixSize: number;
    magicArea: number;
  } | null>(null);

  const displayFwhm = useMemo(() => {
    const ratio = Math.abs(uiFocusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [uiFocusOffset]);

  const handleRunSimulation = () => {
    setActiveParams({
      focusOffset: uiFocusOffset,
      matrixSize: uiMatrixSize,
      magicArea: uiMagicArea,
    });
  };

  const handleStopSimulation = () => {
    // Setting activeParams to null triggers cleanup in ThermalBox useEffect
    setActiveParams(null);
    setSimStats((prev) => ({ ...prev, loading: false, status: "Stopped" }));
  };

  const onUpdateStats = useCallback((stats: Partial<SimStats>) => {
    setSimStats((prev) => ({ ...prev, ...stats }));
  }, []);

  const hasPendingChanges =
    !activeParams ||
    uiFocusOffset !== activeParams.focusOffset ||
    uiMatrixSize !== activeParams.matrixSize ||
    uiMagicArea !== activeParams.magicArea;

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Header */}
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
          onClick={() => (window.location.href = "/playground/magic")}
          className={`
            font-bold text-white uppercase tracking-wider text-sm cursor-pointer px-3 py-1 pointer-events-auto rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-600 to-blue-600 hover:scale-105 hover:shadow-cyan-500/50 ring-2 ring-white/50`}
        >
          Visualització del telescopi &rarr;
        </button>
      </div>

      {/* --- STARRY SKY LOADING OVERLAY --- */}
      {/* Only visible when loading is true */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center bg-gray-700/70 pointer-events-none transition-all duration-500 ${
          simStats.loading
            ? "opacity-100 backdrop-blur-sm pointer-events-none"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="text-center transform transition-transform duration-700 hover:scale-105">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-pulse tracking-widest">
            STARRY SKY
          </h1>
          <p className="text-white/80 font-mono mt-4 text-sm tracking-[0.5em] uppercase">
            Executant simulació, esperi...
          </p>
        </div>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={["#ccc"]} />
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
        <OrbitControls
          makeDefault
          minDistance={2}
          maxDistance={50}
          target={[0, 0, 0]}
          enablePan={true}
          panSpeed={1.0}
        />
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 5]}
          intensity={2.0}
          castShadow
          color="#fffaed"
        />

        <ThermalBox
          matrixSize={activeParams?.matrixSize ?? null}
          focusOffset={activeParams?.focusOffset ?? null}
          magicArea={activeParams?.magicArea ?? null}
          status={simStats}
          onUpdateStats={onUpdateStats}
        />
      </Canvas>

      {/* UI Controls */}
      <div className="absolute z-50 top-24 left-8 flex flex-col items-center gap-4 pointer-events-auto">
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
            onClick={() => setUiMagicArea((prev) => Math.min(prev + 5, 240))}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
          >
            +
          </button>
        </div>

        {/* MAIN BUTTON (RUN / STOP) */}
        <button
          onClick={
            simStats.loading ? handleStopSimulation : handleRunSimulation
          }
          className={`
            group flex items-center gap-3 px-6 py-3 rounded-full shadow-xl transition-all duration-300
            ${
              simStats.loading
                ? "bg-red-600 hover:bg-red-500 hover:scale-105 ring-2 ring-red-400/50"
                : hasPendingChanges
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:scale-105 hover:shadow-cyan-500/50 ring-2 ring-white/50"
                  : "bg-gray-800/80 text-gray-400"
            }
            cursor-pointer
          `}
        >
          {simStats.loading ? (
            // STOP ICON
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5 text-white animate-pulse"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
              />
            </svg>
          ) : (
            // STATUS DOT
            <div
              className={`w-3 h-3 rounded-full ${
                hasPendingChanges ? "bg-red-400 animate-pulse" : "bg-green-500"
              }`}
            />
          )}
          <span className="font-bold text-white uppercase tracking-wider text-sm">
            {simStats.loading
              ? "ATURAR"
              : activeParams === null
                ? "Iniciar Simulació"
                : hasPendingChanges
                  ? "Simular Canvis"
                  : "Actualitzat"}
          </span>
        </button>
      </div>

      {/* Stats Panel */}
      <div className="absolute top-24 right-8 pointer-events-auto bg-gray-900/90 p-4 rounded-lg border border-cyan-500/50 w-80 text-left shadow-2xl backdrop-blur-sm z-30">
        <h3 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
          Resultats Simulació
        </h3>
        <div className="space-y-1 text-xs font-mono text-gray-300">
          <div className="flex justify-between">
            <span>Àrea Telescopi:</span>{" "}
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
            <span>FWHM:</span> <span>{displayFwhm.toFixed(3)} m</span>
          </div>
          <div className="h-px bg-white/20 my-3"></div>

          {activeParams && simStats.maxTemp > 0 ? (
            <>
              <div className="flex justify-between text-red-400 font-bold text-sm items-center">
                <span>T. Màx:</span>
                <span className="px-2 py-0.5 rounded border bg-red-900/30 border-red-500/30">
                  {simStats.maxTemp.toFixed(1)} °C
                </span>
              </div>
              <div className="flex justify-between text-green-300 font-bold text-sm items-center mt-1">
                <span>Potència Elèc:</span>
                <span className="px-2 py-0.5 rounded border bg-green-900/30 border-green-500/30">
                  {simStats.pElectric.toFixed(2)} W
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 italic py-2">
              Prem Iniciar Simulació per veure resultats segons els paràmetres.
            </div>
          )}

          <div className="h-px bg-white/20 my-3"></div>
          <p className="text-[10px] text-gray-500 leading-tight">
            Simulació lleugera. Bona aproximació. Per resultats precisos empreu
            la versió MATLAB.
          </p>
        </div>
      </div>
    </div>
  );
}
