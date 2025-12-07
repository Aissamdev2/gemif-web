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
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
  Grid,
  Stars,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";

// --- CONSTANTS & MATERIALS ---
const PLATE_WIDTH = 1.5;
const PLATE_DEPTH = 1.5;
const FOCUS_OFFSET_MIN = -3.5;
const FOCUS_OFFSET_MAX = 0;
const MATRIX_SIZE_MIN = 1;
const MATRIX_SIZE_MAX = 7;

type MaterialDef = {
  name: string;
  kt: number;
  emi: number;
  rho: number;
  color: string;
  metalness: number;
  roughness: number;
};

// --- MATERIALS DATABASE ---
// Added 'cost' in €/kg (Approximate raw + processing estimates)
const MATERIALS: Record<string, MaterialDef & { cost: number }> = {
  "Al-1050A (Anodized)": {
    name: "Al-1050A (High Cond.)",
    kt: 220.0,
    emi: 0.85,
    rho: 2705,
    cost: 4.5, // Cheap, widely available
    color: "#4a4a4a",
    metalness: 0.5,
    roughness: 0.7,
  },
  "Al-6061 (Anodized)": {
    name: "Al-6061 (Structural)",
    kt: 167.0,
    emi: 0.85,
    rho: 2700,
    cost: 5.0, // Standard structural alloy
    color: "#5c5c5c",
    metalness: 0.5,
    roughness: 0.7,
  },
  "Mg-AZ31B (Coated)": {
    name: "Magnesium AZ31B",
    kt: 96.0,
    emi: 0.80,
    rho: 1770,
    cost: 12.0, // More expensive, difficult to machine
    color: "#e0e0e0",
    metalness: 0.3,
    roughness: 0.5,
  },
  "Graphite (PGS)": {
    name: "Graphite PGS",
    kt: 700.0,
    emi: 0.95,
    rho: 2100,
    cost: 150.0, // Engineered material, very expensive per volume
    color: "#252525",
    metalness: 0.2,
    roughness: 0.9,
  },
  "Copper (Oxidized)": {
    name: "Copper (Heavy Ref.)",
    kt: 390.0,
    emi: 0.65,
    rho: 8960,
    cost: 10.0, // Commodity price fluctuation
    color: "#ff8c42",
    metalness: 0.4,
    roughness: 0.4,
  },
};

// --- FIXED LAYER CONSTANTS ---
const LAYER_COSTS = {
  // CPV Cells (Silicon/III-V multijunction)
  // Priced per Area (m2) because thickness is negligible for volume pricing
  CPV_PRICE_PER_M2: 800, 
  
  // Silver Sintering / Paste (Ag)
  // Very thin layer, but Silver is expensive (~€800/kg)
  AG_THICKNESS: 0.00005, // 50 microns
  AG_DENSITY: 10490,     // kg/m3
  AG_COST_PER_KG: 850,   // €/kg
};

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

