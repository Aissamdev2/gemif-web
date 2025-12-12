"use client";

import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
  Suspense,
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
const FWHM_MIN = 0.17;
const FWHM_MAX = 0.8;
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
// Added 'machiningFactor': Multiplier for manufacturing difficulty (1.0 = Standard Al)
const MATERIALS: Record<
  string,
  MaterialDef & { cost: number; machiningFactor: number }
> = {
  "Al-1050A (Anodized)": {
    name: "Al-1050A",
    kt: 220.0,
    emi: 0.85,
    rho: 2705,
    cost: 4.5,
    machiningFactor: 1.0, // Standard reference
    color: "#4a4a4a",
    metalness: 0.5,
    roughness: 0.7,
  },
  "Al-6061 (Anodized)": {
    name: "Al-6061",
    kt: 167.0,
    emi: 0.85,
    rho: 2700,
    cost: 5.0,
    machiningFactor: 1.1, // Slightly harder than pure Al
    color: "#5c5c5c",
    metalness: 0.5,
    roughness: 0.7,
  },
  "Mg-AZ31B (Coated)": {
    name: "Magnesi AZ31B",
    kt: 96.0,
    emi: 0.8,
    rho: 1770,
    cost: 12.0,
    machiningFactor: 1.8, // Flammable chips, specialized cooling needed
    color: "#e0e0e0",
    metalness: 0.3,
    roughness: 0.5,
  },
  "Graphite (PGS)": {
    name: "Grafit PGS",
    kt: 700.0,
    emi: 0.95,
    rho: 2100,
    cost: 150.0,
    machiningFactor: 0.5, // It's cut/stamped, not CNC machined (cheaper process)
    color: "#252525",
    metalness: 0.2,
    roughness: 0.9,
  },
  "Copper (Oxidized)": {
    name: "Coure",
    kt: 390.0,
    emi: 0.65,
    rho: 8960,
    cost: 10.0,
    machiningFactor: 2.5, // Hard on tools, slow feed rates, heavy
    color: "#ff8c42",
    metalness: 0.4,
    roughness: 0.4,
  },
};

const REFELCTIVE_MATERIAL = {
  name: "Reflective Coating",
  kt: 430,
  emi: 0.05,
  color: "#eeeeee",
  roughness: 0.2,
};

// --- PRESET CONFIGURATIONS ---
type PresetDef = {
  name: string;
  fwhm: number;
  matrixSize: number;
  magicArea: number;
  layerThick: number;
  sinkThick: number;
  pvThick: number;
  plateDim: number;
  cpvScale: number;
  nx: number;
  nz: number;
  useCircle: boolean;
  usePv: boolean;
  useFins: boolean;
  useReflector: boolean;
  baseMatKey: string;
  sinkMatKey: string;
};

const PRESETS: Record<string, PresetDef> = {
  Initial: {
    name: "Inicial",
    fwhm: 0.17,
    matrixSize: 1,
    magicArea: 236,
    layerThick: 0.03,
    sinkThick: 0.0,
    pvThick: 0.2,
    plateDim: 1.5,
    cpvScale: 0.7,
    nx: 40,
    nz: 9,
    useCircle: false,
    usePv: false,
    useFins: false,
    useReflector: false,
    baseMatKey: "Al-1050A (Anodized)",
    sinkMatKey: "Al-1050A (Anodized)",
  },
  Under_Limits: {
    name: "Sota límits",
    fwhm: 0.267,
    matrixSize: 5,
    magicArea: 45,
    layerThick: 0.0189,
    sinkThick: 0.0106,
    pvThick: 0.2,
    plateDim: 1.5,
    cpvScale: 0.7,
    nx: 40,
    nz: 9,
    useCircle: false,
    usePv: false,
    useFins: true,
    useReflector: true,
    baseMatKey: "Al-1050A (Anodized)",
    sinkMatKey: "Al-1050A (Anodized)",
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
  AG_DENSITY: 10490, // kg/m3
  AG_COST_PER_KG: 850, // €/kg
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
    onMin,
    onMax,
    showMin = false,
    showMax = false,
    // NEW
    onSet,
  }: {
    label: string;
    value: string | number;
    unit?: string;
    colorClass: string;
    onDec: () => void;
    onInc: () => void;
    disableDec?: boolean;
    disableInc?: boolean;
    onMin?: () => void;
    onMax?: () => void;
    showMin?: boolean;
    showMax?: boolean;
    onSet?: (v: number) => void; // NEW
  }) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(String(value));

    const commit = () => {
      setEditing(false);
      if (onSet) {
        const num = Number(draft);
        if (!Number.isNaN(num)) onSet(num);
      }
    };

    const cancel = () => {
      setEditing(false);
      setDraft(String(value));
    };

    return (
      <div className="flex flex-col gap-1 items-center bg-neutral-900 p-2 rounded-xl text-white shadow-xl border border-white/10">
        {showMax && onMax && (
          <button
            onClick={onMax}
            disabled={disableInc}
            className="cursor-pointer w-full h-4 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 hover:text-pink-300 border border-white/5 transition duration-75 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
            title="Set Maximum"
          >
            <span className="text-[9px] font-black tracking-tighter opacity-70 group-hover:opacity-100">
              MAX
            </span>
          </button>
        )}

        <div className="flex items-center justify-center gap-2">
          {/* Decrement */}
          <button
            onClick={onDec}
            disabled={disableDec}
            className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition duration-75 active:scale-95 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>

          {/* Label + Value */}
          <div className="flex flex-col items-center min-w-[90px]">
            <span
              className={`text-[9px] uppercase tracking-widest font-bold mb-0.5 ${colorClass}`}
            >
              {label}
            </span>

            {/* Value or Editable input */}
            {!editing && (
              <span
                className="font-mono text-lg font-bold text-white leading-none cursor-pointer"
                onClick={() => {
                  if (onSet) {
                    setEditing(true);
                    setDraft(String(value));
                  }
                }}
                title={onSet ? "Click to edit" : undefined}
              >
                {value}
                <span className="text-xs ml-0.5 font-normal text-gray-400">
                  {unit}
                </span>
              </span>
            )}

            {editing && (
              <input
                autoFocus
                type="number"
                className="w-20 text-center font-mono text-md font-bold rounded-md bg-neutral-800 border border-white/20 px-1 py-0 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit();
                  if (e.key === "Escape") cancel();
                }}
              />
            )}
          </div>

          {/* Increment */}
          <button
            onClick={onInc}
            disabled={disableInc}
            className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition duration-75 active:scale-95 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>

        {showMin && onMin && (
          <button
            onClick={onMin}
            disabled={disableDec}
            className="cursor-pointer w-full h-4 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 hover:text-cyan-300 border border-white/5 transition duration-75 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
            title="Set Minimum"
          >
            <span className="text-[9px] font-black tracking-tighter opacity-70 group-hover:opacity-100">
              MIN
            </span>
          </button>
        )}
      </div>
    );
  }
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

