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
  Html,
} from "@react-three/drei";
import * as THREE from "three";

// Constants
const PLATE_WIDTH = 1.5;
const PLATE_DEPTH = 1.5;
const FOCUS_OFFSET_MIN = -3.5;
const FOCUS_OFFSET_MAX = 0;
const MATRIX_SIZE_MIN = 1;
const MATRIX_SIZE_MAX = 5;

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

// Helper to reconstruct textures from Worker data
const createTexturesFromData = (dataArray: any[6]): LayerTextures => {
  return dataArray.map((item: any) => {
    const tex = new THREE.DataTexture(item.data, item.width, item.height);
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }) as LayerTextures;
};

// --- 3D COMPONENT: THERMAL BOX ---
const ThermalBox = ({
  matrixSize,
  visualMatrixSize, // NEW PROP
  focusOffset,
  magicArea,
  hasPendingChanges,
  status,
  onUpdateStats,
}: {
  matrixSize: number | null;
  visualMatrixSize: number; // NEW PROP TYPE
  focusOffset: number | null;
  magicArea: number | null;
  hasPendingChanges: boolean;
  status: SimStats;
  onUpdateStats: (stats: Partial<SimStats>) => void;
}) => {
  const [texSink, setTexSink] = useState<LayerTextures | null>(null);
  const [texBase, setTexBase] = useState<LayerTextures | null>(null);
  const [texCPV, setTexCPV] = useState<LayerTextures | null>(null);
  const [split, setSplit] = useState(false);

  // Animation Refs
  const sinkRef = useRef<THREE.Group>(null);
  const baseRef = useRef<THREE.Group>(null);
  const cpvRef = useRef<THREE.Group>(null);

  // Animation State: 0 = Stacked, 1 = Split
  const targetExpansion = useRef(0);
  const currentExpansion = useRef(0);

  const fwhm = useMemo(() => {
    if (focusOffset === null) return 0.1;
    const ratio = Math.abs(focusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [focusOffset]);

  // Initial Expand on Mount
  useEffect(() => {
    // Start collapsed, then expand immediately
    currentExpansion.current = 0;
    targetExpansion.current = 1;
  }, []);

  // Worker Reference
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Initialize Worker
    // NOTE: Adjust path './thermal.worker.js' to where you saved the file
    workerRef.current = new Worker(
      new URL("../logic/thermal.worker.js", import.meta.url)
    );

    workerRef.current.onmessage = (e) => {
      const { status, stats, sinkData, baseData, cpvData, error } = e.data;

      if (status === "error") {
        console.error("Worker Error:", error);
        onUpdateStats({ loading: false, status: "Error" });
        return;
      }

      // 1. Update Textures (Main Thread)
      setTexSink(createTexturesFromData(sinkData));
      setTexBase(createTexturesFromData(baseData));
      setTexCPV(createTexturesFromData(cpvData));

      // 2. Update Stats
      onUpdateStats({
        maxTemp: stats.maxTemp,
        pElectric: stats.pElectric,
        loading: false,
        status: "Done",
      });

      setSplit(prev => !prev);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [onUpdateStats]);

  // Initial Expand on Mount
  useEffect(() => {
    // Start collapsed
    currentExpansion.current = 0;
    targetExpansion.current = 0;

    // Add 1.5 second delay before initial split
    const timer = setTimeout(() => {
      targetExpansion.current = 1;
    }, 500);

    return () => clearTimeout(timer);
  }, [split]);

  // Simulation Logic Trigger
  useEffect(() => {
    if (matrixSize === null || magicArea === null || focusOffset === null) {
      return;
    }

    onUpdateStats({ loading: true, status: "Calculating..." });

    const relativePath = new URL('../wasm-embeddings/v3/solar_bg.wasm', import.meta.url).toString();
    const wasmUrl = new URL(relativePath, window.location.origin).href;
    console.log("WASM URL:", wasmUrl);

    // Send data to worker
    workerRef.current?.postMessage({
      fwhm,
      magicArea,
      wasmUrl,
      matrixSize,
    });
  }, [fwhm, magicArea, matrixSize, focusOffset, onUpdateStats]);

  // --- ANIMATION LOOP ---
  // Define geometry constants
  const SINK_TARGET_Y = -0.6;
  const BASE_TARGET_Y = 0;
  const CPV_TARGET_Y = 0.4;

  useFrame((state, delta) => {
    // Smoothly interpolate currentExpansion towards targetExpansion
    // Speed factor: 4.0
    currentExpansion.current = THREE.MathUtils.damp(
      currentExpansion.current,
      targetExpansion.current,
      3.0,
      delta
    );

    const t = currentExpansion.current;

    // Interpolate positions based on t (0 = Center/Stacked, 1 = Target/Split)
    // We assume 'Stacked' is at y=0 for all (or very close)
    if (sinkRef.current)
      sinkRef.current.position.y = THREE.MathUtils.lerp(texSink ? -0.20 : -0.25, SINK_TARGET_Y, t);
    if (baseRef.current)
      baseRef.current.position.y = THREE.MathUtils.lerp(0, BASE_TARGET_Y, t);
    if (cpvRef.current)
      cpvRef.current.position.y = THREE.MathUtils.lerp(0.16, CPV_TARGET_Y, t);
  });

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

  return (
    <group rotation={[Math.PI / 6, Math.PI / 4, 0]} position={[0, 0, 0]}>
      {/* --- LAYER 1: SINK (Aluminum) --- */}
      <group ref={sinkRef} position={[0, 0, 0]}>
        {/* If texture exists, show Heatmap Mesh. If not, show Physical Model with Fins */}
        {texSink && !hasPendingChanges && !status.loading  ? (
          <mesh>
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
        ) : (
          // PHYSICAL MODEL: Heatsink with Fins
          <group>
            {/* Base Plate of Sink */}
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[PLATE_WIDTH, 0.1, PLATE_DEPTH]} />
              <meshStandardMaterial
                color="#A0A0A0"
                roughness={0.5}
                metalness={0.6}
              />
            </mesh>
            {/* Fins Generation */}
            {Array.from({ length: 15 }).map((_, i) => {
              const spacing = PLATE_WIDTH / 15;
              const pos = -PLATE_WIDTH / 2 + spacing / 2 + i * spacing;
              return (
                <mesh key={i} position={[pos, -0.02, 0]}>
                  <boxGeometry args={[0.02, 0.1, PLATE_DEPTH]} />
                  <meshStandardMaterial
                    color="#A0A0A0"
                    roughness={0.5}
                    metalness={0.6}
                  />
                </mesh>
              );
            })}
          </group>
        )}

        <Html position={[0.8, 0, 0]} center>
          <div
            style={{
              ...annotationStyle,
              opacity: status.loading ? "0" : "100",
              transition: "opacity 0.2s",
            }}
          >
            Al
          </div>
        </Html>
      </group>

      {/* --- LAYER 2: BASE (Copper) --- */}
      <group ref={baseRef} position={[0, 0, 0]}>
        <mesh>
          <boxGeometry args={[PLATE_WIDTH, 0.3, PLATE_DEPTH]} />
          {texBase && !hasPendingChanges && !status.loading ? (
            texBase.map((tex, i) => (
              <meshStandardMaterial
                key={i}
                attach={`material-${i}`}
                emissiveMap={tex}
                emissiveIntensity={0.4}
                emissive="white"
                roughness={0.3}
                metalness={0.5}
                color="#8B4513"
              />
            ))
          ) : (
            <meshStandardMaterial
              color="#9e5b54"
              emissive="#9e5b54"
              emissiveIntensity={0.4}
              roughness={0.3}
              metalness={0.2}
            />
          )}
        </mesh>
        <Html position={[0.8, 0, 0]} center>
          <div
            style={{
              ...annotationStyle,
              opacity: status.loading ? "0" : "100",
              transition: "opacity 0.2s",
            }}
          >
            Cu
          </div>
        </Html>
      </group>

      {/* --- LAYER 3: CPV (Silicon + Ag) --- */}
      <group ref={cpvRef} position={[0, 0, 0]}>
        {texCPV && !hasPendingChanges && !status.loading ? (
          // HEATMAP VISUALIZATION
          <mesh>
            <boxGeometry args={[PLATE_WIDTH, 0.02, PLATE_DEPTH]} />
            {texCPV.map((tex, i) => (
              <meshStandardMaterial
                key={i}
                attach={`material-${i}`}
                emissiveMap={tex}
                emissiveIntensity={2.0}
                emissive="white"
                roughness={0.5}
                color="gray"
              />
            ))}
          </mesh>
        ) : (
          // PHYSICAL MODEL: Polished Silver + CPV Cells
          <group>
            {/* Polished Silver Substrate */}
            <mesh>
              <boxGeometry args={[PLATE_WIDTH, 0.02, PLATE_DEPTH]} />
              <meshStandardMaterial
                color="#ffffff"   
                roughness={0.2}
                metalness={0.6} // Reduced from 1.0 to ensure visibility without EnvMap
              />
            </mesh>

            {/* CPV Cells Matrix */}
            {(() => {
              // USE visualMatrixSize HERE instead of matrixSize
              const n = visualMatrixSize; 
              const cellSpacing = (PLATE_WIDTH * 0.9) / n; 
              const startOffset = -((n - 1) * cellSpacing) / 2;
              const cells = [];

              for (let x = 0; x < n; x++) {
                for (let z = 0; z < n; z++) {
                  cells.push(
                    <mesh
                      key={`${x}-${z}`}
                      position={[
                        startOffset + x * cellSpacing,
                        0.02, 
                        startOffset + z * cellSpacing,
                      ]}
                    >
                      <boxGeometry
                        args={[cellSpacing * 0.8, 0.01, cellSpacing * 0.8]}
                      />
                      <meshStandardMaterial
                        color="#1a237e" 
                        roughness={0.2}
                        metalness={0.5}
                      />
                    </mesh>
                  );
                }
              }
              return cells;
            })()}
          </group>
        )}

        <Html position={[0.8, 0, 0]} center>
          <div
            style={{
              ...annotationStyle,
              opacity: status.loading ? "0" : "100",
              transition: "opacity 0.2s",
            }}
          >
            Si+Ag
          </div>
        </Html>
      </group>
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

  const [hasPendingChanges, setHasPendingChanges] = useState(false)

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
    setActiveParams(null);
    setSimStats((prev) => ({ ...prev, loading: false, status: "Stopped" }));
  };

  const onUpdateStats = useCallback((stats: Partial<SimStats>) => {
    setSimStats((prev) => ({ ...prev, ...stats }));
  }, []);


  useEffect(() => {
    setHasPendingChanges(prev => {
      return !activeParams ||
        uiFocusOffset !== activeParams.focusOffset ||
        uiMatrixSize !== activeParams.matrixSize ||
        uiMagicArea !== activeParams.magicArea;
    })
  }, [uiFocusOffset, uiMatrixSize, uiMagicArea, activeParams])

    

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
        <color attach="background" args={["#c4faff"]} />
        <PerspectiveCamera makeDefault position={[4, 0, 0]} fov={40} />
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
          visualMatrixSize={uiMatrixSize} // PASS THE LIVE UI VALUE HERE
          focusOffset={activeParams?.focusOffset ?? null}
          magicArea={activeParams?.magicArea ?? null}
          hasPendingChanges={hasPendingChanges}
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
