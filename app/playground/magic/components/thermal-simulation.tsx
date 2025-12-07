"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";

import { Grid, Stars, Sparkles } from "@react-three/drei";

// --- CONSTANTS ---
const PLATE_WIDTH = 1.5;
const PLATE_DEPTH = 1.5;
const FOCUS_OFFSET_MIN = -3.5;
const FOCUS_OFFSET_MAX = 0;
const MATRIX_SIZE_MIN = 1;
const MATRIX_SIZE_MAX = 5;

// --- TYPES ---
type LayerTextures = [
  THREE.Texture,
  THREE.Texture,
  THREE.Texture,
  THREE.Texture,
  THREE.Texture,
  THREE.Texture
];

interface SimStats {
  maxTemp: number;
  minTemp: number;
  hoverTemp: number | null;
  pElectric: number;
  status: string;
  loading: boolean;
}

interface WorkerMessageData {
  data: Uint8Array;
  width: number;
  height: number;
}

// --- HELPERS ---
const createTexturesFromData = (
  dataArray: WorkerMessageData[]
): LayerTextures => {
  const textures = dataArray.map((item) => {
    const tex = new THREE.DataTexture(item.data, item.width, item.height);
    tex.format = THREE.RGBAFormat;
    tex.type = THREE.UnsignedByteType;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  });

  if (textures.length !== 6) {
    throw new Error(`Expected 6 textures, but received ${textures.length}`);
  }

  return textures as unknown as LayerTextures;
};

// --- SUB-COMPONENTS (UI) ---