const PresetSelector = memo(
  ({ onSelect }: { onSelect: (key: string) => void }) => {
    return (
      <div className="flex flex-col gap-2 bg-neutral-900 p-2 rounded-xl text-white shadow-xl border border-white/10">
        <div className="flex justify-between items-end">
          <span className="text-[10px] uppercase tracking-widest font-black text-cyan-300">
            Paràm. Predefinits
          </span>
        </div>

        <div className="relative group">
          <select
            onChange={(e) => {
              if (e.target.value) onSelect(e.target.value);
              // Reset selector visually if needed, though usually staying on selection is fine
            }}
            defaultValue=""
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg p-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer appearance-none hover:bg-black/60 transition-all uppercase tracking-wider"
          >
            <option value="" className="bg-neutral-900 py-2 text-center">
              No
            </option>
            {Object.entries(PRESETS).map(([key, def]) => (
              <option
                key={key}
                value={key}
                className="bg-neutral-900 py-2 text-center"
              >
                {def.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }
);
PresetSelector.displayName = "PresetSelector";

const StatItem = memo(
  ({
    label,
    value,
    colorBg,
    colorBorder,
    colorLabel,
    colorValue,
  }: {
    label: string;
    value: string | number;
    colorBg?: string;
    colorBorder: string;
    colorLabel: string;
    colorValue?: string;
  }) => (
    <div
      className={`${
        colorBg || "bg-white/5"
      } rounded-md py-2 px-4 border ${colorBorder} flex flex-col justify-center min-w-[100px] h-full`}
    >
      <p
        className={`text-[10px] uppercase tracking-wider leading-none mb-1 ${colorLabel}`}
      >
        {label}
      </p>
      <p
        className={`font-mono text-md font-bold leading-none ${
          colorValue || "text-white"
        }`}
      >
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
    simFwhm,
    simMagicArea,
    simLayerThick,
    simSinkThick,
    simPvThick,
    simPlateDim,
    simCpvScale,
    simNx,
    simNz,
    simUseCircle,
    simUsePv,
    simBaseMatKey,
    simSinkMatKey,
    // NEW: Sim Props
    simUseFins,
    simUseReflector,
    visMatrixSize,
    visFwhm,
    visMagicArea,
    visCpvScale,
    visUseCircle,
    visLayerThick,
    visSinkThick,
    visBaseMatKey,
    visSinkMatKey,
    // NEW: Vis Props
    visUseFins,
    visUseReflector,
    status,
    showGaussian,
    showAdvanced,
    hasPendingChanges,
    onUpdateStats,
  }: {
    simMatrixSize: number | null;
    simFwhm: number | null;
    simMagicArea: number | null;
    simLayerThick: number | null;
    simSinkThick: number | null;
    simPvThick: number | null;
    simPlateDim: number | null;
    simCpvScale: number | null;
    simNx: number | null;
    simNz: number | null;
    simUseCircle: boolean | null;
    simUsePv: boolean | null;
    simUseFins: boolean | null;
    simUseReflector: boolean | null;
    simBaseMatKey: string | null;
    simSinkMatKey: string | null;
    visMatrixSize: number;
    visFwhm: number;
    visMagicArea: number;
    visCpvScale: number;
    visUseCircle: boolean;
    visLayerThick: number;
    visSinkThick: number;
    visUseFins: boolean;
    visUseReflector: boolean;
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
        simFwhm === null ||
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
        new URL("./logic/thermal.worker.js", import.meta.url)
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
        "./wasm-embeddings/vc8/solar_bg.wasm",
        import.meta.url
      ).toString();
      const wasmUrl = new URL(relativePath, window.location.origin).href;

      // Get Material Props
      const baseMat = MATERIALS[simBaseMatKey];
      const sinkMat = MATERIALS[simSinkMatKey];

      const payload = {
        fwhm: simFwhm,
        magicArea: simMagicArea,
        matrixSize: simMatrixSize,
        layerThickness: simLayerThick,
        sinkThickness: simSinkThick,
        pvThickness: simPvThick,
        plateDim: simPlateDim,
        cpvScale: simCpvScale,
        nXy: simNx,
        nZLayer: simNz,
        useCircle: simUseCircle,
        usePv: simUsePv,
        // Material props
        baseKt: baseMat.kt,
        baseEmi: baseMat.emi,
        sinkKt: sinkMat.kt,
        sinkEmi: sinkMat.emi,
        // NEW: Boolean Toggles
        useFins: simUseFins,
        useReflector: simUseReflector,
        wasmUrl,
      };

      console.log("Starting worker with params:", payload);
      workerRef.current.postMessage(payload);

      return () => {
        if (workerRef.current) {
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };
    }, [
      simMatrixSize,
      simMagicArea,
      simFwhm,
      simLayerThick,
      simSinkThick,
      simPvThick,
      simPlateDim,
      simCpvScale,
      simNx,
      simNz,
      simUseCircle,
      simUsePv,
      simUseFins, // Add dependency
      simUseReflector, // Add dependency
      simBaseMatKey,
      simSinkMatKey,
      onUpdateStats,
    ]);

    const SINK_INIT_Y = -(visSinkThick + visLayerThick + 0.08) / 2;
    const SINK_TARGET_Y = SINK_INIT_Y - 0.5;
    const BASE_TARGET_Y = 0;
    const CPV_INIT_Y = visLayerThick / 2 + 0.01;
    const CPV_TARGET_Y = visLayerThick / 2 + 0.5;
    const SPEED = 1.5;

    useFrame((_, delta) => {
      const isVisualizing =
        texSink !== null && !status.loading && !hasPendingChanges;
      const targetExpansion = isVisualizing ? 1 : 0;
      currentExpansion.current = THREE.MathUtils.damp(
        currentExpansion.current,
        targetExpansion,
        3.0,
        delta * SPEED
      );
      const t = currentExpansion.current;
      if (sinkRef.current)
        sinkRef.current.position.y = THREE.MathUtils.lerp(
          SINK_INIT_Y,
          SINK_TARGET_Y,
          t
        );
      if (baseRef.current)
        baseRef.current.position.y = THREE.MathUtils.lerp(0, BASE_TARGET_Y, t);
      if (cpvRef.current)
        cpvRef.current.position.y = THREE.MathUtils.lerp(
          CPV_INIT_Y,
          visUseReflector ? CPV_TARGET_Y : CPV_INIT_Y,
          t
        );
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
          color: visUseReflector ? REFELCTIVE_MATERIAL.color : baseMatDef.color,
          emissive: visUseReflector
            ? REFELCTIVE_MATERIAL.color
            : baseMatDef.color,
          emissiveIntensity: 0.35,
          roughness: visUseReflector
            ? REFELCTIVE_MATERIAL.roughness
            : baseMatDef.roughness,
          metalness: 0.3,
        }),
        cpvCell: new THREE.MeshStandardMaterial({
          color: "#1a237e",
          emissive: "#1a237e",
          emissiveIntensity: 0.4, // Cells should pop
          roughness: 0.2,
          metalness: 0.1,
        }),
      };
    }, [visBaseMatKey, visSinkMatKey, visUseReflector]);

    const geometries = useMemo(() => {
      return {
        sinkMain: new THREE.BoxGeometry(PLATE_WIDTH, visSinkThick, PLATE_DEPTH),
        sinkFin: new THREE.BoxGeometry(0.02, 0.1, PLATE_DEPTH),
        base: new THREE.BoxGeometry(PLATE_WIDTH, visLayerThick, PLATE_DEPTH),
        cpvSubstrate: new THREE.BoxGeometry(PLATE_WIDTH, 0.02, PLATE_DEPTH),
      };
    }, [visLayerThick, visSinkThick]);

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
        {/* SINK - Conditional Rendering based on Thickness */}
        {visSinkThick > 0.0001 && (
          <group ref={sinkRef}>
            {texSink && !hasPendingChanges && !status.loading ? (
              // Texture Mode
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
                    emissiveIntensity={2.5}
                    emissive="white"
                    roughness={0.9}
                    metalness={0.1}
                    color="#000"
                  />
                ))}
              </mesh>
            ) : (
              // Geometry Mode
              <group>
                {/* Main Sink Plate */}
                <mesh
                  position={[0, 0.04, 0]}
                  geometry={geometries.sinkMain}
                  material={visualMaterials.sink}
                />

                {/* Fins - Conditional Rendering */}
                {visUseFins &&
                  Array.from({ length: 15 }).map((_, i) => {
                    const spacing = PLATE_WIDTH / 15;
                    const pos = -PLATE_WIDTH / 2 + spacing / 2 + i * spacing;
                    return (
                      <mesh
                        key={i}
                        position={[pos, -visSinkThick / 2, 0]}
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
        )}

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
                  emissiveIntensity={2.5}
                  emissive="white"
                  roughness={0.9}
                  metalness={0.1}
                  color="#000"
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
                  emissiveIntensity={2.5}
                  emissive="white"
                  roughness={0.9}
                  metalness={0.1}
                  color={"#000"}
                />
              ))}
            </mesh>
          ) : (
            <group>
              <mesh
                geometry={geometries.cpvSubstrate}
                material={
                  visUseReflector
                    ? visualMaterials.cpvSubstrate
                    : visualMaterials.base
                }
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
              {visUseReflector ? "Si+Ag" : "Si"}
            </div>
          </Html>
        </group>
      </group>
    );
  }
);
ThermalBox.displayName = "ThermalBox";

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