// NEW: Material Selector Component with Info Display
const MaterialSelector = memo(
  ({
    label,
    selectedKey,
    onChange,
    colorClass,
  }: {
    label: string;
    selectedKey: string;
    onChange: (val: string) => void;
    colorClass: string;
  }) => {
    // Helper to format the info string inside the option
    const formatMatInfo = (key: string) => {
      const m = MATERIALS[key];
      // k=W/mK, ε=Emissivity, ρ=kg/m³
      return `${m.name} | k:${m.kt.toFixed(0)} | ε:${m.emi.toFixed(2)} | ρ:${
        m.rho
      }`;
    };

    return (
      <div className="flex flex-col gap-2 bg-neutral-900 p-3 rounded-xl text-white shadow-xl border border-white/10 col-span-1 md:col-span-3">
        <div className="flex justify-between items-end">
          <span
            className={`text-[10px] uppercase tracking-widest font-bold ${colorClass}`}
          >
            {label}
          </span>
          {/* Show details of currently selected material small next to label */}
          <span className="text-[9px] font-mono text-gray-400 opacity-80 hidden sm:block">
            k (W/mK) • ε (Rad) • ρ (kg/m³)
          </span>
        </div>

        <div className="relative">
          <select
            value={selectedKey}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-xs md:text-sm font-mono text-white focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none hover:bg-white/10 transition-colors"
          >
            {Object.keys(MATERIALS).map((key) => (
              <option key={key} value={key} className="bg-neutral-900 py-2">
                {formatMatInfo(key)}
              </option>
            ))}
          </select>

          {/* Custom Arrow Icon */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white/50">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }
);
MaterialSelector.displayName = "MaterialSelector";

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
      const geo = new THREE.PlaneGeometry(PLATE_WIDTH, PLATE_DEPTH, 100, 100);
      geo.rotateX(-Math.PI / 2);

      const posAttribute = geo.attributes.position;
      const vertex = new THREE.Vector3();

      const sigma = fwhm / 2.355;
      const twoSigmaSq = 2 * sigma * sigma;

      const cellSpacing = (PLATE_WIDTH * 0.9) / matrixSize;
      const startOffset = -((matrixSize - 1) * cellSpacing) / 2;

      const centers: { x: number; z: number }[] = [];
      for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
          centers.push({
            x: startOffset + i * cellSpacing,
            z: startOffset + j * cellSpacing,
          });
        }
      }

      const baseHeight = 0.5;
      const amplitude =
        (baseHeight * magicArea) /
        (twoSigmaSq * Math.PI * matrixSize * matrixSize * 240);

      for (let i = 0; i < posAttribute.count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);
        let totalY = 0;
        for (let c = 0; c < centers.length; c++) {
          const dx = vertex.x - centers[c].x;
          const dz = vertex.z - centers[c].z;
          const distSq = dx * dx + dz * dz;
          totalY += amplitude * Math.exp(-distSq / twoSigmaSq);
        }
        posAttribute.setXYZ(i, vertex.x, totalY, vertex.z);
      }
      geo.computeVertexNormals();
      return geo;
    }, [fwhm, matrixSize, magicArea]);

    return (
      <group position={[0, 0.03, 0]}>
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#eb757d"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh geometry={geometry}>
          <meshBasicMaterial
            color="#eb757d"
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
    simLayerThick,
    simSinkThick, // NEW
    simPlateDim,
    simCpvScale,
    simNx,
    simNz,
    simUseCircle,
    simBaseMatKey, // NEW
    simSinkMatKey, // NEW
    visMatrixSize,
    visFocusOffset,
    visMagicArea,
    visCpvScale,
    visUseCircle,
    visBaseMatKey, // NEW
    visSinkMatKey, // NEW
    status,
    showGaussian,
    showAdvanced,
    hasPendingChanges,
    onUpdateStats,
  }: {
    simMatrixSize: number | null;
    simFocusOffset: number | null;
    simMagicArea: number | null;
    simLayerThick: number | null;
    simSinkThick: number | null;
    simPlateDim: number | null;
    simCpvScale: number | null;
    simNx: number | null;
    simNz: number | null;
    simUseCircle: boolean | null;
    simBaseMatKey: string | null;
    simSinkMatKey: string | null;
    visMatrixSize: number;
    visFocusOffset: number;
    visMagicArea: number;
    visCpvScale: number;
    visUseCircle: boolean;
    visBaseMatKey: string;
    visSinkMatKey: string;
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

    // Derived States
    const simFwhm = useMemo(() => {
      if (simFocusOffset === null) return 0.17;
      const ratio = Math.abs(simFocusOffset) / 2.5;
      return 0.17 + ratio * 0.5;
    }, [simFocusOffset]);

    const visFwhm = useMemo(() => {
      const ratio = Math.abs(visFocusOffset) / 2.5;
      return 0.17 + ratio * 0.5;
    }, [visFocusOffset]);

    // Cleanup Textures
    useEffect(() => {
      if (status.loading) {
        setTexSink(null);
        setTexBase(null);
        setTexCPV(null);
      }
    }, [status.loading]);

    useEffect(() => {
      return () => {
        texSink?.forEach((t) => t.dispose());
        texBase?.forEach((t) => t.dispose());
        texCPV?.forEach((t) => t.dispose());
      };
    }, [texSink, texBase, texCPV]);

    // --- WORKER LIFECYCLE ---
    useEffect(() => {
      if (
        simMatrixSize === null ||
        simMagicArea === null ||
        simFocusOffset === null ||
        !simBaseMatKey ||
        !simSinkMatKey
      ) {
        setTexSink(null);
        setTexBase(null);
        setTexCPV(null);
        return;
      }

      onUpdateStats({ loading: true, status: "Calculating..." });

      workerRef.current = new Worker(
        new URL("../logic/thermal.worker.js", import.meta.url)
      );

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

      const relativePath = new URL(
        "../wasm-embeddings/vc4/solar_bg.wasm",
        import.meta.url
      ).toString();
      const wasmUrl = new URL(relativePath, window.location.origin).href;

      // Get Material Props
      const baseMat = MATERIALS[simBaseMatKey];
      const sinkMat = MATERIALS[simSinkMatKey];

      workerRef.current.postMessage({
        fwhm: simFwhm,
        magicArea: simMagicArea,
        matrixSize: simMatrixSize,
        layerThickness: simLayerThick,
        sinkThickness: simSinkThick, // Pass to worker
        plateDim: simPlateDim,
        cpvScale: simCpvScale,
        nXy: simNx,
        nZLayer: simNz,
        useCircle: simUseCircle,
        // Material props
        baseKt: baseMat.kt,
        baseEmi: baseMat.emi,
        sinkKt: sinkMat.kt,
        sinkEmi: sinkMat.emi,
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
      simSinkThick,
      simPlateDim,
      simCpvScale,
      simNx,
      simNz,
      simUseCircle,
      simBaseMatKey,
      simSinkMatKey,
      onUpdateStats,
    ]);

    // --- ANIMATION ---
    const SINK_TARGET_Y = -0.6;
    const BASE_TARGET_Y = 0;
    const CPV_TARGET_Y = 0.4;

    useFrame((_, delta) => {
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

    // --- HOVER ---
    const handlePointerMove = useCallback(
      (e: any, textures: LayerTextures | null) => {
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
        if (gn > 0.05) normVal = gn / 2.0 + 0.5;
        else normVal = rn / 2.0;
        const actualTemp =
          normVal * (tempRange.max - tempRange.min) + tempRange.min;
        onUpdateStats({ hoverTemp: actualTemp });
      },
      [status.loading, hasPendingChanges, tempRange, onUpdateStats]
    );

    const handlePointerOut = useCallback(() => {
      onUpdateStats({ hoverTemp: null });
    }, [onUpdateStats]);

    const visualMaterials = useMemo(() => {
      const baseMatDef = MATERIALS[visBaseMatKey];
      const sinkMatDef = MATERIALS[visSinkMatKey];

      return {
        sink: new THREE.MeshStandardMaterial({
          color: sinkMatDef.color,
          // Self-illuminate slightly so it's always visible
          emissive: sinkMatDef.color,
          emissiveIntensity: 0.25,
          // Low metalness prevents reflecting the black sky too much
          metalness: 0.3,
          roughness: sinkMatDef.roughness,
        }),
        base: new THREE.MeshStandardMaterial({
          color: baseMatDef.color,
          emissive: baseMatDef.color,
          emissiveIntensity: 0.25,
          metalness: 0.3,
          roughness: baseMatDef.roughness,
        }),
        cpvSubstrate: new THREE.MeshStandardMaterial({
          color: "#ffffff",
          emissive: "#ffffff",
          emissiveIntensity: 0.2,
          roughness: 0.2,
          metalness: 0.1,
        }),
        cpvCell: new THREE.MeshStandardMaterial({
          color: "#1a237e",
          emissive: "#1a237e",
          emissiveIntensity: 0.4, // Cells should pop
          roughness: 0.2,
          metalness: 0.1,
        }),
      };
    }, [visBaseMatKey, visSinkMatKey]);

    

    const geometries = useMemo(() => {
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
              geometry={geometries.sinkMain}
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
                geometry={geometries.sinkMain}
                material={visualMaterials.sink}
              />
              {Array.from({ length: 15 }).map((_, i) => {
                const spacing = PLATE_WIDTH / 15;
                const pos = -PLATE_WIDTH / 2 + spacing / 2 + i * spacing;
                return (
                  <mesh
                    key={i}
                    position={[pos, -0.02, 0]}
                    geometry={geometries.sinkFin}
                    material={visualMaterials.sink}
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
              }}
            >
              {MATERIALS[visSinkMatKey].name.split(" ")[0]}
            </div>
          </Html>
        </group>

        {/* BASE */}
        <group ref={baseRef}>
          <mesh
            onPointerMove={(e) => handlePointerMove(e, texBase)}
            onPointerOut={handlePointerOut}
            geometry={geometries.base}
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
                  metalness={0.9}
                  color="#8B4513"
                />
              ))
            ) : (
              <primitive object={visualMaterials.base} />
            )}
          </mesh>
          <Html position={[0.8, 0, 0]} center zIndexRange={[10, 0]}>
            <div
              style={{
                ...annotationStyle,
                opacity: areLabelsVisible ? "1" : "0",
                transition: "opacity 0.2s ease-in-out",
              }}
            >
              {MATERIALS[visBaseMatKey].name.split(" ")[0]}
            </div>
          </Html>
        </group>

        {/* CPV */}
        <group ref={cpvRef}>
          {texCPV && !hasPendingChanges && !status.loading ? (
            <mesh
              onPointerMove={(e) => handlePointerMove(e, texCPV)}
              onPointerOut={handlePointerOut}
              geometry={geometries.cpvSubstrate}
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
                geometry={geometries.cpvSubstrate}
                material={visualMaterials.cpvSubstrate}
              />
              {(() => {
                const n = visMatrixSize;
                const cellSpacing = (PLATE_WIDTH * 0.9) / n;
                const startOffset = -((n - 1) * cellSpacing) / 2;
                const cellSize = cellSpacing * visCpvScale;

                let cellGeo;
                if (visUseCircle) {
                  cellGeo = new THREE.CylinderGeometry(
                    cellSize / 2,
                    cellSize / 2,
                    0.01,
                    32
                  );
                } else {
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
                        material={visualMaterials.cpvCell}
                      />
                    );
                  }
                }
                return cells;
              })()}
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

  // UI STATE
  const [uiFocusOffset, setUiFocusOffset] = useState(-1.5);
  const [uiMatrixSize, setUiMatrixSize] = useState(5);
  const [uiMagicArea, setUiMagicArea] = useState(75);
  const [showGaussian, setShowGaussian] = useState(false);

  // ADVANCED UI STATE
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uiLayerThick, setUiLayerThick] = useState(0.03);
  const [uiSinkThick, setUiSinkThick] = useState(0.02); // NEW
  const [uiPlateDim, setUiPlateDim] = useState(1.5);
  const [uiCpvScale, setUiCpvScale] = useState(0.7);
  const [uiNx, setUiNx] = useState(40);
  const [uiNz, setUiNz] = useState(8);
  const [uiUseCircle, setUiUseCircle] = useState(false);
  // Material Keys
  const [uiBaseMatKey, setUiBaseMatKey] = useState("Copper (Oxidized)");
  const [uiSinkMatKey, setUiSinkMatKey] = useState("Al-6061 (Anodized)");

  // SIMULATION STATE
  const [activeParams, setActiveParams] = useState<{
    focusOffset: number;
    matrixSize: number;
    magicArea: number;
    layerThick: number;
    sinkThick: number;
    plateDim: number;
    cpvScale: number;
    nx: number;
    nz: number;
    useCircle: boolean;
    baseMatKey: string;
    sinkMatKey: string;
  } | null>(null);

  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const displayFwhm = useMemo(() => {
    const ratio = Math.abs(uiFocusOffset) / 2.5;
    return 0.17 + ratio * 0.5;
  }, [uiFocusOffset]);

  const handleRunSimulation = () => {
    setSimStats((prev) => ({
      ...prev,
      loading: true,
      status: "Calculating...",
      maxTemp: 0,
      pElectric: 0,
    }));

    setActiveParams({
      focusOffset: uiFocusOffset,
      matrixSize: uiMatrixSize,
      magicArea: uiMagicArea,
      layerThick: uiLayerThick,
      sinkThick: uiSinkThick,
      plateDim: uiPlateDim,
      cpvScale: uiCpvScale,
      nx: uiNx,
      nz: uiNz,
      useCircle: uiUseCircle,
      baseMatKey: uiBaseMatKey,
      sinkMatKey: uiSinkMatKey,
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
    if (!activeParams) {
      setHasPendingChanges(false);
      return;
    }
    setHasPendingChanges(
      uiFocusOffset !== activeParams.focusOffset ||
        uiMatrixSize !== activeParams.matrixSize ||
        uiMagicArea !== activeParams.magicArea ||
        uiLayerThick !== activeParams.layerThick ||
        uiSinkThick !== activeParams.sinkThick ||
        uiPlateDim !== activeParams.plateDim ||
        uiCpvScale !== activeParams.cpvScale ||
        uiNx !== activeParams.nx ||
        uiNz !== activeParams.nz ||
        uiUseCircle !== activeParams.useCircle ||
        uiBaseMatKey !== activeParams.baseMatKey ||
        uiSinkMatKey !== activeParams.sinkMatKey
    );
  }, [
    uiFocusOffset,
    uiMatrixSize,
    uiMagicArea,
    activeParams,
    uiLayerThick,
    uiSinkThick,
    uiPlateDim,
    uiCpvScale,
    uiNx,
    uiNz,
    uiUseCircle,
    uiBaseMatKey,
    uiSinkMatKey,
  ]);

  // Update Weight Calculation to use actual material densities
  const structureWeight = useMemo(() => {
    const baseRho = MATERIALS[uiBaseMatKey].rho;
    const sinkRho = MATERIALS[uiSinkMatKey].rho;
    const volBase = Math.pow(uiPlateDim, 2) * uiLayerThick;
    // Approximating sink volume (fins usually add significant volume, approximated here as 50% solid block for calc)
    const volSink = Math.pow(uiPlateDim, 2) * uiSinkThick * 0.5;
    return volBase * baseRho + volSink * sinkRho;
  }, [uiPlateDim, uiLayerThick, uiSinkThick, uiBaseMatKey, uiSinkMatKey]);


  // 1. Calculate Cost based on Volume & Area
  const structureCost = useMemo(() => {
    const area = Math.pow(uiPlateDim, 2);
    
    // Base Plate Cost
    const baseMat = MATERIALS[uiBaseMatKey];
    const volBase = area * uiLayerThick;
    const costBase = volBase * baseMat.rho * baseMat.cost;

    // Sink Cost (Approximated as 50% solid volume for fins)
    const sinkMat = MATERIALS[uiSinkMatKey];
    const volSink = area * uiSinkThick * 0.5; 
    const costSink = volSink * sinkMat.rho * sinkMat.cost;

    // Fixed Layers Cost
    // 1. CPV Cells Area Cost
    const costCPV = area * LAYER_COSTS.CPV_PRICE_PER_M2;
    
    // 2. Silver (Ag) Layer Cost
    const volAg = area * LAYER_COSTS.AG_THICKNESS;
    const costAg = volAg * LAYER_COSTS.AG_DENSITY * LAYER_COSTS.AG_COST_PER_KG;

    return costBase + costSink + costCPV + costAg;
  }, [uiPlateDim, uiLayerThick, uiSinkThick, uiBaseMatKey, uiSinkMatKey]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl">
      {/* HEADER */}
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

      {/* LOADING OVERLAY */}
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

      {/* 3D SCENE */}
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
        <color attach="background" args={["#050a14"]} />
        <fog attach="fog" args={["#050a14", 12, 45]} />
        <Grid
          position={[0, -1.1, 0]}
          args={[10.5, 10.5]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#1f55a1"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#4fa9c9"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
        <Stars
          radius={100}
          depth={10}
          count={2000}
          factor={5}
          saturation={0.3}
          fade
          speed={0.3}
        />
        <Sparkles
          count={30}
          scale={3}
          size={2}
          speed={0.3}
          opacity={0.5}
          color="#88ccff"
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
        <ambientLight intensity={1.5} /> {/* Increased from 0.5 */}
        <directionalLight
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.0001}
          position={[10, 20, 5]}
          intensity={3.0}
          castShadow
          color="#fffaed"
        />
        {/* Add a fill light from the bottom/side to light up shadows */}
        <directionalLight
          position={[-5, -10, -5]}
          intensity={1.0}
          color="#aaccff"
        />
        <ThermalBox
          simMatrixSize={activeParams?.matrixSize ?? null}
          simFocusOffset={activeParams?.focusOffset ?? null}
          simMagicArea={activeParams?.magicArea ?? null}
          simLayerThick={activeParams?.layerThick ?? null}
          simSinkThick={activeParams?.sinkThick ?? null}
          simPlateDim={activeParams?.plateDim ?? null}
          simCpvScale={activeParams?.cpvScale ?? null}
          simNx={activeParams?.nx ?? null}
          simNz={activeParams?.nz ?? null}
          simUseCircle={activeParams?.useCircle ?? null}
          simBaseMatKey={activeParams?.baseMatKey ?? null}
          simSinkMatKey={activeParams?.sinkMatKey ?? null}
          visMatrixSize={uiMatrixSize}
          visFocusOffset={uiFocusOffset}
          visMagicArea={uiMagicArea}
          visCpvScale={uiCpvScale}
          visUseCircle={uiUseCircle}
          visBaseMatKey={uiBaseMatKey}
          visSinkMatKey={uiSinkMatKey}
          hasPendingChanges={hasPendingChanges}
          status={simStats}
          showGaussian={showGaussian}
          showAdvanced={showAdvanced}
          onUpdateStats={onUpdateStats}
        />
      </Canvas>

      {/* LEFT CONTROL PANEL */}
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
          onInc={() => setUiMagicArea((p) => Math.min(p + 5, 236))}
        />

        {!simStats.loading && (!activeParams || hasPendingChanges) && (
          <div className="w-full">
            <ToggleRow
              label="Veure Distribució"
              checked={showGaussian}
              onChange={setShowGaussian}
            />
          </div>
        )}

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
          disabled={simStats.loading || (!hasPendingChanges && activeParams !== null)}
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

        {/* ADVANCED SETTINGS MODAL */}
        {showAdvanced && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Added max-h-[85vh] and flex-col to keep header/footer fixed while content scrolls */}
            <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[65vh] flex flex-col relative animate-in zoom-in-95 duration-200 mt-12 md:mt-0">
              
              {/* Header (Fixed) */}
              <div className="flex-none flex items-center justify-between mb-6 pb-4 border-b border-white/5">
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

              {/* Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                  
                  {/* --- Geometry Group --- */}
                  <ControlRow
                    label="Gruix Conductor"
                    value={uiLayerThick.toFixed(3)}
                    unit="m"
                    colorClass="text-purple-400"
                    onDec={() =>
                      setUiLayerThick((p) => Math.max(p - 0.005, 0.005))
                    }
                    onInc={() => setUiLayerThick((p) => Math.min(p + 0.005, 0.1))}
                  />
                  <ControlRow
                    label="Gruix Dissipador"
                    value={uiSinkThick.toFixed(3)}
                    unit="m"
                    colorClass="text-purple-400"
                    onDec={() =>
                      setUiSinkThick((p) => Math.max(p - 0.005, 0.005))
                    }
                    onInc={() => setUiSinkThick((p) => Math.min(p + 0.005, 0.1))}
                  />
                  <ControlRow
                    label="Mida Placa"
                    value={uiPlateDim.toFixed(1)}
                    unit="m"
                    colorClass="text-purple-400"
                    onDec={() => setUiPlateDim((p) => Math.max(p - 0.1, 0.5))}
                    onInc={() => setUiPlateDim((p) => Math.min(p + 0.1, 3.0))}
                  />

                  {/* --- Simulation Group --- */}
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
                  <ControlRow
                    label="Tamany CPV"
                    value={(uiCpvScale * 100).toFixed(0)}
                    unit="%"
                    colorClass="text-pink-400"
                    onDec={() => setUiCpvScale((p) => Math.max(p - 0.1, 0.1))}
                    onInc={() => setUiCpvScale((p) => Math.min(p + 0.1, 1.0))}
                  />

                  {/* --- Materials & Shape Group --- */}
                  <div className="lg:col-span-1 flex items-center justify-start">
                    <ToggleRow
                        label="Forma Circular"
                        checked={uiUseCircle}
                        onChange={setUiUseCircle}
                    />
                  </div>
                  
                  {/* Materials span 2 cols implicitly due to component definition, fills row in 3-col layout */}
                  <MaterialSelector
                    label="Material Conductor"
                    selectedKey={uiBaseMatKey}
                    onChange={setUiBaseMatKey}
                    colorClass="text-blue-400"
                  />
                  <MaterialSelector
                    label="Material Dissipador"
                    selectedKey={uiSinkMatKey}
                    onChange={setUiSinkMatKey}
                    colorClass="text-blue-400"
                  />
                </div>
              </div>

              {/* Footer (Fixed) */}
              <div className="flex-none mt-6 pt-4 border-t border-white/5 flex justify-end">
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

      {/* RIGHT STATS PANEL */}
      <div className="absolute top-28 right-8 w-[320px] pointer-events-auto bg-neutral-900 p-5 rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 hover:border-cyan-500/30">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
            Resultats en Temps Real
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-white">
          <StatItem
            label="FWHM"
            value={displayFwhm.toFixed(3) + " m"}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />
          <StatItem
            label="Pes Estructural"
            value={structureWeight.toFixed(1) + " kg"}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />
          {/* NEW: Cost Stat Item */}
          <StatItem
            label="Cost Material"
            value={structureCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
            colorBorder="border-yellow-500/30"
            colorLabel="text-yellow-200/70"
            colorValue="text-yellow-400"
            colorBg="bg-yellow-900/10"
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