const ControlRow = memo(
  ({
    label,
    value,
    unit = "",
    colorClass,
    onDec,
    onInc,
    disableDec,
    disableInc,
  }: {
    label: string;
    value: string | number;
    unit?: string;
    colorClass: string;
    onDec: () => void;
    onInc: () => void;
    disableDec?: boolean;
    disableInc?: boolean;
  }) => (
    <div className="flex items-center justify-center gap-4 bg-neutral-900 p-2 pr-5 rounded-xl text-white shadow-xl border border-white/10">
      <button
        onClick={onDec}
        disabled={disableDec}
        className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition duration-75 active:scale-95 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        -
      </button>
      <div className="flex flex-col items-center min-w-[100px]">
        <span
          className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${colorClass}`}
        >
          {label}
        </span>
        <span className="font-mono text-xl font-bold text-white">
          {value}
          {unit}
        </span>
      </div>
      <button
        onClick={onInc}
        disabled={disableInc}
        className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition duration-75 active:scale-95 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        +
      </button>
    </div>
  )
);
ControlRow.displayName = "ControlRow";

const ToggleRow = memo(
  ({
    label,
    checked,
    onChange,
  }: {
    label: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-center justify-evenly gap-4 bg-neutral-900 p-3 px-5 rounded-xl text-white shadow-xl border border-white/10">
      <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
        {label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative cursor-pointer w-10 h-5 rounded-full transition-all duration-300 ease-out focus:outline-none ${
          checked
            ? "bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.4)]"
            : "bg-white/10 hover:bg-white/20"
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
);
ToggleRow.displayName = "ToggleRow";

const StatItem = memo(
  ({
    label,
    value,
    colorBg,
    colorBorder,
    colorLabel,
    colorValue,
    colSpan = 1,
  }: {
    label: string;
    value: string | number;
    colorBg?: string;
    colorBorder: string;
    colorLabel: string;
    colorValue?: string;
    colSpan?: number;
  }) => (
    <div
      className={`${
        colorBg || "bg-white/5"
      } rounded-lg p-2.5 border ${colorBorder} ${
        colSpan > 1 ? "col-span-" + colSpan : ""
      }`}
    >
      <p className={`text-[9px] uppercase tracking-wider mb-0.5 ${colorLabel}`}>
        {label}
      </p>
      <p className={`font-mono font-bold ${colorValue || "text-white"}`}>
        {value}
      </p>
    </div>
  )
);
StatItem.displayName = "StatItem";

const GaussianOverlay = memo(
  ({
    fwhm,
    matrixSize,
    magicArea,
  }: {
    fwhm: number;
    matrixSize: number;
    magicArea: number;
  }) => {
    const geometry = useMemo(() => {
      // 1. Setup high-res plane
      const geo = new THREE.PlaneGeometry(PLATE_WIDTH, PLATE_DEPTH, 100, 100);
      geo.rotateX(-Math.PI / 2); // Rotate flat

      const posAttribute = geo.attributes.position;
      const vertex = new THREE.Vector3();

      // 2. Math Constants
      // FWHM = 2.355 * sigma. We clamp fwhm to avoid division by zero or infinite spikes.
      const sigma = fwhm / 2.355;
      const twoSigmaSq = 2 * sigma * sigma;

      // Cell Positioning Logic (Must match the physical CPV cell layout)
      const cellSpacing = (PLATE_WIDTH * 0.9) / matrixSize;
      const startOffset = -((matrixSize - 1) * cellSpacing) / 2;

      // 3. Pre-calculate centers
      const centers: { x: number; z: number }[] = [];
      for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
          centers.push({
            x: startOffset + i * cellSpacing,
            z: startOffset + j * cellSpacing,
          });
        }
      }

      // 4. Height Scaling
      // We scale the peak height down as the matrix grows to keep visualization manageable
      // A single peak is height 0.6. A 5x5 matrix scales individual peaks down.
      const baseHeight = 0.5;
      // If peaks overlap significantly (large sigma), the sum grows. We normalize slightly.
      const amplitude =
        (baseHeight * magicArea) /
        (twoSigmaSq * Math.PI * matrixSize * matrixSize * 240);

      // 5. Generate Surface
      for (let i = 0; i < posAttribute.count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);

        let totalY = 0;

        // Sum contribution from every Gaussian center (Superposition)
        for (let c = 0; c < centers.length; c++) {
          const dx = vertex.x - centers[c].x;
          const dz = vertex.z - centers[c].z;
          const distSq = dx * dx + dz * dz;

          // Gaussian: A * exp(-dist^2 / 2*sigma^2)
          totalY += amplitude * Math.exp(-distSq / twoSigmaSq);
        }

        // Update Y
        posAttribute.setXYZ(i, vertex.x, totalY, vertex.z);
      }

      geo.computeVertexNormals();
      return geo;
    }, [fwhm, matrixSize, magicArea]); // Re-run whenever FWHM or MatrixSize changes

    return (
      <group position={[0, 0.03, 0]}>
        {" "}
        {/* Float slightly above CPV layer */}
        {/* 1. The Energy Field (Glow) */}
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#eb757d" // Cyan-500
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* 2. The Topological Lines (Wireframe) */}
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#eb757d" // Cyan-100
            transparent
            opacity={0.15}
            wireframe
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }
);
GaussianOverlay.displayName = "GaussianOverlay";

// --- 3D COMPONENT: THERMAL BOX ---
const ThermalBox = memo(
  ({
    simMatrixSize,
    simFocusOffset,
    simMagicArea,
    // --- NEW PARAMS ---
    simLayerThick,
    simPlateDim,
    simCpvScale,
    simNx,
    simNz,
    simUseCircle,
    // ------------------
    visMatrixSize,
    visFocusOffset,
    visMagicArea,
    // --- ADD THESE NEW PROPS ---
    visCpvScale,
    visUseCircle,
    // ---------------------------
    status,
    showGaussian,
    showAdvanced,
    hasPendingChanges,
    onUpdateStats,
  }: {
    simMatrixSize: number | null;
    simFocusOffset: number | null;
    simMagicArea: number | null;
    // --- NEW TYPES ---
    simLayerThick: number | null;
    simPlateDim: number | null;
    simCpvScale: number | null;
    simNx: number | null;
    simNz: number | null;
    simUseCircle: boolean | null;
    // -----------------
    visMatrixSize: number;
    visFocusOffset: number;
    visMagicArea: number;
    visCpvScale: number;
    visUseCircle: boolean;
    status: SimStats;
    showGaussian: boolean;
    showAdvanced: boolean;
    hasPendingChanges: boolean;
    onUpdateStats: (stats: Partial<SimStats>) => void;
  }) => {
    const [texSink, setTexSink] = useState<LayerTextures | null>(null);
    const [texBase, setTexBase] = useState<LayerTextures | null>(null);
    const [texCPV, setTexCPV] = useState<LayerTextures | null>(null);
    const [tempRange, setTempRange] = useState({ min: 0, max: 100 });

    const sinkRef = useRef<THREE.Group>(null);
    const baseRef = useRef<THREE.Group>(null);
    const cpvRef = useRef<THREE.Group>(null);
    const currentExpansion = useRef(0);
    const workerRef = useRef<Worker | null>(null);

    // Derived States for Math
    const simFwhm = useMemo(() => {
      if (simFocusOffset === null) return 0.1;
      const ratio = Math.abs(simFocusOffset) / 2.5;
      return 0.1 + ratio * 0.5;
    }, [simFocusOffset]);

    const visFwhm = useMemo(() => {
      const ratio = Math.abs(visFocusOffset) / 2.5;
      return 0.1 + ratio * 0.5;
    }, [visFocusOffset]);

    // Force texture cleanup when loading starts
    useEffect(() => {
      if (status.loading) {
        setTexSink(null);
        setTexBase(null);
        setTexCPV(null);
      }
    }, [status.loading]);

    // Dispose textures on unmount
    useEffect(() => {
      return () => {
        texSink?.forEach((t) => t.dispose());
        texBase?.forEach((t) => t.dispose());
        texCPV?.forEach((t) => t.dispose());
      };
    }, [texSink, texBase, texCPV]);

    // --- WORKER LIFECYCLE ---
    useEffect(() => {
      // 1. STOP Condition: If any Sim param is null, we are stopped.
      if (
        simMatrixSize === null ||
        simMagicArea === null ||
        simFocusOffset === null
      ) {
        setTexSink(null);
        setTexBase(null);
        setTexCPV(null);
        return;
      }

      // 2. Start Loading
      onUpdateStats({ loading: true, status: "Calculating..." });

      // 3. Init Worker
      workerRef.current = new Worker(
        new URL("../logic/thermal.worker.js", import.meta.url)
      );

      // 4. Handle Messages
      workerRef.current.onmessage = (e) => {
        const {
          status: msgStatus,
          stats,
          sinkData,
          baseData,
          cpvData,
          error,
        } = e.data;

        if (msgStatus === "error") {
          console.error("Worker Error:", error);
          onUpdateStats({ loading: false, status: "Error" });
          return;
        }

        setTexSink(createTexturesFromData(sinkData));
        setTexBase(createTexturesFromData(baseData));
        setTexCPV(createTexturesFromData(cpvData));

        const consistentMax = stats.maxGlobal || stats.maxTemp;
        const consistentMin = stats.minGlobal;
        setTempRange({ min: consistentMin, max: consistentMax });

        onUpdateStats({
          maxTemp: consistentMax,
          minTemp: consistentMin,
          pElectric: stats.pElectric,
          loading: false,
          status: "Done",
        });
      };

      // 5. WASM & Start
      const relativePath = new URL(
        "../wasm-embeddings/vc3/solar_bg.wasm",
        import.meta.url
      ).toString();
      const wasmUrl = new URL(relativePath, window.location.origin).href;

      workerRef.current.postMessage({
        fwhm: simFwhm,
        magicArea: simMagicArea,
        matrixSize: simMatrixSize,
        // --- NEW PAYLOAD ---
        layerThickness: simLayerThick,
        plateDim: simPlateDim,
        cpvScale: simCpvScale,
        nXy: simNx,
        nZLayer: simNz,
        useCircle: simUseCircle,
        // -------------------
        wasmUrl,
      });

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };
    }, [
      simMatrixSize,
      simMagicArea,
      simFocusOffset,
      simFwhm,
      simLayerThick,
      simPlateDim,
      simCpvScale,
      simNx,
      simNz,
      simUseCircle,
      onUpdateStats,
    ]);

    // --- ANIMATION LOOP ---
    const SINK_TARGET_Y = -0.6;
    const BASE_TARGET_Y = 0;
    const CPV_TARGET_Y = 0.4;

    useFrame((_, delta) => {
      // Expand ONLY if we have results, we are NOT loading, and there are NO pending changes.
      const isVisualizing =
        texSink !== null && !status.loading && !hasPendingChanges;

      const targetExpansion = isVisualizing ? 1 : 0;

      currentExpansion.current = THREE.MathUtils.damp(
        currentExpansion.current,
        targetExpansion,
        3.0,
        delta
      );

      const t = currentExpansion.current;

      if (sinkRef.current)
        sinkRef.current.position.y = THREE.MathUtils.lerp(
          -0.24,
          SINK_TARGET_Y,
          t
        );
      if (baseRef.current)
        baseRef.current.position.y = THREE.MathUtils.lerp(0, BASE_TARGET_Y, t);
      if (cpvRef.current)
        cpvRef.current.position.y = THREE.MathUtils.lerp(0.16, CPV_TARGET_Y, t);
    });

    // --- HOVER LOGIC ---
    const handlePointerMove = useCallback(
      (e: any, textures: LayerTextures | null) => {
        // Only hover if active visualization
        if (!textures || status.loading || hasPendingChanges) return;
        e.stopPropagation();

        const matIndex = e.face?.materialIndex;
        if (matIndex === undefined) return;

        const texture = textures[matIndex];
        const image = texture.image;
        if (!e.uv || !image) return;

        const x = Math.floor(e.uv.x * image.width);
        const y = Math.floor(e.uv.y * image.height);
        const index = (y * image.width + x) * 4;
        const r = image.data[index];
        const g = image.data[index + 1];

        let normVal = 0;
        const rn = r / 255;
        const gn = g / 255;

        if (gn > 0.05) {
          normVal = gn / 2.0 + 0.5;
        } else {
          normVal = rn / 2.0;
        }

        const actualTemp =
          normVal * (tempRange.max - tempRange.min) + tempRange.min;
        onUpdateStats({ hoverTemp: actualTemp });
      },
      [status.loading, hasPendingChanges, tempRange, onUpdateStats]
    );

    const handlePointerOut = useCallback(() => {
      onUpdateStats({ hoverTemp: null });
    }, [onUpdateStats]);

    // --- MEMOIZED ASSETS ---
    const fallbackMaterials = useMemo(() => {
      return {
        sink: new THREE.MeshStandardMaterial({
          color: "#A0A0A0",
          roughness: 0.5,
          metalness: 0.6,
        }),
        base: new THREE.MeshStandardMaterial({
          color: "#9e5b54",
          emissive: "#9e5b54",
          emissiveIntensity: 0.4,
          roughness: 0.3,
          metalness: 0.2,
        }),
        cpvSubstrate: new THREE.MeshStandardMaterial({
          color: "#ffffff",
          roughness: 0.2,
          metalness: 0.6,
        }),
        cpvCell: new THREE.MeshStandardMaterial({
          color: "#1a237e",
          roughness: 0.2,
          metalness: 0.5,
        }),
      };
    }, []);

    const fallbackGeos = useMemo(() => {
      return {
        sinkMain: new THREE.BoxGeometry(PLATE_WIDTH, 0.1, PLATE_DEPTH),
        sinkFin: new THREE.BoxGeometry(0.02, 0.1, PLATE_DEPTH),
        base: new THREE.BoxGeometry(PLATE_WIDTH, 0.3, PLATE_DEPTH),
        cpvSubstrate: new THREE.BoxGeometry(PLATE_WIDTH, 0.02, PLATE_DEPTH),
      };
    }, []);

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

    const areLabelsVisible =
      !status.loading && !hasPendingChanges && !showAdvanced;

    return (
      <group rotation={[Math.PI / 6, Math.PI / 4, 0]} position={[0, 0, 0]}>
        {/* SINK */}
        <group ref={sinkRef}>
          {texSink && !hasPendingChanges && !status.loading ? (
            <mesh
              onPointerMove={(e) => handlePointerMove(e, texSink)}
              onPointerOut={handlePointerOut}
              geometry={fallbackGeos.sinkMain}
            >
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
            <group>
              <mesh
                position={[0, 0.04, 0]}
                geometry={fallbackGeos.sinkMain}
                material={fallbackMaterials.sink}
              />
              {Array.from({ length: 15 }).map((_, i) => {
                const spacing = PLATE_WIDTH / 15;
                const pos = -PLATE_WIDTH / 2 + spacing / 2 + i * spacing;
                return (
                  <mesh
                    key={i}
                    position={[pos, -0.02, 0]}
                    geometry={fallbackGeos.sinkFin}
                    material={fallbackMaterials.sink}
                  />
                );
              })}
            </group>
          )}
          <Html position={[0.8, 0, 0]} center zIndexRange={[10, 0]}>
            <div
              style={{
                ...annotationStyle,
                opacity: areLabelsVisible ? "1" : "0",
                transition: "opacity 0.2s ease-in-out",
                pointerEvents: "none",
              }}
            >
              Al
            </div>
          </Html>
        </group>

        {/* BASE */}
        <group ref={baseRef}>
          <mesh
            onPointerMove={(e) => handlePointerMove(e, texBase)}
            onPointerOut={handlePointerOut}
            geometry={fallbackGeos.base}
          >
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
              <primitive object={fallbackMaterials.base} />
            )}
          </mesh>
          <Html position={[0.8, 0, 0]} center zIndexRange={[10, 0]}>
            <div
              style={{
                ...annotationStyle,
                opacity: areLabelsVisible ? "1" : "0",
                transition: "opacity 0.2s ease-in-out",
                pointerEvents: "none",
              }}
            >
              Cu
            </div>
          </Html>
        </group>

        {/* CPV */}
        <group ref={cpvRef}>
          {texCPV && !hasPendingChanges && !status.loading ? (
            <mesh
              onPointerMove={(e) => handlePointerMove(e, texCPV)}
              onPointerOut={handlePointerOut}
              geometry={fallbackGeos.cpvSubstrate}
            >
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
            <group>
              <mesh
                geometry={fallbackGeos.cpvSubstrate}
                material={fallbackMaterials.cpvSubstrate}
              />

              {/* --- UPDATED CPV CELLS GENERATION --- */}
              {(() => {
                const n = visMatrixSize;
                const cellSpacing = (PLATE_WIDTH * 0.9) / n;
                const startOffset = -((n - 1) * cellSpacing) / 2;

                // 1. Calculate size based on UI Scale Input
                const cellSize = cellSpacing * visCpvScale;

                // 2. Determine Geometry based on UI Shape Input
                let cellGeo;
                if (visUseCircle) {
                  // Cylinder: radiusTop, radiusBottom, height, segments
                  cellGeo = new THREE.CylinderGeometry(
                    cellSize / 2,
                    cellSize / 2,
                    0.01,
                    32
                  );
                } else {
                  // Box: width, height, depth
                  cellGeo = new THREE.BoxGeometry(cellSize, 0.01, cellSize);
                }

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
                        geometry={cellGeo}
                        material={fallbackMaterials.cpvCell}
                      />
                    );
                  }
                }
                return cells;
              })()}
              {/* ------------------------------------ */}

              {/* GAUSSIAN PREVIEW - Only shown when in "Setup/Pending" mode and toggle ON */}
              {showGaussian && (
                <GaussianOverlay
                  fwhm={visFwhm}
                  matrixSize={visMatrixSize}
                  magicArea={visMagicArea}
                />
              )}
            </group>
          )}
          <Html position={[0.8, 0, 0]} center zIndexRange={[20, 0]}>
            <div
              style={{
                ...annotationStyle,
                opacity: areLabelsVisible ? "1" : "0",
                transition: "opacity 0.2s ease-in-out",
                pointerEvents: "none",
              }}
            >
              Si+Ag
            </div>
          </Html>
        </group>
      </group>
    );
  }
);
ThermalBox.displayName = "ThermalBox";

// --- MAIN PAGE COMPONENT ---
export default function ThermalPage() {
  const [simStats, setSimStats] = useState<SimStats>({
    maxTemp: 0,
    pElectric: 0,
    minTemp: 0,
    hoverTemp: null,
    status: "Ready to Start",
    loading: false,
  });

  // UI STATE (Visual params driven by sliders)
  const [uiFocusOffset, setUiFocusOffset] = useState(-1.5);
  const [uiMatrixSize, setUiMatrixSize] = useState(5);
  const [uiMagicArea, setUiMagicArea] = useState(75);
  const [showGaussian, setShowGaussian] = useState(false);

  // --- NEW ADVANCED UI STATE ---
  const [showAdvanced, setShowAdvanced] = useState(false); // Toggle for UI
  const [uiLayerThick, setUiLayerThick] = useState(0.03);
  const [uiPlateDim, setUiPlateDim] = useState(1.5);
  const [uiCpvScale, setUiCpvScale] = useState(0.7);
  const [uiNx, setUiNx] = useState(40);
  const [uiNz, setUiNz] = useState(8);
  const [uiUseCircle, setUiUseCircle] = useState(false);
  // -----------------------------

  // SIMULATION STATE
  const [activeParams, setActiveParams] = useState<{
    focusOffset: number;
    matrixSize: number;
    magicArea: number;
    // --- NEW ACTIVE PARAMS ---
    layerThick: number;
    plateDim: number;
    cpvScale: number;
    nx: number;
    nz: number;
    useCircle: boolean;
    // -------------------------
  } | null>(null);

  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const displayFwhm = useMemo(() => {
    const ratio = Math.abs(uiFocusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [uiFocusOffset]);

  const handleRunSimulation = () => {
    setSimStats((prev) => ({
      ...prev,
      loading: true,
      status: "Calculating...",
      maxTemp: 0,
      pElectric: 0,
    }));

    // Pass all parameters to active state
    setActiveParams({
      focusOffset: uiFocusOffset,
      matrixSize: uiMatrixSize,
      magicArea: uiMagicArea,
      layerThick: uiLayerThick,
      plateDim: uiPlateDim,
      cpvScale: uiCpvScale,
      nx: uiNx,
      nz: uiNz,
      useCircle: uiUseCircle,
    });
  };

  const handleStopSimulation = () => {
    setActiveParams(null);
    setSimStats((prev) => ({ ...prev, loading: false, status: "Stopped" }));
  };

  const onUpdateStats = useCallback((stats: Partial<SimStats>) => {
    setSimStats((prev) => ({ ...prev, ...stats }));
  }, []);

  // Update Pending Changes Logic
  useEffect(() => {
    if (!activeParams) {
      setHasPendingChanges(false);
      return;
    }
    setHasPendingChanges(
      uiFocusOffset !== activeParams.focusOffset ||
        uiMatrixSize !== activeParams.matrixSize ||
        uiMagicArea !== activeParams.magicArea ||
        // Check new params
        uiLayerThick !== activeParams.layerThick ||
        uiPlateDim !== activeParams.plateDim ||
        uiCpvScale !== activeParams.cpvScale ||
        uiNx !== activeParams.nx ||
        uiNz !== activeParams.nz ||
        uiUseCircle !== activeParams.useCircle
    );
  }, [
    uiFocusOffset,
    uiMatrixSize,
    uiMagicArea,
    activeParams,
    uiLayerThick,
    uiPlateDim,
    uiCpvScale,
    uiNx,
    uiNz,
    uiUseCircle,
  ]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl">
      {/* --- HEADER --- */}
      <div className="absolute w-full top-0 left-0 px-8 py-3 z-50 pointer-events-none select-none flex justify-between items-center transition-all duration-1000 ease-out border-b border-white/10 bg-neutral-900 shadow-2xl">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">
            STARRY SKY
          </h1>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-cyan-400 uppercase tracking-widest">
            <span className="opacity-80">Aissam Khadraoui</span>
            <span className="text-white/20">•</span>
            <span className="opacity-80">Candela García</span>
            <span className="text-white/20">•</span>
            <span className="opacity-80">Filip Denis</span>
          </div>
        </div>

        <Link
          href="/playground/magic"
          className="pointer-events-auto group relative overflow-hidden rounded-full bg-cyan-600 px-6 py-2.5 transition-all duration-300 hover:bg-cyan-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] border border-white/20 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <span className="relative z-10 text-xs font-extrabold uppercase tracking-wider text-white">
              Visualització telescopi
            </span>
            <span className="relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </div>
        </Link>
      </div>

      {/* --- LOADING OVERLAY --- */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center bg-black/90 transition-all duration-500 ${
          simStats.loading
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <h1 className="hover:scale-105 transform transition-transform duration-700 text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-pulse tracking-widest">
            STARRY SKY
          </h1>
          <p className="cursor-pointer text-white/80 font-mono mt-4 text-sm tracking-[0.5em] uppercase">
            Executant simulació...
          </p>

          <button
            onClick={handleStopSimulation}
            className="mt-10 group relative px-8 py-3 bg-red-500/10 border border-red-500/50 text-red-50 rounded-full overflow-hidden transition-all duration-300 hover:bg-red-600 hover:border-red-600 hover:text-white shadow-[0_0_20px_rgba(220,38,38,0.2)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] cursor-pointer"
          >
            <span className="relative z-10 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
                  clipRule="evenodd"
                />
              </svg>
              Aturar
            </span>
          </button>
        </div>
      </div>

      {/* --- 3D SCENE --- */}
      <Canvas
        shadows
        dpr={1}
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
          depth: true,
        }}
      >
        {/* === BACKGROUND & ATMOSPHERE: "Technical Starry Sky" === */}

        {/* 1. Base Void Color (Deep Space Blue) */}
        <color attach="background" args={["#050a14"]} />

        {/* 2. Fog: Blends the floor and distant objects into the void color */}
        <fog attach="fog" args={["#050a14", 12, 45]} />

        {/* 3. The Technical Grid Floor */}
        <Grid
          position={[0, -1.1, 0]} // Sitting slightly below the heat sink
          args={[10.5, 10.5]} // Large area
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1f55a1" // Subtle dark blue-grey for minor lines
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#4fa9c9" // Brighter cyan for major sections, matching UI
          fadeDistance={25} // Fades out into the fog
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        {/* 4. Distant Stars (The "Sky") */}
        {/* Pushed far back so they don't intersect the model */}
        <Stars
          radius={100} // Large radius to keep them distant
          depth={10}
          count={2000}
          factor={5} // Slightly larger stars
          saturation={0.3} // Desaturated so thermal colors pop
          fade
          speed={0.3} // Slow twinkling
        />

        {/* 5. Floating "Star Dust" Particles (Immediate Atmosphere) */}
        {/* Subtle floating points adding depth around the model */}
        <Sparkles
          count={30}
          scale={3} // The volume they occupy
          size={2} // Particle size
          speed={0.3} // Very slow gentle drift
          opacity={0.5} // Semi-transparent
          color="#88ccff" // Light cyan/blue tint
          noise={0.5}
        />
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
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.0001}
          position={[10, 20, 5]}
          intensity={2.0}
          castShadow
          color="#fffaed"
        />

        <ThermalBox
          // SIMULATION PARAMS (Worker)
          simMatrixSize={activeParams?.matrixSize ?? null}
          simFocusOffset={activeParams?.focusOffset ?? null}
          simMagicArea={activeParams?.magicArea ?? null}
          simLayerThick={activeParams?.layerThick ?? null}
          simPlateDim={activeParams?.plateDim ?? null}
          simCpvScale={activeParams?.cpvScale ?? null}
          simNx={activeParams?.nx ?? null}
          simNz={activeParams?.nz ?? null}
          simUseCircle={activeParams?.useCircle ?? null}
          // VISUALIZATION PARAMS (UI)
          visMatrixSize={uiMatrixSize}
          visFocusOffset={uiFocusOffset}
          visMagicArea={uiMagicArea}
          // --- NEW CONNECTIONS ---
          visCpvScale={uiCpvScale} // Connects Slider to visual size
          visUseCircle={uiUseCircle} // Connects Toggle to visual shape
          // -----------------------

          hasPendingChanges={hasPendingChanges}
          status={simStats}
          showGaussian={showGaussian}
          showAdvanced={showAdvanced}
          onUpdateStats={onUpdateStats}
        />
      </Canvas>

      {/* --- LEFT CONTROL PANEL --- */}
      <div className="absolute z-30 top-28 left-8 flex flex-col items-start gap-4 pointer-events-auto">
        <ControlRow
          label="Desplaçament"
          value={
            uiFocusOffset > 0
              ? "+" + uiFocusOffset.toFixed(1)
              : uiFocusOffset.toFixed(1)
          }
          colorClass="text-cyan-400"
          onDec={() =>
            setUiFocusOffset((p) => Math.max(p - 0.5, FOCUS_OFFSET_MIN))
          }
          onInc={() =>
            setUiFocusOffset((p) => Math.min(p + 0.5, FOCUS_OFFSET_MAX))
          }
        />

        <ControlRow
          label="Matriu NxN"
          value={`${uiMatrixSize}x${uiMatrixSize}`}
          colorClass="text-yellow-400"
          onDec={() => setUiMatrixSize((p) => Math.max(p - 1, MATRIX_SIZE_MIN))}
          onInc={() => setUiMatrixSize((p) => Math.min(p + 1, MATRIX_SIZE_MAX))}
        />

        <ControlRow
          label="Àrea (m²)"
          value={uiMagicArea}
          colorClass="text-green-400"
          onDec={() => setUiMagicArea((p) => Math.max(p - 5, 10))}
          onInc={() => setUiMagicArea((p) => Math.min(p + 5, 240))}
        />

        {/* TOGGLE LOGIC: Show if Stopped OR if Running but has pending changes */}
        {!simStats.loading && (!activeParams || hasPendingChanges) && (
          <div className="w-full">
            <ToggleRow
              label="Veure Distribució"
              checked={showGaussian}
              onChange={setShowGaussian}
            />
          </div>
        )}

        {/* --- ADVANCED SETTINGS TRIGGER BUTTON --- */}
        <button
          onClick={() => setShowAdvanced(true)}
          className="group cursor-pointer w-full flex items-center justify-between px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl transition-all duration-300"
        >
          <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-400 transition-colors">
            Configuració Avançada
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
            />
          </svg>
        </button>

        <button
          onClick={simStats.loading ? undefined : handleRunSimulation}
          disabled={simStats.loading}
          className={`w-full cursor-pointer group flex items-center justify-center gap-3 px-6 py-4 rounded-xl shadow-xl transition-all duration-300 border ${
            simStats.loading
              ? "cursor-wait bg-neutral-800/80 border-white/10 text-gray-500"
              : hasPendingChanges
              ? "bg-cyan-600/90 border-cyan-400 hover:bg-cyan-500 hover:scale-105 shadow-cyan-900/50 text-white"
              : "bg-neutral-900 border-white/20 text-gray-300 hover:bg-neutral-700 hover:text-white"
          }`}
        >
          {simStats.loading ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5 text-cyan-400 animate-spin"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          ) : (
            <div
              className={`w-3 h-3 rounded-full shadow-lg ${
                hasPendingChanges ? "bg-white animate-pulse" : "bg-green-500"
              }`}
            />
          )}
          <span className="font-extrabold uppercase tracking-widest text-xs">
            {simStats.loading
              ? "Processant..."
              : activeParams === null
              ? "Iniciar Simulació"
              : hasPendingChanges
              ? "Simular Canvis"
              : "Sistema Actualitzat"}
          </span>
        </button>

        {/* --- ADVANCED SETTINGS MODAL --- */}
        {showAdvanced && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Modal Container - Widened to max-w-3xl for grid layout */}
            <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-3xl relative animate-in zoom-in-95 duration-200 mt-16 md:mt-0">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <h2 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white">
                  Paràmetres Avançats
                </h2>
                <button
                  onClick={() => setShowAdvanced(false)}
                  className="cursor-pointer text-gray-500 hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Content - Grid Layout (2 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ControlRow
                  label="Gruix Placa"
                  value={uiLayerThick.toFixed(3)}
                  unit="m"
                  colorClass="text-purple-400"
                  onDec={() =>
                    setUiLayerThick((p) => Math.max(p - 0.005, 0.005))
                  }
                  onInc={() => setUiLayerThick((p) => Math.min(p + 0.005, 0.1))}
                />
                <ControlRow
                  label="Mida Placa"
                  value={uiPlateDim.toFixed(1)}
                  unit="m"
                  colorClass="text-purple-400"
                  onDec={() => setUiPlateDim((p) => Math.max(p - 0.1, 0.5))}
                  onInc={() => setUiPlateDim((p) => Math.min(p + 0.1, 3.0))}
                />
                <ControlRow
                  label="Escala CPV"
                  value={(uiCpvScale * 100).toFixed(0)}
                  unit="%"
                  colorClass="text-pink-400"
                  onDec={() => setUiCpvScale((p) => Math.max(p - 0.1, 0.1))}
                  onInc={() => setUiCpvScale((p) => Math.min(p + 0.1, 1.0))}
                />
                <ControlRow
                  label="Resolució XY"
                  value={uiNx}
                  colorClass="text-pink-400"
                  onDec={() => setUiNx((p) => Math.max(p - 10, 10))}
                  onInc={() => setUiNx((p) => Math.min(p + 10, 100))}
                />
                <ControlRow
                  label="Resolució Z"
                  value={uiNz}
                  colorClass="text-pink-400"
                  onDec={() => setUiNz((p) => Math.max(p - 1, 3))}
                  onInc={() => setUiNz((p) => Math.min(p + 1, 20))}
                />
                <ToggleRow
                  label="Forma Circular"
                  checked={uiUseCircle}
                  onChange={setUiUseCircle}
                />
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setShowAdvanced(false)}
                  className="px-6 py-2 cursor-pointer rounded-full bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-all border border-white/10"
                >
                  Confirmar Canvis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- RIGHT STATS PANEL --- */}
      <div className="absolute top-28 right-8 w-[320px] pointer-events-auto bg-neutral-900 p-5 rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 hover:border-cyan-500/30">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
            Resultats en Temps Real
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-white">
          <StatItem
            label="Àrea Telescopi"
            value={(activeParams?.magicArea ?? uiMagicArea) + " m²"}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />
          <StatItem
            label="Matriu CPV"
            value={`${activeParams?.matrixSize ?? uiMatrixSize} x ${
              activeParams?.matrixSize ?? uiMatrixSize
            }`}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />

          <StatItem
            label="FWHM"
            value={displayFwhm.toFixed(3) + " m"}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />

          {activeParams &&
          simStats.maxTemp > 0 &&
          simStats.status !== "Stopped" &&
          !simStats.loading &&
          !hasPendingChanges ? (
            <>
              <StatItem
                label="Potència Elec."
                value={simStats.pElectric.toFixed(1) + " W"}
                colorBg="bg-green-900/20"
                colorBorder="border-green-500/30"
                colorLabel="text-green-300"
                colorValue="text-green-400"
              />
              <StatItem
                label="Temp. Màxima"
                value={simStats.maxTemp.toFixed(1) + " °C"}
                colorBg="bg-red-900/20"
                colorBorder="border-red-500/30"
                colorLabel="text-red-300"
                colorValue="text-red-400"
              />
              {/* Complex item for hover/FWHM */}
              <div className="col-span-1 bg-yellow-900/20 rounded-lg p-2.5 border border-yellow-500/30 flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-yellow-300 uppercase tracking-wider mb-0.5">
                    Temp. Punter
                  </p>
                  <p className="font-mono text-lg font-bold text-yellow-400">
                    {simStats.hoverTemp !== null &&
                    simStats.hoverTemp !== undefined
                      ? `${simStats.hoverTemp.toFixed(1)} °C`
                      : "--.- °C"}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 py-6 text-center text-xs text-gray-500 italic border border-dashed border-white/10 rounded-lg">
              {hasPendingChanges
                ? "Paràmetres modificats. Executeu la simulació."
                : "Inicieu la simulació per veure resultats tèrmics."}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-[10px] text-gray-400 leading-tight">
            <span className="text-cyan-400 font-bold">NOTA:</span> Simulació
            Simplificada en Web. Per a precisió científica, utilitzeu
            l&apos;entorn MATLAB.
          </p>
        </div>
      </div>
    </div>
  );
}