// --- COST CONSTANTS (AJUSTADOS PARA NO-GRUA, INSTRUMENTO CIENTIFICO) ---
const PROJECT_COSTS = {
  CPV_PRICE_PER_M2: 2500,
  AG_THICKNESS: 0.00005,
  AG_DENSITY: 10490,
  AG_COST_PER_KG: 1200,

  CNC_BASE_RATE_M2: 3500,
  SURFACE_TREAT_M2: 300, // ajustado (no dorado espacial por defecto)

  ASSEMBLY_HOURLY_RATE: 120, // €/h para técnico especializado
  HOURS_PER_M2: 12, // h/m2 (ajustable: 8-20 realista)

  ELEC_COST_PER_WATT: 2.5,

  NRE_FLAT_FEE: 15000,
  QUALIFICATION_FEE: 8000,

  // LOGISTICA REVISADA (no-grúa por defecto)
  INSTALL_BASE_FEE: 5000, // coordinación observatorio + supervisión
  TRANSPORT_COST_PER_KG: 8, // €/kg (transporte a La Palma + embalaje)
  INSTALL_COST_PER_KG: 10, // €/kg por manipulación especializada (solo > threshold)
  WEIGHT_FREE_THRESHOLD_KG: 25, // kg no penalizados (pequeñas piezas)
  NEEDS_CRANE: false, // sin grúa externa por defecto
  CRANE_DAY_RATE: 0, // 0 si NEEDS_CRANE == false
  CRANE_DAYS: 0,

  INSURANCE_PCT: 0.01, // 1% de coste físico (material+manufactura)

  CONTINGENCY_PCT: 0.25, // 25% para prototipo científico
};

// --- ROI CONSTANTS (La Palma, Canary Islands) ---
const ROI_CONSTANTS = {
  // Annual Equivalent Sun Hours for a 2-axis tracker in La Palma
  // Roque de los Muchachos offers approx 2800-3000 usable DNI hours/year.
  SUN_HOURS_YEAR: 2800,

  // Electricity Cost in €/kWh (Average Commercial/Scientific Grid Rate)
  ELEC_PRICE_EUR_KWH: 0.22,
};

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
  const [uiFwhm, setUiFwhm] = useState(0.267);
  const [uiMatrixSize, setUiMatrixSize] = useState(5);
  const [uiMagicArea, setUiMagicArea] = useState(45);
  const [showGaussian, setShowGaussian] = useState(false);

  // ADVANCED UI STATE
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFeasibility, setShowFeasibility] = useState(false);
  const [uiLayerThick, setUiLayerThick] = useState(0.0189);
  const [uiSinkThick, setUiSinkThick] = useState(0.0106);
  const [uiPvThick, setUiPvThick] = useState(0.2);
  const [uiPlateDim, setUiPlateDim] = useState(1.5);
  const [uiCpvScale, setUiCpvScale] = useState(0.7);
  const [uiNx, setUiNx] = useState(40);
  const [uiNz, setUiNz] = useState(9);
  const [uiUseCircle, setUiUseCircle] = useState(false);
  const [uiUsePv, setUiUsePv] = useState(false);

  // NEW: Boolean Toggles State
  const [uiUseFins, setUiUseFins] = useState(true);
  const [uiUseReflector, setUiUseReflector] = useState(true);

  // Material Keys
  const [uiBaseMatKey, setUiBaseMatKey] = useState("Al-1050A (Anodized)");
  const [uiSinkMatKey, setUiSinkMatKey] = useState("Al-1050A (Anodized)");

  const [maxRoi, setMaxRoi] = useState(15);
  const [maxTemp, setMaxTemp] = useState(85);

  // SIMULATION STATE
  const [activeParams, setActiveParams] = useState<{
    focusOffset: number;
    matrixSize: number;
    magicArea: number;
    layerThick: number;
    sinkThick: number;
    pvThick: number;
    plateDim: number;
    cpvScale: number;
    nx: number;
    nz: number;
    useCircle: boolean;
    usePv: boolean;
    // NEW Params
    useFins: boolean;
    useReflector: boolean;
    baseMatKey: string;
    sinkMatKey: string;
  } | null>(null);

  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  // --- PRESET HANDLER ---
  const applyPreset = useCallback((key: string) => {
    const p = PRESETS[key];
    if (!p) return;

    // Apply all values instantly
    setUiFwhm(p.fwhm);
    setUiMatrixSize(p.matrixSize);
    setUiMagicArea(p.magicArea);
    setUiLayerThick(p.layerThick);
    setUiSinkThick(p.sinkThick);
    setUiPvThick(p.pvThick);
    setUiPlateDim(p.plateDim);
    setUiCpvScale(p.cpvScale);
    setUiNx(p.nx);
    setUiNz(p.nz);
    setUiUseCircle(p.useCircle);
    setUiUsePv(p.usePv);
    setUiUseFins(p.useFins);
    setUiUseReflector(p.useReflector);
    setUiBaseMatKey(p.baseMatKey);
    setUiSinkMatKey(p.sinkMatKey);

    // Optional: Stop current simulation if running to force user to click "Simular" again
    // setSimStats((prev) => ({ ...prev, status: "Settings Changed" }));
  }, []);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        setIntroFinished(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loaded, applyPreset]);

  const handleRunSimulation = () => {
    setSimStats((prev) => ({
      ...prev,
      loading: true,
      status: "Calculating...",
      maxTemp: 0,
      pElectric: 0,
    }));

    setActiveParams({
      focusOffset: uiFwhm,
      matrixSize: uiMatrixSize,
      magicArea: uiMagicArea,
      layerThick: uiLayerThick,
      sinkThick: uiSinkThick,
      pvThick: uiPvThick,
      plateDim: uiPlateDim,
      cpvScale: uiCpvScale,
      nx: uiNx,
      nz: uiNz,
      useCircle: uiUseCircle,
      usePv: uiUsePv,
      // Pass new params
      useFins: uiUseFins,
      useReflector: uiUseReflector,
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
      uiFwhm !== activeParams.focusOffset ||
        uiMatrixSize !== activeParams.matrixSize ||
        uiMagicArea !== activeParams.magicArea ||
        uiLayerThick !== activeParams.layerThick ||
        uiSinkThick !== activeParams.sinkThick ||
        uiPvThick !== activeParams.pvThick ||
        uiPlateDim !== activeParams.plateDim ||
        uiCpvScale !== activeParams.cpvScale ||
        uiNx !== activeParams.nx ||
        uiNz !== activeParams.nz ||
        uiUseCircle !== activeParams.useCircle ||
        uiUsePv !== activeParams.usePv ||
        uiUseFins !== activeParams.useFins || // Check change
        uiUseReflector !== activeParams.useReflector || // Check change
        uiBaseMatKey !== activeParams.baseMatKey ||
        uiSinkMatKey !== activeParams.sinkMatKey
    );
  }, [
    uiFwhm,
    uiMatrixSize,
    uiMagicArea,
    activeParams,
    uiLayerThick,
    uiSinkThick,
    uiPvThick,
    uiPlateDim,
    uiCpvScale,
    uiNx,
    uiNz,
    uiUseCircle,
    uiUsePv,
    uiUseFins,
    uiUseReflector,
    uiBaseMatKey,
    uiSinkMatKey,
  ]);

  // Update Weight Calculation (Handle 0 thickness sink volume)
  const structureWeight = useMemo(() => {
    const baseRho = MATERIALS[uiBaseMatKey].rho;
    const sinkRho = MATERIALS[uiSinkMatKey].rho;
    const volBase = Math.pow(uiPlateDim, 2) * uiLayerThick;

    // If thickness is 0, volume is 0.
    // If fins are on, we assume 50% void, if off (solid block), 100% solid.
    // However, simplified for now: thickness 0 -> 0 volume.

    const FIN_HEIGHT = 0.02;
    const FIN_THICKNESS = 0.001;
    const FIN_SPACING = 0.005;

    const nFins = Math.floor(uiPlateDim / (FIN_SPACING + FIN_THICKNESS));
    console.log("Number of fins for weight calc:", nFins);
    const volSink =
      Math.pow(uiPlateDim, 2) * uiSinkThick +
      FIN_HEIGHT * FIN_THICKNESS * uiPlateDim * (uiUseFins ? nFins : 0);

    return volBase * baseRho + volSink * sinkRho;
  }, [
    uiPlateDim,
    uiLayerThick,
    uiSinkThick,
    uiBaseMatKey,
    uiSinkMatKey,
    uiUseFins,
  ]);

  // 1. Calculate Scientific Project Cost
  const projectCost = useMemo(() => {
    const area = Math.pow(uiPlateDim, 2);
    const baseMat = MATERIALS[uiBaseMatKey];
    const sinkMat = MATERIALS[uiSinkMatKey];

    // --- A. VARIABLE COSTS (Depend on Size/Weight) ---

    // Materials
    const volBase = area * uiLayerThick;
    const volSink = area * uiSinkThick;
    const volAg = area * PROJECT_COSTS.AG_THICKNESS;

    // Add 20% material waste factor for machining
    const costMatBase = volBase * baseMat.rho * baseMat.cost * 1.2;
    const costMatSink = volSink * sinkMat.rho * sinkMat.cost * 1.2;
    const costMatAg =
      volAg * PROJECT_COSTS.AG_DENSITY * PROJECT_COSTS.AG_COST_PER_KG;
    const costMatCPV = area * PROJECT_COSTS.CPV_PRICE_PER_M2;
    const totalMaterials = costMatBase + costMatSink + costMatAg + costMatCPV;

    // Manufacturing (Precision Machining + Surface Treatment)
    // Harder materials multiply the machining time/wear
    const machiningCost =
      area * PROJECT_COSTS.CNC_BASE_RATE_M2 * sinkMat.machiningFactor +
      area * PROJECT_COSTS.SURFACE_TREAT_M2;

    // Assembly (Cleanroom Labor)
    const assemblyCost =
      area * PROJECT_COSTS.HOURS_PER_M2 * PROJECT_COSTS.ASSEMBLY_HOURLY_RATE;

    // Electronics (Scientific Grade)
    const estimatedWatts = area * 1000 * 0.4; // 40% efficiency for modern CPV
    const electronicsCost = estimatedWatts * PROJECT_COSTS.ELEC_COST_PER_WATT;

    // Installation (Rigging & Access)
    const totalWeight = structureWeight;

    // Logistics / installation: transport + handling (tiered) + optional crane (disabled by default)
    const transportCost = PROJECT_COSTS.TRANSPORT_COST_PER_KG * totalWeight;
    const weightPenalty =
      Math.max(0, totalWeight - PROJECT_COSTS.WEIGHT_FREE_THRESHOLD_KG) *
      PROJECT_COSTS.INSTALL_COST_PER_KG;
    const craneCost = PROJECT_COSTS.NEEDS_CRANE
      ? PROJECT_COSTS.CRANE_DAY_RATE * PROJECT_COSTS.CRANE_DAYS
      : 0;

    const installationCost =
      PROJECT_COSTS.INSTALL_BASE_FEE +
      transportCost +
      weightPenalty +
      craneCost;

    const totalVariable =
      totalMaterials +
      machiningCost +
      assemblyCost +
      electronicsCost +
      installationCost;

    // --- B. FIXED COSTS (Engineering & Qual) ---
    const fixedCosts =
      PROJECT_COSTS.NRE_FLAT_FEE + PROJECT_COSTS.QUALIFICATION_FEE;

    // --- C. TOTAL with Contingency ---
    const subTotal = totalVariable + fixedCosts;
    const contingency = subTotal * PROJECT_COSTS.CONTINGENCY_PCT;
    const total = subTotal + contingency;

    return {
      total: total,
      breakdown: {
        materials: totalMaterials,
        manufacturing: machiningCost,
        assembly: assemblyCost,
        engineering: fixedCosts, // NRE + Qual
        logistics: installationCost + contingency, // Install + Risk
      },
    };
  }, [
    uiPlateDim,
    uiLayerThick,
    uiSinkThick,
    uiBaseMatKey,
    uiSinkMatKey,
    structureWeight,
  ]);

  // ... inside ThermalPage component ...

  // 2. Calculate ROI / Payback Period
  const paybackPeriod = useMemo(() => {
    if (!projectCost) return null;
    // If we aren't generating power yet, return null
    if (simStats.pElectric <= 0) return null;

    // 1. Annual Energy Production (kWh/year)
    // pElectric is in Watts. Convert to kW, then multiply by annual sun hours.
    const annualEnergyKwh =
      (simStats.pElectric / 1000) * ROI_CONSTANTS.SUN_HOURS_YEAR;

    // 2. Annual Value of Energy (€/year)
    const annualSavings = annualEnergyKwh * ROI_CONSTANTS.ELEC_PRICE_EUR_KWH;

    // 3. Years to Payoff = Total CAPEX / Annual Savings
    const years = projectCost.total / annualSavings;

    return {
      years: years,
      annualSavings: annualSavings,
      isViable: years < maxRoi, // Arbitrary lifecycle limit for "viable"
    };
  }, [simStats.pElectric, projectCost, maxRoi]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl">
      {/* HEADER */}
      <div
        className={`absolute w-full top-0 left-0 px-8 py-3 z-50 pointer-events-none select-none flex justify-between items-center transition-all duration-1000 ease-out border-b border-white/20 bg-neutral-900 shadow-2xl ${
          introFinished
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8"
        }`}
      >
        <div className="flex gap-5">
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">
            STARRY SKY
          </h1>
          <div className="h-9 border-r border-cyan-700" />
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-cyan-400 uppercase tracking-widest">
            <span className="opacity-80">Aissam Khadraoui</span>
            <span className="text-white/20">•</span>
            <span className="opacity-80">Candela García</span>
            <span className="text-white/20">•</span>
            <span className="opacity-80">Filip Denis</span>
          </div>
        </div>

        {/* <Link
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
        </Link> */}
      </div>
      {/*Initial overlay*/}
      <div
        className={`absolute inset-0 bg-black z-40 flex items-center justify-center pointer-events-none transition-all duration-1000 ease-in-out ${
          !introFinished
            ? "opacity-100 blur-0 scale-100"
            : "opacity-0 blur-xl scale-110"
        }`}
      >
        <div className="text-center">
          <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-pulse tracking-widest">
            STARRY SKY
          </h1>
          <p className="text-white/60 font-mono mt-4 text-sm tracking-[0.5em] uppercase">
            Preparant Simulació...
          </p>
        </div>
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
        <PerspectiveCamera makeDefault position={[4, 1, 0]} fov={40} />
        <OrbitControls
          makeDefault
          minDistance={2}
          maxDistance={50}
          target={[0, 0, 0]}
          enablePan={true}
          panSpeed={1.0}
        />
        <ambientLight intensity={5} /> {/* Increased from 0.5 */}
        <directionalLight
          shadow-mapSize={[512, 512]}
          shadow-bias={-0.0001}
          position={[10, 20, 5]}
          intensity={9.0}
          castShadow
          color="#fffaed"
        />
        {/* Add a fill light from the bottom/side to light up shadows */}
        <directionalLight
          position={[-5, -10, -5]}
          intensity={1.0}
          color="#aaccff"
        />
        <Suspense fallback={null}>
          <SceneReady onReady={() => setLoaded(true)} />
          <ThermalBox
            simMatrixSize={activeParams?.matrixSize ?? null}
            simFwhm={activeParams?.focusOffset ?? null}
            simMagicArea={activeParams?.magicArea ?? null}
            simLayerThick={activeParams?.layerThick ?? null}
            simSinkThick={activeParams?.sinkThick ?? null}
            simPvThick={
              activeParams?.pvThick ? activeParams.pvThick / 1000 : null
            }
            simPlateDim={activeParams?.plateDim ?? null}
            simCpvScale={activeParams?.cpvScale ?? null}
            simNx={activeParams?.nx ?? null}
            simNz={activeParams?.nz ?? null}
            simUseCircle={activeParams?.useCircle ?? null}
            simUsePv={activeParams?.usePv ?? null}
            // Pass new sim params
            simUseFins={activeParams?.useFins ?? null}
            simUseReflector={activeParams?.useReflector ?? null}
            simBaseMatKey={activeParams?.baseMatKey ?? null}
            simSinkMatKey={activeParams?.sinkMatKey ?? null}
            visMatrixSize={uiMatrixSize}
            visFwhm={uiFwhm}
            visMagicArea={uiMagicArea}
            visCpvScale={uiCpvScale}
            visUseCircle={uiUseCircle}
            visLayerThick={uiLayerThick * 10}
            visSinkThick={uiSinkThick * 10}
            visUseFins={uiUseFins}
            visUseReflector={uiUseReflector}
            visBaseMatKey={uiBaseMatKey}
            visSinkMatKey={uiSinkMatKey}
            hasPendingChanges={hasPendingChanges}
            status={simStats}
            showGaussian={showGaussian}
            showAdvanced={showAdvanced}
            onUpdateStats={onUpdateStats}
          />
        </Suspense>
      </Canvas>

      {/* LEFT CONTROL PANEL */}
      <div
        className={`absolute z-30 top-22 left-8 flex flex-col items-start gap-4 pointer-events-auto transition-all duration-1000 ${
          introFinished
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-10"
        }`}
      >
        {/* NEW PRESET SELECTOR HERE */}
        <div className="w-full">
          <PresetSelector onSelect={applyPreset} />
        </div>

        <ControlRow
          label="FWHM (m)"
          value={uiFwhm.toFixed(3)}
          colorClass="text-cyan-400"
          onDec={() => setUiFwhm((p) => Math.max(p - 0.01, FWHM_MIN))}
          onInc={() => setUiFwhm((p) => Math.min(p + 0.01, FWHM_MAX))}
          onSet={(n) =>
            setUiFwhm((p) => Math.min(Math.max(n, FWHM_MIN), FWHM_MAX))
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
          onDec={() =>
            setUiMagicArea((p) => Math.max(p - 1, Math.pow(uiMatrixSize, 2)))
          }
          onInc={() => setUiMagicArea((p) => Math.min(p + 1, 236))}
          onMax={() => setUiMagicArea(236)}
          onMin={() => setUiMagicArea(Math.pow(uiMatrixSize, 2))}
          showMax
          showMin
          // onSet={(n) => setUiMagicArea(Math.max(Math.min(n, 236),Math.pow(uiMatrixSize, 2)))}
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
          disabled={
            simStats.loading || (!hasPendingChanges && activeParams !== null)
          }
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
      </div>
      {/* ADVANCED SETTINGS MODAL */}
      {showAdvanced && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200">
          {/* Added max-h-[85vh] and flex-col to keep header/footer fixed while content scrolls */}
          <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[85vh] flex flex-col relative animate-in zoom-in-95 duration-200 mt-12 md:mt-0">
            {/* --- Header (Fixed) --- */}
            <div className="flex-none flex items-center justify-between mb-2 pb-4 border-b border-white/5">
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

            {/* --- Content (Scrollable) --- */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-6 custom-scrollbar">
              {/* SECTION 1: GEOMETRIA I DIMENSIONS */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                  Geometria i Dimensions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ControlRow
                    label="Mida Placa"
                    value={uiPlateDim.toFixed(1)}
                    unit="m"
                    colorClass="text-purple-400"
                    onDec={() => setUiPlateDim((p) => Math.max(p - 0.1, 0.5))}
                    onInc={() => setUiPlateDim((p) => Math.min(p + 0.1, 3.0))}
                  />
                  <ControlRow
                    label="Gruix Conductor"
                    value={uiLayerThick.toFixed(4)}
                    unit="m"
                    colorClass="text-purple-400"
                    onDec={() =>
                      setUiLayerThick((p) => Math.max(p - 0.005, 0.005))
                    }
                    onInc={() =>
                      setUiLayerThick((p) => Math.min(p + 0.005, 0.1))
                    }
                    onSet={(n) =>
                      setUiLayerThick(Math.max(Math.min(n, 0.1), 0.005))
                    }
                  />
                  <ControlRow
                    label="Gruix Dissipador"
                    value={uiSinkThick.toFixed(4)}
                    unit="m"
                    colorClass="text-purple-400"
                    onDec={() => {
                      // Allow going to 0. If 0, disable fins.
                      setUiSinkThick((p) => {
                        const val = Math.max(p - 0.005, 0.0);
                        if (val < 0.001) setUiUseFins(false);
                        return val;
                      });
                    }}
                    onInc={() => {
                      setUiSinkThick((p) => Math.min(p + 0.005, 0.1));
                    }}
                    onSet={(n) =>
                      setUiSinkThick(Math.max(Math.min(n, 0.1), 0.005))
                    }
                  />
                  <ControlRow
                    label="Gruix (C)PV"
                    value={uiPvThick.toFixed(4)}
                    unit="mm"
                    colorClass="text-purple-400"
                    onDec={() => {
                      setUiPvThick((p) => Math.max(p - 0.1, 0.2));
                    }}
                    onInc={() => {
                      setUiPvThick((p) => Math.min(p + 0.1, 10));
                    }}
                    onSet={(n) => setUiPvThick(Math.max(Math.min(n, 10), 0.2))}
                  />
                  <ControlRow
                    label="Escala CPV"
                    value={(uiCpvScale * 100).toFixed(0)}
                    unit="%"
                    colorClass="text-purple-400"
                    onDec={() => setUiCpvScale((p) => Math.max(p - 0.01, 0.1))}
                    onInc={() => setUiCpvScale((p) => Math.min(p + 0.01, 1.0))}
                  />
                  <ToggleRow
                    label="Forma Circular (C)PV"
                    checked={uiUseCircle}
                    onChange={setUiUseCircle}
                  />
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* SECTION 2: MATERIALS I COMPONENTS */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                  Materials i Components
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  {/* Fins Toggle (Disabled if sink thickness is 0) */}
                  <div
                    className={
                      uiSinkThick < 0.001
                        ? "opacity-50 pointer-events-none grayscale"
                        : ""
                    }
                  >
                    <ToggleRow
                      label="Aletes Dissipació"
                      checked={uiUseFins}
                      onChange={setUiUseFins}
                    />
                  </div>
                  <ToggleRow
                    label="Capa reflectora superior"
                    checked={uiUseReflector}
                    onChange={setUiUseReflector}
                  />
                  <ToggleRow
                    label="Fer servir PV"
                    checked={uiUsePv}
                    onChange={setUiUsePv}
                  />
                </div>
              </div>

              <div className="border-t border-white/5" />

              {/* SECTION 3: SIMULACIÓ I LÍMITS */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
                  Simulació i Límits
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    label="ROI Màxim"
                    value={maxRoi.toFixed(0)}
                    unit="anys"
                    colorClass="text-pink-400"
                    onDec={() => setMaxRoi((p) => Math.max(p - 1, 1))}
                    onInc={() => setMaxRoi((p) => Math.min(p + 1, 30))}
                  />
                  <ControlRow
                    label="Temp. Màxima"
                    value={maxTemp.toFixed(0)}
                    unit="°C"
                    colorClass="text-pink-400"
                    onDec={() => setMaxTemp((p) => Math.max(p - 1, 25))}
                    onInc={() => setMaxTemp((p) => Math.min(p + 1, 500))}
                  />
                </div>
              </div>
            </div>

            {/* --- Footer (Fixed) --- */}
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
      {/* RIGHT STATS PANEL */}
      <div
        className={`absolute top-28 right-8 w-[320px] pointer-events-auto bg-neutral-900 p-5 rounded-2xl border border-white/20 shadow-2xl transition-all duration-1000 hover:border-cyan-500/30 ${
          introFinished
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10"
        }`}
      >
        <div className={`flex items-center justify-between ${showFeasibility ? "mb-4 border-b border-white/10 pb-2" : ""}`}>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
            Dades de viabilitat
          </h3>
          <button
            onClick={() => setShowFeasibility(!showFeasibility)}
            className={`relative cursor-pointer w-10 h-5 rounded-full transition-all duration-300 ease-out focus:outline-none ${
              showFeasibility
                ? "bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.4)]"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ease-out ${
                showFeasibility ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {showFeasibility && (
          <div className="grid grid-cols-2 gap-3 text-white">
            {/* COST BLOCK - Spans 2 columns */}
            <div className="col-span-2 bg-neutral-800/80 rounded-lg p-3 border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
              {/* Header: Total Cost */}
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-yellow-300">
                    Cost Total Aprox.
                  </p>
                </div>
                <p className="font-mono font-bold text-xl text-yellow-400 leading-none">
                  {projectCost.total.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                    notation: "compact",
                  })}
                </p>
              </div>

              {/* Detailed Breakdown Grid */}
              <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-white/10">
                <div className="text-center">
                  <p className="text-[9px] text-white uppercase tracking-tight">
                    Mat & Fab
                  </p>
                  <p className="text-[10px] font-mono font-extrabold text-cyan-400">
                    {(
                      projectCost.breakdown.materials +
                      projectCost.breakdown.manufacturing
                    ).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      notation: "compact",
                    })}
                  </p>
                </div>
                <div className="text-center border-l border-white/10">
                  <p className="text-[9px] text-white uppercase tracking-tight">
                    Muntatge
                  </p>
                  <p className="text-[10px] font-mono font-extrabold text-cyan-400">
                    {projectCost.breakdown.assembly.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      notation: "compact",
                    })}
                  </p>
                </div>
                <div className="text-center border-l border-white/10">
                  <p className="text-[9px] text-white uppercase tracking-tight">
                    Enginyeria
                  </p>
                  <p className="text-[10px] font-mono font-extrabold text-cyan-400">
                    {projectCost.breakdown.engineering.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      notation: "compact",
                    })}
                  </p>
                </div>
                <div className="text-center border-l border-white/10">
                  <p className="text-[9px] text-white uppercase tracking-tight">
                    Log/Risc
                  </p>
                  <p className="text-[10px] font-mono font-extrabold text-cyan-400">
                    {projectCost.breakdown.logistics.toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      notation: "compact",
                    })}
                  </p>
                </div>
              </div>

              {/* NEW: Structural Weight Footer */}
              <div className="mt-2 pt-1.5 border-t border-dashed border-white/10 flex justify-between items-center">
                <p
                  className={`text-[11px] uppercase tracking-wider ${
                    structureWeight > 200 ? "text-red-400" : "text-yellow-300"
                  }`}
                >
                  Pes Estructural
                </p>
                <p
                  className={`font-mono font-bold text-xl ${
                    structureWeight > 200 ? "text-red-500" : "text-yellow-400"
                  } leading-none`}
                >
                  {structureWeight.toFixed(1)} kg
                </p>
              </div>
            </div>

            <div
              className={`col-span-2 rounded-lg p-2.5 border flex flex-col justify-between items-start ${
                paybackPeriod
                  ? "bg-blue-900/10 border-blue-300/30"
                  : "bg-white/5 border-white/10 opacity-50"
              }`}
            >
              <div className={`flex justify-between w-full items-center `}>
                <div className="flex flex-col justify-center">
                  <p
                    className={`text-[11px] uppercase tracking-wider mb-0.5 ${
                      paybackPeriod ? "text-blue-500" : "text-gray-400"
                    }`}
                  >
                    Beneficis anuals
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-mono font-bold text-lg ${
                        paybackPeriod ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {paybackPeriod
                        ? paybackPeriod.annualSavings.toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR",
                            notation: "compact",
                          })
                        : "--"}
                    </p>
                  </div>
                </div>
              </div>
              {paybackPeriod && (
                <div className="mt-2 pt-1.5 border-t border-dashed border-white/10 w-full flex justify-between items-center">
                  <p
                    className={`text-[11px] uppercase tracking-wider text-blue-400`}
                  >
                    Benefici Brut
                  </p>
                  <p
                    className={`font-mono font-bold text-xl text-blue-500 leading-none`}
                  >
                    {(maxRoi * paybackPeriod.annualSavings).toLocaleString(
                      "es-ES",
                      {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                        signDisplay: "exceptZero",
                      }
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* PAYBACK STAT ITEM */}
            <div
              className={`col-span-2 rounded-lg p-2.5 border flex flex-col justify-between items-start ${
                paybackPeriod
                  ? paybackPeriod.isViable
                    ? "bg-green-900/10 border-green-500/30"
                    : "bg-red-900/10 border-red-300/30"
                  : "bg-white/5 border-white/10 opacity-50"
              }`}
            >
              <div className={`flex justify-between w-full items-center `}>
                <div className="flex flex-col justify-center">
                  <p
                    className={`text-[11px] uppercase tracking-wider mb-0.5 ${
                      paybackPeriod
                        ? paybackPeriod.isViable
                          ? "text-green-500"
                          : "text-red-400"
                        : "text-gray-400"
                    }`}
                  >
                    Retorn de la Inversió
                  </p>
                  <div className="flex items-center gap-2">
                    <p
                      className={`font-mono font-bold text-lg ${
                        paybackPeriod ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {paybackPeriod
                        ? (() => {
                            const y = Math.floor(paybackPeriod.years);
                            const m = Math.round(
                              (paybackPeriod.years - y) * 12
                            );
                            if (y > 100) return "> 100 Anys";
                            return `${y}a ${m}m`;
                          })()
                        : "--"}
                    </p>
                  </div>
                </div>

                {/* Viability Indicator Icon */}
                {paybackPeriod && (
                  <div
                    className={`rounded-full p-1.5 ${
                      paybackPeriod.isViable
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {paybackPeriod.isViable ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {paybackPeriod && (
                <div className="mt-2 pt-1.5 border-t border-dashed border-white/10 w-full flex justify-between items-center">
                  <p
                    className={`text-[11px] uppercase tracking-wider ${
                      !paybackPeriod.isViable
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    Benefici Net
                  </p>
                  <p
                    className={`font-mono font-bold text-xl ${
                      !paybackPeriod.isViable
                        ? "text-red-500"
                        : "text-green-500"
                    } leading-none`}
                  >
                    {(
                      (maxRoi - paybackPeriod.years) *
                      paybackPeriod.annualSavings
                    ).toLocaleString("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                      signDisplay: "exceptZero",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM HUD BAR */}
      {activeParams &&
      simStats.maxTemp > 0 &&
      simStats.status !== "Stopped" &&
      !simStats.loading &&
      !hasPendingChanges ? (
        <div className="fixed bottom-0 left-0 z-50 w-full bg-neutral-900 border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {/* Flex Container: Single Horizontal Line */}
          <div className="flex items-center justify-between px-4 py-2 gap-6 overflow-x-auto no-scrollbar h-20">
            {/* LEFT: Title & Status */}
            <div className="flex items-center gap-4 shrink-0 border-r border-white/10 pr-6 h-full">
              <h3 className="text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white leading-tight">
                Resultats
                <br />
                Simulació
              </h3>
              {/* Pulsing Dot */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-[9px] font-mono text-green-400 uppercase">
                  Visualitzant
                </span>
              </div>
            </div>

            {/* CENTER: Stats Row */}
            <div className="flex items-center gap-3 shrink-0">
              <StatItem
                label="Potència"
                value={simStats.pElectric.toFixed(1) + " W"}
                colorBg="bg-green-900/10"
                colorBorder="border-green-500/30"
                colorLabel="text-green-300"
                colorValue="text-green-400"
              />

              <StatItem
                label="Temp. Màx"
                value={simStats.maxTemp.toFixed(1) + " °C"}
                colorBg={
                  simStats.maxTemp < maxTemp
                    ? "bg-green-900/10"
                    : "bg-red-900/10"
                }
                colorBorder={
                  simStats.maxTemp < maxTemp
                    ? "border-green-500/30"
                    : "border-red-500/30"
                }
                colorLabel={
                  simStats.maxTemp < maxTemp ? "text-green-300" : "text-red-300"
                }
                colorValue={
                  simStats.maxTemp < maxTemp ? "text-green-400" : "text-red-400"
                }
              />

              {/* Hover Temp Special Item */}
              <div
                className={`rounded-md py-2 px-4 border ${
                  simStats.hoverTemp && simStats.hoverTemp > maxTemp
                    ? "border-red-500/30 bg-red-900/10"
                    : "border-blue-500/30 bg-blue-900/10"
                } flex flex-col justify-center min-w-[100px] h-full`}
              >
                <p
                  className={`text-[10px] ${
                    simStats.hoverTemp && simStats.hoverTemp > maxTemp
                      ? "text-red-300"
                      : "text-blue-300"
                  } uppercase tracking-wider leading-none mb-1`}
                >
                  Temp. Punter
                </p>
                <p
                  className={`font-mono text-md font-bold leading-none ${
                    simStats.hoverTemp && simStats.hoverTemp > maxTemp
                      ? "text-red-400"
                      : "text-blue-400"
                  }`}
                >
                  {simStats.hoverTemp !== null &&
                  simStats.hoverTemp !== undefined
                    ? `${simStats.hoverTemp.toFixed(1)} °C`
                    : "--.- °C"}
                </p>
              </div>
            </div>

            {/* RIGHT: Note / Footer */}
            <div className="shrink-0 text-[9px] text-gray-500 leading-tight text-right border-l border-white/10 pl-6 h-full flex items-center">
              <span>
                <span className="text-cyan-400 font-bold">NOTA:</span> Model
                simplificat web.
                <br />
                Usar MATLAB per precisió.
              </span>
            </div>
          </div>
        </div>
      ) : (
        !simStats.loading && (
          // Placeholder Bar when not running
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="px-6 py-2 bg-neutral-900/80 backdrop-blur border border-white/10 rounded-full shadow-2xl text-xs text-gray-400 italic">
              {hasPendingChanges
                ? "⚠️ Paràmetres modificats. Executeu la simulació."
                : "ℹ️ Inicieu la simulació per veure dades."}
            </div>
          </div>
        )
      )}
    </div>
  );
}
