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
  useTexture,
  OrbitControls,
  PerspectiveCamera,
  Html,
  Grid,
  Stars,
  Sparkles,
  GizmoHelper, // <--- Add this
  GizmoViewport, // <--- Add this
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
    color: "#6b3818",
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
type PresetDef = Partial<{
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
  layerNz: number;
  sinkNz: number;
  useCircle: boolean;
  usePv: boolean;
  useFins: boolean;
  useReflector: boolean;
  baseMatKey: string;
  sinkMatKey: string;
  // NEW: Environmental Presets
  windSpeed: number;
  ambientTemp: number;
  qSolar: number;
}>;

// Modular presets designed for stacking
const PRESETS: Record<string, PresetDef> = {
  PC: {
    name: "Pitjor Cas",
    fwhm: 0.17,
    matrixSize: 1,
    magicArea: 236,
    layerThick: 0.03,
    sinkThick: 0.0,
    pvThick: 0.2,
    plateDim: 1.5,
    cpvScale: 0.7,
    nx: 40,
    layerNz: 9,
    sinkNz: 3,
    useCircle: false,
    usePv: false,
    useFins: false,
    useReflector: false,
    baseMatKey: "Al-1050A (Anodized)",
    sinkMatKey: "Al-1050A (Anodized)",
  },
  MC: {
    name: "Multicapa",
    sinkThick: 0.01,
    baseMatKey: "Copper (Oxidized)",
    sinkMatKey: "Al-1050A (Anodized)",
  },
  A: {
    name: "Aletes",

    useFins: true,
  },

  M: {
    name: "Matriu",
    matrixSize: 5,
  },
  R: {
    name: "Reflector",
    useReflector: true,
  },
  AM: {
    name: "Apagar miralls",
    magicArea: 100,
  },
  D: {
    name: "Desenfocar",
    fwhm: 0.4,
  },
  SL: {
    name: "Sota límits",
    fwhm: 0.186,
    matrixSize: 6,
    magicArea: 35,
    layerThick: 0.0189,
    sinkThick: 0.0106,
    pvThick: 0.2,
    plateDim: 1.5,
    cpvScale: 0.8,
    nx: 40,
    layerNz: 10,
    sinkNz: 5,
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
              className={`text-[9px] uppercase text-center tracking-widest font-bold mb-0.5 ${colorClass}`}
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
    colorClass,
    checked,
    onChange,
  }: {
    label: string;
    colorClass: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex items-center justify-between gap-4 bg-neutral-900 p-3 px-5 rounded-xl text-white shadow-xl border border-white/10">
      <span
        className={`text-[10px] ${colorClass} uppercase tracking-widest font-bold`}
      >
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
  ({
    activeKeys,
    onToggle,
  }: {
    activeKeys: string[];
    onToggle: (key: string) => void;
  }) => {
    return (
      <div className="w-full flex flex-col items-center gap-2 bg-neutral-900/80 p-1.5 rounded-xl border border-white/10 shadow-lg overflow-hidden">
        {/* Scrollable Container */}
        <span
          className={`text-[10px] uppercase tracking-widest font-bold text-cyan-400 transition-colors`}
        >
          Paràmetres ràpids
        </span>
        <div className="flex-1 overflow-x-auto no-scrollbar grid grid-cols-2 gap-1 pr-2 mask-linear-fade">
          {Object.entries(PRESETS).map(([key, def]) => {
            const isActive = activeKeys.includes(key);
            return (
              <button
                key={key}
                onClick={() => onToggle(key)}
                className={`shrink-0 cursor-pointer px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-200 border whitespace-nowrap ${
                  isActive
                    ? "bg-cyan-600 border-cyan-400 text-white shadow-[0_0_8px_rgba(8,145,178,0.4)]"
                    : "bg-white/5 border-transparent text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/10"
                }`}
              >
                {def.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
);
PresetSelector.displayName = "PresetSelector";

// --- HELPER: MULTI-STATE TOGGLE ---
const MultiStateToggle = memo(
  ({
    label,
    options,
    value,
    onChange,
    colorClass = "text-blue-400",
  }: {
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (val: string) => void;
    colorClass?: string;
  }) => {
    return (
      <div className="flex flex-col gap-2 bg-neutral-900 p-3 rounded-xl border border-white/10 shadow-xl col-span-1 md:col-span-2">
        <span className={`text-[10px] uppercase tracking-widest font-bold ${colorClass}`}>
          {label}
        </span>
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 relative">
          {options.map((opt) => {
            const isActive = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded-md transition-all z-10 relative ${
                  isActive
                    ? "text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
          {/* Animated Background Pill */}
          <div
            className="absolute top-1 bottom-1 bg-cyan-600/90 rounded-md transition-all duration-300 ease-out shadow-lg"
            style={{
              left: `${(options.findIndex((o) => o.value === value) * 100) / options.length + 1}%`,
              width: `${98 / options.length}%`,
            }}
          />
        </div>
      </div>
    );
  }
);
MultiStateToggle.displayName = "MultiStateToggle";

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
    realScale,
  }: {
    fwhm: number;
    matrixSize: number;
    magicArea: number;
    realScale: boolean;
  }) => {
    const { geometry } = useMemo(() => {
      const geo = new THREE.PlaneGeometry(PLATE_WIDTH, PLATE_DEPTH, 140, 140); // Reduced segs slightly for clearer grid
      geo.rotateX(-Math.PI / 2);

      const posAttribute = geo.attributes.position;
      const vertex = new THREE.Vector3();
      const count = posAttribute.count;

      const colors = new Float32Array(count * 3);
      const color = new THREE.Color();

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

      // Determine Amplitude
      let amplitude;
      if (realScale) {
        const baseHeight = 0.5;
        amplitude =
          (baseHeight * magicArea) /
          (twoSigmaSq * Math.PI * matrixSize * matrixSize * 240);
      } else {
        amplitude = 0.5;
      }

      // Deform Mesh & Paint Colors
      for (let i = 0; i < count; i++) {
        vertex.fromBufferAttribute(posAttribute, i);
        let totalY = 0;
        
        for (let c = 0; c < centers.length; c++) {
          const dx = vertex.x - centers[c].x;
          const dz = vertex.z - centers[c].z;
          const distSq = dx * dx + dz * dz;
          totalY += amplitude * Math.exp(-distSq / twoSigmaSq);
        }

        posAttribute.setXYZ(i, vertex.x, totalY, vertex.z);

        // --- IMPROVED COLOR GRADIENT (Red -> Orange -> Yellow) ---
        const t = Math.min(totalY / amplitude, 1.0);
        
        // HSL: Hue 0.0 (Red) -> 0.15 (Yellow)
        // Lightness: 0.2 (Dark) -> 0.6 (Bright)
        color.setHSL(t * 0.15, 1.0, 0.25 + t * 0.35);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();
      
      return { geometry: geo };
    }, [fwhm, matrixSize, magicArea, realScale]);

    return (
      <group position={[0, 0.03, 0]}>
        {/* 1. Main Solid Mesh (With Lighting/Shadows) */}
        <mesh geometry={geometry} receiveShadow castShadow>
          <meshStandardMaterial
            vertexColors={true}
            roughness={0.4}
            metalness={0.1}
            transparent={true}
            opacity={0.75} // High opacity to see the shape clearly
            side={THREE.DoubleSide}
            depthWrite={true} // Allow self-occlusion so it looks 3D
          />
        </mesh>

        {/* 2. Distinct White Wireframe */}
        <mesh geometry={geometry} position={[0, 0.002, 0]}>
          <meshBasicMaterial
            color="#555"
            transparent
            opacity={0.15} // Subtle grid lines
            wireframe
            depthWrite={false}
          />
        </mesh>
      </group>
    );
  }
);
GaussianOverlay.displayName = "GaussianOverlay";

// --- HELPER: VOLUME GRID VISUALIZATION (UPDATED) ---
const VolumeGrid = memo(
  ({
    width,
    depth,
    thickness,
    nx,
    nz,
    visible,
  }: {
    width: number;
    depth: number;
    thickness: number;
    nx: number;
    nz: number;
    visible: boolean;
  }) => {
    // 2. Side Slices (Subtle)
    const SideLines = useMemo(() => {
      if (nz <= 1) return null;
      const vertices = [];
      const step = thickness / nz;
      const halfW = width / 2;
      const halfD = depth / 2;

      for (let i = 1; i < nz; i++) {
        const y = -thickness / 2 + i * step;
        vertices.push(-halfW, y, -halfD, halfW, y, -halfD);
        vertices.push(halfW, y, -halfD, halfW, y, halfD);
        vertices.push(halfW, y, halfD, -halfW, y, halfD);
        vertices.push(-halfW, y, halfD, -halfW, y, -halfD);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );
      return geo;
    }, [width, depth, thickness, nz]);

    if (!visible) return null;

    // 1. Top Grid (Subtle)
    const TopGrid = () => (
      <gridHelper
        args={[width, nx, 0xffffff, 0xffffff]} // White for better contrast on dark/metal
        position={[0, thickness / 2 + 0.0005, 0]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial
          attach="material"
          color="#ffffff"
          transparent
          opacity={0.5} // Very subtle
          depthTest={true} // Allow depth occlusion so it looks "painted on"
        />
      </gridHelper>
    );

    return (
      <group>
        <TopGrid />
        {SideLines && (
          <lineSegments geometry={SideLines}>
            <lineBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.3}
              depthTest={true}
            />
          </lineSegments>
        )}
      </group>
    );
  }
);
VolumeGrid.displayName = "VolumeGrid";

// --- HELPER: TECH ANNOTATION LABEL (FIXED ALIGNMENT) ---
const TechLabel = memo(
  ({
    position = [0, 0, 0],
    label,
    desc,
    visible,
  }: {
    position?: [number, number, number];
    label: string;
    desc: string;
    visible: boolean;
  }) => {
    const [hidden, setHidden] = useState(false);

    return (
      <Html
        position={position}
        zIndexRange={[100, 0]}
        // Hides label if geometry blocks the view (standard raycast)
        style={{
          transition: "opacity 0.2s",
          opacity: visible && !hidden ? 1 : 0,
          pointerEvents: "none",
          // Shift entire block up so the bottom edge sits on the 3D point
          transform: "translate3d(-50%, -100%, 0)",
        }}
      >
        <div
          className={`flex flex-col items-center transition-transform duration-300 ease-out origin-bottom ${
            visible && !hidden
              ? "scale-100 translate-y-0"
              : "scale-50 translate-y-10"
          }`}
          style={{ position: "relative" }}
        >
          {/* 1. Text Card */}
          <div className="bg-black/80 border border-cyan-500/50 p-2.5 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.5)] min-w-[120px] text-center mb-0">
            <span className="block text-[12px] font-black uppercase tracking-widest text-cyan-400 mb-1 border-b border-white/10 pb-1">
              {label}
            </span>
            <span className="block text-[11px] font-mono text-gray-300 leading-tight whitespace-pre-wrap">
              {desc}
            </span>
          </div>

          {/* 2. Connector Line */}
          <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-cyan-400 opacity-80"></div>

          {/* 3. Target Dot (Aligned to Center Bottom) */}
          {/* left-1/2 centers it horizontally relative to the line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_8px_#22d3ee] relative z-10"></div>
            <div className="absolute w-3 h-3 border border-cyan-400/80 rounded-full animate-ping"></div>
          </div>
        </div>
      </Html>
    );
  }
);
TechLabel.displayName = "TechLabel";

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
    simLayerNz,
    simSinkNz,
    simUseCircle,
    simUsePv,
    simUseSolarCell,
    simBaseMatKey,
    simSinkMatKey,
    // NEW: Sim Props
    simUseFins,
    simUseReflector,
    simWindSpeed,
    simAmbientTemp,
    simQSolar,
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
    visSolarMode,
    status,
    realScale,
    showGaussian,
    hasPendingChanges,
    showGrid,
    explodedView,
    // NEW PROPS
    visNx, // Visual Control for Nx
    visLayerNz, // Visual Control for Nz
    visSinkNz, // Visual Control for Sink Nz
    showLabels,
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
    simLayerNz: number | null;
    simSinkNz: number | null;
    simUseCircle: boolean | null;
    simUsePv: boolean | null;
    simUseSolarCell: boolean | null;
    simUseFins: boolean | null;
    simUseReflector: boolean | null;
    simBaseMatKey: string | null;
    simSinkMatKey: string | null;
    simWindSpeed: number | null;
    simAmbientTemp: number | null;
    simQSolar: number | null;
    visMatrixSize: number;
    visFwhm: number;
    visMagicArea: number;
    visCpvScale: number;
    visUseCircle: boolean;
    visLayerThick: number;
    visSinkThick: number;
    visUseFins: boolean;
    visUseReflector: boolean;
    visSolarMode: "none" | "pv" | "cpv";
    visBaseMatKey: string;
    visSinkMatKey: string;
    status: SimStats;
    realScale: boolean;
    showGaussian: number;
    hasPendingChanges: boolean;
    showGrid: boolean;
    explodedView: boolean;
    visNx: number;
    visLayerNz: number;
    visSinkNz: number;
    showLabels: number;
    onUpdateStats: (stats: Partial<SimStats>) => void;
  }) => {
    const [texSink, setTexSink] = useState<LayerTextures | null>(null);
    const [texBase, setTexBase] = useState<LayerTextures | null>(null);
    const [texCPV, setTexCPV] = useState<LayerTextures | null>(null);
    const [tempRange, setTempRange] = useState({ min: 0, max: 100 });

    const [hoveredPart, setHoveredPart] = useState<string | null>(null);

    const sinkRef = useRef<THREE.Group>(null);
    const baseRef = useRef<THREE.Group>(null);
    const cpvRef = useRef<THREE.Group>(null);
    const currentExpansion = useRef(0);
    const workerRef = useRef<Worker | null>(null);

    // --- CONSTANTS FOR GEOMETRY ---
    const CPV_SUBSTRATE_THICK = 0.002; // Thin layer for the wafer
    const CPV_CELL_HEIGHT = 0.001; // Height of the actual PV cells
    const FIN_HEIGHT = realScale ? 0.02 : 0.05; // Height of the cooling fins
    const FIN_THICKNESS = realScale ? 0.001 : 0.005;

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
        !simSinkMatKey ||
        simWindSpeed === null ||
        simAmbientTemp === null ||
        simQSolar === null
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
        "./wasm-embeddings/vc14/solar_bg.wasm",
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
        nZLayer: simLayerNz,
        nZSink: simSinkNz,
        useCircle: simUseCircle,
        usePv: simUsePv,
        useSolarCell: simUseSolarCell,
        // Material props
        baseKt: baseMat.kt,
        baseEmi: baseMat.emi,
        sinkKt: sinkMat.kt,
        sinkEmi: sinkMat.emi,
        // Boolean Toggles
        useFins: simUseFins,
        useReflector: simUseReflector,
        // NEW: Environmental Params
        windSpeed: simWindSpeed,
        ambientTemp: simAmbientTemp,
        qSolar: simQSolar,
        wasmUrl,
      };

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
      simLayerNz,
      simSinkNz,
      simUseCircle,
      simUsePv,
      simUseSolarCell,
      simUseFins,
      simUseReflector,
      simBaseMatKey,
      simSinkMatKey,
      simWindSpeed,
      simAmbientTemp,
      simQSolar,
      onUpdateStats,
    ]);

    // --- STATE DETERMINATION ---
    // The "Simulation Mode" is active if we have textures AND no pending changes AND not loading
    const isSimulationActive =
      texSink !== null && !status.loading && !hasPendingChanges;

    // --- DYNAMIC POSITIONING ---
    const BASE_REST_Y = 0;
    const SINK_REST_Y = -(visLayerThick / 2 + visSinkThick / 2);
    const SINK_EXPANDED_Y = SINK_REST_Y - 0.15;
    const CPV_REST_Y = visLayerThick / 2 + CPV_SUBSTRATE_THICK / 2;
    const CPV_EXPANDED_Y = CPV_REST_Y + 0.15;

    useFrame((state, delta) => {
      // Logic: Explode if explicitly requested (explodedView) OR if Simulation Results are active (Original Behavior)
      const shouldExplode = explodedView || isSimulationActive;

      const targetExpansion = shouldExplode ? 1 : 0;

      currentExpansion.current = THREE.MathUtils.damp(
        currentExpansion.current,
        targetExpansion,
        3.0,
        delta * 2.0
      );

      const t = currentExpansion.current;

      if (sinkRef.current)
        sinkRef.current.position.y = THREE.MathUtils.lerp(
          SINK_REST_Y,
          SINK_EXPANDED_Y,
          t
        );
      if (baseRef.current) baseRef.current.position.y = BASE_REST_Y;
      if (cpvRef.current)
        cpvRef.current.position.y = THREE.MathUtils.lerp(
          CPV_REST_Y,
          CPV_EXPANDED_Y,
          t
        );
    });

    // --- INTERACTION ---
    const handlePointerMove = useCallback(
      (e: any, layerName: string, textures: LayerTextures | null) => {
        e.stopPropagation();

        // If Simulating -> Show Temp
        if (isSimulationActive && textures) {
          const matIndex = e.face?.materialIndex;
          if (matIndex === undefined) return;
          const texture = textures[matIndex];
          const image = texture.image;
          if (!e.uv || !image) return;

          const x = Math.floor(e.uv.x * image.width);
          const y = Math.floor(e.uv.y * image.height);
          const index = (y * image.width + x) * 4;
          const r = image.data[index]; // Red channel
          const g = image.data[index + 1]; // Green channel

          let normVal = 0;
          // Decode heatmap color logic (approximate reverse of shader)
          if (g > 5) normVal = g / 255 / 2.0 + 0.5;
          else normVal = r / 255 / 2.0;

          const actualTemp =
            normVal * (tempRange.max - tempRange.min) + tempRange.min;
          onUpdateStats({ hoverTemp: actualTemp });
          return;
        }

        // If Not Simulating -> Show Label
        if (showLabels !== 0) {
          setHoveredPart(layerName);
        }
      },
      [isSimulationActive, showLabels, tempRange, onUpdateStats]
    );

    const handlePointerOut = useCallback(() => {
      onUpdateStats({ hoverTemp: null });
      setHoveredPart(null);
    }, [onUpdateStats]);

    const cpvTexture = useTexture("/textures/cpv-cell-2.jpg");
    cpvTexture.wrapS = cpvTexture.wrapT = THREE.RepeatWrapping;

    const materials = useMemo(() => {
      // Realistic PBR Materials (For Setup Mode)
      const base = MATERIALS[visBaseMatKey];
      const sink = MATERIALS[visSinkMatKey];

      return {
        sink: new THREE.MeshStandardMaterial({
          color: sink.color,
          metalness: 0.5,
          roughness: 0.6,
          transparent: false,
          opacity: 1.0,
          side: THREE.FrontSide,
        }),
        base: new THREE.MeshStandardMaterial({
          color: base.color,
          metalness: 0.6,
          roughness: 0.5,
          transparent: false,
          opacity: 1.0,
          side: THREE.FrontSide,
        }),
        cpvSub: new THREE.MeshStandardMaterial({
          color: visUseReflector ? "#eeeeee" : base.color,
          metalness: visUseReflector ? 0.9 : 0.5,
          roughness: visUseReflector ? 0.2 : 0.6,
          transparent: false,
          opacity: 1.0,
        }),
        cpvCell: new THREE.MeshStandardMaterial({
          color: "#aaa", // White base so texture shows true colors
          map: cpvTexture, // <--- Apply Texture Here
          emissive: "#00b", // No emissive in structural mode
          metalness: 0.9,
          roughness: 0.3,
          transparent: false,
          opacity: 1.0,
        }),
      };
    }, [visBaseMatKey, visSinkMatKey, visUseReflector, cpvTexture]);

    const geometries = useMemo(
      () => ({
        sink: new THREE.BoxGeometry(PLATE_WIDTH, visSinkThick, PLATE_DEPTH),
        sinkFin: new THREE.BoxGeometry(FIN_THICKNESS, FIN_HEIGHT, PLATE_DEPTH),
        base: new THREE.BoxGeometry(PLATE_WIDTH, visLayerThick, PLATE_DEPTH),
        cpvSub: new THREE.BoxGeometry(
          PLATE_WIDTH,
          CPV_SUBSTRATE_THICK,
          PLATE_DEPTH
        ),
      }),
      [visLayerThick, visSinkThick, FIN_HEIGHT, FIN_THICKNESS]
    );

    // --- RENDER ---
    return (
      <group rotation={[0, 0, 0]} position={[0, 0.1, 0]}>
        {/* SINK LAYER */}
        {visSinkThick > 0.0001 && (
          <group ref={sinkRef}>
            <mesh
              onPointerMove={(e) => handlePointerMove(e, "Dissipador", texSink)}
              onPointerOut={handlePointerOut}
              geometry={geometries.sink}
              material={!isSimulationActive ? materials.sink : undefined}
            >
              {isSimulationActive &&
                texSink &&
                texSink.map((tex, i) => (
                  <meshStandardMaterial
                    key={i}
                    attach={`material-${i}`}
                    emissiveMap={tex}
                    emissiveIntensity={2.5}
                    emissive="white"
                    color="black"
                  />
                ))}
            </mesh>
            {/* Fins (Only show in Setup Mode OR if explicit) */}
            {!isSimulationActive &&
              visUseFins &&
              Array.from({ length: 50 }).map((_, i) => {
                const spacing = PLATE_WIDTH / 50;
                const xPos = -PLATE_WIDTH / 2 + spacing / 2 + i * spacing;
                return (
                  <mesh
                    key={i}
                    position={[xPos, -visSinkThick / 2 - FIN_HEIGHT / 2, 0]}
                    geometry={geometries.sinkFin}
                    material={materials.sink}
                  />
                );
              })}

            {/* Volume Grid (Only in Setup Mode) */}
            {!isSimulationActive && showGrid && (
              <VolumeGrid
                width={PLATE_WIDTH}
                depth={PLATE_DEPTH}
                thickness={visSinkThick}
                nx={visNx || 40}
                nz={visSinkNz || 4}
                visible={true}
              />
            )}

            <TechLabel
              visible={
                showLabels === 2 ||
                (showLabels === 1 && hoveredPart === "Dissipador")
              }
              position={[PLATE_WIDTH / 2, 0, PLATE_DEPTH / 2]}
              label="Dissipador"
              desc={`${MATERIALS[visSinkMatKey].name}`}
            />
          </group>
        )}

        {/* BASE LAYER */}
        <group ref={baseRef}>
          <mesh
            onPointerMove={(e) => handlePointerMove(e, "Placa Base", texBase)}
            onPointerOut={handlePointerOut}
            geometry={geometries.base}
            material={!isSimulationActive ? materials.base : undefined}
          >
            {isSimulationActive &&
              texBase &&
              texBase.map((tex, i) => (
                <meshStandardMaterial
                  key={i}
                  attach={`material-${i}`}
                  emissiveMap={tex}
                  emissiveIntensity={2.5}
                  emissive="white"
                  color="black"
                />
              ))}
          </mesh>

          {!isSimulationActive && showGrid && (
            <VolumeGrid
              width={PLATE_WIDTH}
              depth={PLATE_DEPTH}
              thickness={visLayerThick}
              nx={visNx || 40}
              nz={visLayerNz || 9}
              visible={true}
            />
          )}
          <TechLabel
            visible={
              showLabels === 2 ||
              (showLabels === 1 && hoveredPart === "Placa Base")
            }
            position={[-PLATE_WIDTH / 2, 0, PLATE_DEPTH / 2]}
            label="Placa Conductora"
            desc={`${MATERIALS[visBaseMatKey].name}`}
          />
        </group>

        {/* CPV LAYER */}
        <group ref={cpvRef}>
          <mesh
            onPointerMove={(e) => handlePointerMove(e, visUseReflector ? "Substrat CPV" : "Placa Base", texCPV)}
            onPointerOut={handlePointerOut}
            geometry={geometries.cpvSub}
            material={!isSimulationActive ? materials.cpvSub : undefined}
          >
            {isSimulationActive &&
              texCPV &&
              texCPV.map((tex, i) => (
                <meshStandardMaterial
                  key={i}
                  attach={`material-${i}`}
                  emissiveMap={tex}
                  emissiveIntensity={2.5}
                  emissive="white"
                  color="black"
                />
              ))}
          </mesh>

          {/* CPV Cells (Only Setup Mode) */}
          {visSolarMode !== "none" && !isSimulationActive && (
            <group>
              {(() => {
                const n = visMatrixSize;
                const spacing = (PLATE_WIDTH * 0.9) / n;
                const start = -((n - 1) * spacing) / 2;
                const size = spacing * visCpvScale;
                const geo = visUseCircle
                  ? new THREE.CylinderGeometry(
                      size / 2,
                      size / 2,
                      CPV_CELL_HEIGHT,
                      32
                    )
                  : new THREE.BoxGeometry(size, CPV_CELL_HEIGHT, size);
                const y = CPV_SUBSTRATE_THICK / 2 + CPV_CELL_HEIGHT / 2;
                return Array.from({ length: n }).map((_, x) =>
                  Array.from({ length: n }).map((_, z) => (
                    <mesh
                      key={`${x}-${z}`}
                      position={[start + x * spacing, y, start + z * spacing]}
                      geometry={geo}
                      material={materials.cpvCell}
                      onPointerMove={(e) => {
                        e.stopPropagation();
                        if (showLabels !== 0) setHoveredPart("CPV Cell");
                      }}
                      onPointerOut={handlePointerOut}
                    />
                  ))
                );
              })()}
            </group>
          )}

          {!isSimulationActive && showGrid && (
            <VolumeGrid
              width={PLATE_WIDTH}
              depth={PLATE_DEPTH}
              thickness={CPV_SUBSTRATE_THICK}
              nx={visNx || 40}
              nz={2}
              visible={true}
            />
          )}

          {showGaussian !== 0 && (
            <GaussianOverlay
              fwhm={visFwhm}
              matrixSize={visMatrixSize}
              magicArea={visMagicArea}
              realScale={showGaussian === 2}
            />
          )}
          <TechLabel
            visible={
              (showLabels === 2 ||
                (showLabels == 1 && hoveredPart === "Substrat CPV")) &&
              visUseReflector
            }
            position={[PLATE_WIDTH / 2 - 0.05, CPV_SUBSTRATE_THICK / 2, 0]}
            label={"Mirall Ag"}
            desc={"Reflectivitat: 95%"}
          />
          <TechLabel
            visible={
              showLabels === 2 ||
              (showLabels === 1 && hoveredPart === "CPV Cell")
            }
            position={[0, CPV_CELL_HEIGHT / 2, 0]}
            label={visSolarMode === "cpv" ? "Cèl·lula CPV" : "Panell PV"} 
            desc={visSolarMode === "cpv" ? "Triple Unió" : "Silici Monocristal·lí"}
          />
        </group>
      </group>
    );
  }
);
ThermalBox.displayName = "ThermalBox";

// --- REAL TELEMETRY STATUS BAR ---
const SystemStatusBar = memo(
  ({ status, loading }: { status: string; loading: boolean }) => {
    const [telemetry, setTelemetry] = useState({
      fps: 0,
      latency: 0,
      memory: 0,
      uptime: 0,
      netType: "UNKNOWN",
    });

    // 1. Frame Rate (FPS) Loop
    useEffect(() => {
      let frameCount = 0;
      let lastTime = performance.now();
      let animationFrameId: number;

      const measureStats = () => {
        const now = performance.now();
        frameCount++;

        if (now - lastTime >= 1000) {
          // Update state every second
          const currentFps = frameCount;

          // Memory (Chrome/Edge only property)
          // @ts-ignore - performance.memory is non-standard but works in Chromium
          const memUsed = performance.memory?.usedJSHeapSize / 1048576 || 0;

          // Network Type
          const connection =
            (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;
          const netType = connection
            ? connection.effectiveType.toUpperCase()
            : "LAN";

          setTelemetry((prev) => ({
            ...prev,
            fps: currentFps,
            memory: memUsed,
            uptime: prev.uptime + 1,
            netType: netType,
          }));

          frameCount = 0;
          lastTime = now;
        }
        animationFrameId = requestAnimationFrame(measureStats);
      };

      measureStats();
      return () => cancelAnimationFrame(animationFrameId);
    }, []);

    // 2. Latency "Ping" (runs every 5 seconds)
    useEffect(() => {
      const checkPing = async () => {
        const start = Date.now();
        try {
          // Ping the current server to see app latency
          await fetch(window.location.href, {
            method: "HEAD",
            cache: "no-cache",
          });
          const end = Date.now();
          setTelemetry((prev) => ({ ...prev, latency: end - start }));
        } catch (e) {
          setTelemetry((prev) => ({ ...prev, latency: -1 }));
        }
      };

      checkPing(); // Initial
      const interval = setInterval(checkPing, 5000);
      return () => clearInterval(interval);
    }, []);

    // Format Uptime (MM:SS)
    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60)
        .toString()
        .padStart(2, "0");
      const s = (secs % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    };

    // Color logic
    const statusColor = loading
      ? "text-yellow-400"
      : status === "Error"
      ? "text-red-500"
      : "text-emerald-400";
    const latencyColor =
      telemetry.latency > 200
        ? "text-red-400"
        : telemetry.latency > 100
        ? "text-yellow-400"
        : "text-white";
    const fpsColor = telemetry.fps < 30 ? "text-red-400" : "text-white";

    return (
      <div className="hidden xl:flex items-center gap-0 bg-neutral-950/80 border border-white/10 rounded-md overflow-hidden shadow-2xl h-10 select-none">
        {/* SECTION 1: SYSTEM STATE (Based on your simulation prop) */}
        <div className="px-3 py-1 flex items-center gap-2 border-r border-white/10">
          <div className="relative w-2 h-2">
            <div
              className={`absolute inset-0 rounded-full ${
                loading ? "bg-yellow-500 animate-ping" : "bg-emerald-500"
              } opacity-75`}
            ></div>
            <div
              className={`relative w-2 h-2 rounded-full ${
                loading ? "bg-yellow-500" : "bg-emerald-500"
              }`}
            ></div>
          </div>
          <span
            className={`text-[10px] font-black tracking-widest uppercase ${statusColor}`}
          >
            {status.toUpperCase()}
          </span>
        </div>

        {/* SECTION 2: REAL BROWSER TELEMETRY */}
        <div className="flex items-center px-4 gap-4 text-[10px] font-mono text-gray-400">
          {/* Latency */}
          <div className="flex flex-col items-start leading-none gap-0.5 w-14">
            <span className="uppercase">LATENCY</span>
            <span className={latencyColor}>
              {telemetry.latency === -1 ? "OFF" : `${telemetry.latency} ms`}
            </span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* FPS Counter */}
          <div className="flex flex-col items-start leading-none gap-0.5 w-12">
            <span className="uppercase">FPS</span>
            <span className={fpsColor}>{telemetry.fps}</span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Memory (JS Heap) - Only works in Chromium, shows 0 otherwise */}
          <div className="flex flex-col items-start leading-none gap-0.5 w-16">
            <span className="uppercase">HEAP MEM.</span>
            <span className="text-white">
              {telemetry.memory > 0
                ? `${telemetry.memory.toFixed(0)} MB`
                : "N/A"}
            </span>
          </div>

          <div className="w-px h-4 bg-white/10" />

          {/* Connection Type */}
          <div className="flex flex-col items-start leading-none gap-0.5 w-12">
            <span className="uppercase">NET</span>
            <span className="text-cyan-400">{telemetry.netType}</span>
          </div>
        </div>

        {/* SECTION 3: SESSION TIMER */}
        <div className="px-3 py-1.5 bg-black/40 border-l border-white/10 text-[12px] font-mono text-gray-300">
          T+{formatTime(telemetry.uptime)}
        </div>
      </div>
    );
  }
);
SystemStatusBar.displayName = "SystemStatusBar";

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

// --- COST CONSTANTS (STRICT SCIENTIFIC / HIGH RISK REALITY) ---
const PROJECT_COSTS = {
  // CPV: Custom populated PCBs with Triple-Junction cells.
  // This is not a solar farm panel; it is a precision sensor array.
  CPV_PRICE_PER_M2: 8500,

  // Silver Sintering (Ag) - Process cost is higher than material cost
  AG_THICKNESS: 0.00005,
  AG_DENSITY: 8500,
  AG_COST_PER_KG: 2200, // Includes specialized application/curing process

  // FABRICATION (One-off Prototype pricing)
  MATERIAL_WASTE_FACTOR: 1.6, // High waste for precision milling
  CNC_SETUP_FEE: 4500, // Complex jigging for large thin plates (prevent warping)
  CNC_MACHINING_RATE_M2: 6000, // Slow feed rates for high tolerance flatness
  CNC_FINS_MULTIPLIER: 3.5, // Fins are a nightmare on large plates; high risk of chatter
  SURFACE_TREAT_M2: 600, // Space-grade low-outgassing anodization (prevents fogging mirrors)

  // ASSEMBLY (Clean Room Environment)
  ASSEMBLY_HOURLY_RATE: 110, // Specialist rate (Clean room technician)
  ASSEMBLY_hours_BASE: 24, // Cleaning, priming, slow curing
  ASSEMBLY_MINS_PER_CELL: 45, // Precision placement + wire bonding check

  // ELECTRONICS (Industrial/Scientific Grade)
  // Needs to be weatherproof (IP67) and noise-shielded (EMC) to not affect PMTs
  ELEC_BASE_FEE: 5000, // cRIO or PLC based controller + Enclosure
  ELEC_COST_PER_WATT: 4.0, // High grade power supplies/loads

  // ENGINEERING & COMPLIANCE (The hidden killer costs)
  NRE_DESIGN: 18000, // Mechanical/Thermal design iterations
  NRE_FEA_SIMULATION: 12000, // Structural analysis (Wind load survival @ 2400m)
  SAFETY_REVIEW_MEETINGS: 6000, // Preparing/Presenting TDR to Collaboration
  QUALIFICATION_TESTING: 8000, // Thermal cycling + Vibration test

  // LOGISTICS (Roque de los Muchachos)
  PACKAGING_CRATE: 2000, // Shock-proof crate
  TRANSPORT_INTL: 3500, // Air freight + Customs + Insurance
  LAST_MILE_MOUNTAIN: 1500, // Specialized transport up the winding road

  // INSTALLATION (High Altitude / High Risk)
  INSTALL_TEAM_DAILY_RATE: 2200, // 2 Senior Engineers + Travel + Residencia costs
  INSTALL_DAYS: 5, // Includes acclimatization, safety briefing, slow install
  CRANE_RENTAL_DAY: 1200, // Cherry picker or crane often needed for telescope access

  // RISK PREMIUM
  LIABILITY_INSURANCE: 5000, // Specific rider for working near optics
  CONTINGENCY_PCT: 0.35, // 35% Contingency for scientific prototypes
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
  const [showGaussian, setShowGaussian] = useState(0);
  const [realScale, setRealScale] = useState(false);

  const [hideUI, setHideUI] = useState(false);

  const [explodedView, setExplodedView] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLabels, setShowLabels] = useState(1);

  // ADVANCED UI STATE
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uiLayerThick, setUiLayerThick] = useState(0.0189);
  const [uiSinkThick, setUiSinkThick] = useState(0.0106);
  const [uiPvThick, setUiPvThick] = useState(0.2);
  const [uiPlateDim, setUiPlateDim] = useState(1.5);
  const [uiCpvScale, setUiCpvScale] = useState(0.7);
  const [uiNx, setUiNx] = useState(40);
  const [uiLayerNz, setUiLayerNz] = useState(9);
  const [uiSinkNz, setUiSinkNz] = useState(3);
  const [uiUseCircle, setUiUseCircle] = useState(false);
  const [uiSolarMode, setUiSolarMode] = useState<"none" | "pv" | "cpv">("cpv");

  // NEW: Boolean Toggles State
  const [uiUseFins, setUiUseFins] = useState(true);
  const [uiUseReflector, setUiUseReflector] = useState(true);

  // Material Keys
  const [uiBaseMatKey, setUiBaseMatKey] = useState("Al-1050A (Anodized)");
  const [uiSinkMatKey, setUiSinkMatKey] = useState("Al-1050A (Anodized)");

  // NEW: Environmental UI State
  const [uiWindSpeed, setUiWindSpeed] = useState(4.0); // m/s
  const [uiAmbientTemp, setUiAmbientTemp] = useState(25.0); // °C
  const [uiQSolar, setUiQSolar] = useState(1000.0); // W/m²

  const [activePresetKeys, setActivePresetKeys] = useState<string[]>([]);

  const [maxRoi, setMaxRoi] = useState(15);
  const [maxTemp, setMaxTemp] = useState(85);

  // NEW: Manual Cost State
  const [useManualCost, setUseManualCost] = useState(false);
  const [manualCostInput, setManualCostInput] = useState<number>(50000); // Default manual value

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
    layerNz: number;
    sinkNz: number;
    useCircle: boolean;
    usePv: boolean;
    useSolarCell: boolean;
    useFins: boolean;
    useReflector: boolean;
    baseMatKey: string;
    sinkMatKey: string;
    // NEW Params
    windSpeed: number;
    ambientTemp: number;
    qSolar: number;
  } | null>(null);

  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const [loaded, setLoaded] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  // --- NEW: SMART PRESET HANDLER ---
  const togglePreset = useCallback((key: string) => {
    const targetPreset = PRESETS[key];
    if (!targetPreset) return;

    setActivePresetKeys((prevKeys) => {
      // 1. If currently active, simply remove it (toggle off)
      if (prevKeys.includes(key)) {
        return prevKeys.filter((k) => k !== key);
      }

      // 2. If adding new one, check for overlaps with existing ones
      const targetParams = Object.keys(targetPreset).filter(
        (k) => k !== "name"
      );

      const nonConflictingKeys = prevKeys.filter((existingKey) => {
        const existingPreset = PRESETS[existingKey];
        if (!existingPreset) return false;

        const existingParams = Object.keys(existingPreset);
        // Check if they share any parameter key
        const hasOverlap = existingParams.some((p) => targetParams.includes(p));

        // If overlap exists, we remove the OLD one to let the NEW one take precedence
        return !hasOverlap;
      });

      return [...nonConflictingKeys, key];
    });

    // 3. Apply the values of the NEW preset immediately
    // Note: We don't need to re-apply old presets because their values
    // are already in the state. We just overwrite with the new one.
    if (targetPreset.fwhm !== undefined) setUiFwhm(targetPreset.fwhm);
    if (targetPreset.matrixSize !== undefined)
      setUiMatrixSize(targetPreset.matrixSize);
    if (targetPreset.magicArea !== undefined)
      setUiMagicArea(targetPreset.magicArea);
    if (targetPreset.layerThick !== undefined)
      setUiLayerThick(targetPreset.layerThick);
    if (targetPreset.sinkThick !== undefined)
      setUiSinkThick(targetPreset.sinkThick);
    if (targetPreset.pvThick !== undefined) setUiPvThick(targetPreset.pvThick);
    if (targetPreset.plateDim !== undefined)
      setUiPlateDim(targetPreset.plateDim);
    if (targetPreset.cpvScale !== undefined)
      setUiCpvScale(targetPreset.cpvScale);
    if (targetPreset.nx !== undefined) setUiNx(targetPreset.nx);
    if (targetPreset.layerNz !== undefined) setUiLayerNz(targetPreset.layerNz);
    if (targetPreset.sinkNz !== undefined) setUiSinkNz(targetPreset.sinkNz);
    if (targetPreset.useCircle !== undefined)
      setUiUseCircle(targetPreset.useCircle);
    if (targetPreset.usePv !== undefined) setUiSolarMode(targetPreset.usePv ? "pv" : "cpv");
    if (targetPreset.useFins !== undefined) setUiUseFins(targetPreset.useFins);
    if (targetPreset.useReflector !== undefined)
      setUiUseReflector(targetPreset.useReflector);
    if (targetPreset.baseMatKey !== undefined)
      setUiBaseMatKey(targetPreset.baseMatKey);
    if (targetPreset.sinkMatKey !== undefined)
      setUiSinkMatKey(targetPreset.sinkMatKey);
    // NEW: Apply Environmental Presets
    if (targetPreset.windSpeed !== undefined)
      setUiWindSpeed(targetPreset.windSpeed);
    if (targetPreset.ambientTemp !== undefined)
      setUiAmbientTemp(targetPreset.ambientTemp);
    if (targetPreset.qSolar !== undefined) setUiQSolar(targetPreset.qSolar);
  }, []);

  // --- NEW: GRANULAR MANUAL CHANGE HANDLER ---
  // When a specific param is changed manually, we only remove presets that controlled THAT param.
  const handleManualChange = useCallback((paramKey: keyof PresetDef) => {
    setActivePresetKeys((prevKeys) => {
      // Filter out any preset that defines the parameter being changed manually
      return prevKeys.filter((key) => {
        const preset = PRESETS[key];
        // Keep the preset only if it DOES NOT contain the changed parameter
        return (
          !preset || !Object.prototype.hasOwnProperty.call(preset, paramKey)
        );
      });
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      togglePreset("PC");
      const timer = setTimeout(() => {
        setIntroFinished(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loaded, togglePreset]);

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
      layerNz: uiLayerNz,
      sinkNz: uiSinkNz,
      useCircle: uiUseCircle,
      useSolarCell: uiSolarMode !== "none", // True if PV or CPV
      usePv: uiSolarMode === "pv",          // True only if PV mode
      // Pass new params
      useFins: uiUseFins,
      useReflector: uiUseReflector,
      baseMatKey: uiBaseMatKey,
      sinkMatKey: uiSinkMatKey,
      windSpeed: uiWindSpeed,
      ambientTemp: uiAmbientTemp,
      qSolar: uiQSolar,
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

    const currentMode = activeParams.useSolarCell 
        ? (activeParams.usePv ? "pv" : "cpv") 
        : "none";
    
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
        uiLayerNz !== activeParams.layerNz ||
        uiSinkNz !== activeParams.sinkNz ||
        uiUseCircle !== activeParams.useCircle ||
        uiSolarMode !== currentMode || // Check change
        uiUseFins !== activeParams.useFins || // Check change
        uiUseReflector !== activeParams.useReflector || // Check change
        uiBaseMatKey !== activeParams.baseMatKey ||
        uiSinkMatKey !== activeParams.sinkMatKey ||
        uiWindSpeed !== activeParams.windSpeed ||
        uiAmbientTemp !== activeParams.ambientTemp ||
        uiQSolar !== activeParams.qSolar
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
    uiLayerNz,
    uiSinkNz,
    uiUseCircle,
    uiSolarMode,
    uiUseFins,
    uiUseReflector,
    uiBaseMatKey,
    uiSinkMatKey,
    uiWindSpeed,
    uiAmbientTemp,
    uiQSolar,
  ]);

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

  // 1. Calculate Scientific Project Cost (Middle Case / Realistic)
  const projectCost = useMemo(() => {
    const area = Math.pow(uiPlateDim, 2);
    const baseMat = MATERIALS[uiBaseMatKey];
    const sinkMat = MATERIALS[uiSinkMatKey];

    // --- A. RAW MATERIALS ---
    const wasteFactor = PROJECT_COSTS.MATERIAL_WASTE_FACTOR;
    const volBaseRaw = area * uiLayerThick * wasteFactor;
    const finHeight = uiUseFins ? 0.04 : 0;
    const volSinkRaw = area * (uiSinkThick + finHeight) * wasteFactor;

    const costMatBase = volBaseRaw * baseMat.rho * baseMat.cost;
    const costMatSink = volSinkRaw * sinkMat.rho * sinkMat.cost;

    const volAg = area * PROJECT_COSTS.AG_THICKNESS;
    const costMatAg = uiUseReflector
      ? volAg * PROJECT_COSTS.AG_DENSITY * PROJECT_COSTS.AG_COST_PER_KG
      : 0;

    const cpvAreaCost = (uiSolarMode !== "none") 
        ? (uiSolarMode === "cpv" ? area * PROJECT_COSTS.CPV_PRICE_PER_M2 : area * 500) // 500 for standard PV
        : 0;

    const totalMaterials = costMatBase + costMatSink + costMatAg + cpvAreaCost;

    // --- B. FABRICATION & MACHINING ---
    let machiningCost = PROJECT_COSTS.CNC_SETUP_FEE;
    machiningCost +=
      area * PROJECT_COSTS.CNC_MACHINING_RATE_M2 * baseMat.machiningFactor;

    const sinkComplexity = uiUseFins ? PROJECT_COSTS.CNC_FINS_MULTIPLIER : 1.0;
    // Penalty for large plates (difficult to fixture/anodize)
    const sizePenalty = uiPlateDim > 1.0 ? 1.5 : 1.0;

    machiningCost +=
      area *
      PROJECT_COSTS.CNC_MACHINING_RATE_M2 *
      sinkMat.machiningFactor *
      sinkComplexity *
      sizePenalty;
    machiningCost += area * PROJECT_COSTS.SURFACE_TREAT_M2 * 2;

    // --- C. ASSEMBLY ---
    const totalCells = Math.pow(uiMatrixSize, 2);
    const assemblyHours =
      PROJECT_COSTS.ASSEMBLY_hours_BASE +
      (totalCells * PROJECT_COSTS.ASSEMBLY_MINS_PER_CELL) / 60;
    const assemblyCost = assemblyHours * PROJECT_COSTS.ASSEMBLY_HOURLY_RATE;

    // --- D. ELECTRONICS ---
    const pwrElectric = area * 1000 * 0.35;
    const electronicsCost =
      PROJECT_COSTS.ELEC_BASE_FEE +
      pwrElectric * PROJECT_COSTS.ELEC_COST_PER_WATT;

    // --- E. ENGINEERING (NRE) ---
    const nreCost =
      PROJECT_COSTS.NRE_DESIGN +
      PROJECT_COSTS.NRE_FEA_SIMULATION +
      PROJECT_COSTS.SAFETY_REVIEW_MEETINGS +
      PROJECT_COSTS.QUALIFICATION_TESTING;

    // --- F. LOGISTICS & INSTALLATION (SMART LOGIC) ---
    const logisticsCost =
      PROJECT_COSTS.PACKAGING_CRATE +
      PROJECT_COSTS.TRANSPORT_INTL +
      PROJECT_COSTS.LAST_MILE_MOUNTAIN;

    // 1. Is it too big for the stairs? (Stairs are approx 80cm-1m wide with cages)
    const isTooBigForStairs = uiPlateDim > 0.8;

    // 2. Is it too heavy for a 2-person manual carry up 20m of stairs?
    // Limit is typically 25kg per person. 50kg total.
    const isTooHeavy = structureWeight > 33;

    const needsCrane = isTooBigForStairs || isTooHeavy;

    // Crane Cost: If needed, we pay per day.
    const craneCost = needsCrane
      ? PROJECT_COSTS.CRANE_RENTAL_DAY * PROJECT_COSTS.INSTALL_DAYS
      : 0;

    // Install difficulty multiplier
    let installRiskMult = 1.0;
    if (needsCrane) installRiskMult += 0.5; // Coordination is harder with crane
    if (uiPlateDim > 1.2) installRiskMult += 0.3; // Wind risk

    const installCost =
      PROJECT_COSTS.INSTALL_DAYS *
        PROJECT_COSTS.INSTALL_TEAM_DAILY_RATE *
        installRiskMult +
      craneCost;

    const totalLogistics =
      logisticsCost + installCost + PROJECT_COSTS.LIABILITY_INSURANCE;

    // --- TOTALS ---
    const subTotal =
      totalMaterials +
      machiningCost +
      assemblyCost +
      electronicsCost +
      nreCost +
      totalLogistics;
    const contingency = subTotal * PROJECT_COSTS.CONTINGENCY_PCT;
    const calculatedTotal = subTotal + contingency;

    return {
      total: useManualCost ? manualCostInput : calculatedTotal,
      isManual: useManualCost,
      breakdown: {
        materials: totalMaterials,
        manufacturing: machiningCost,
        assembly: assemblyCost + electronicsCost,
        engineering: nreCost,
        logistics: totalLogistics + contingency,
      },
    };
  }, [
    uiPlateDim,
    uiLayerThick,
    uiSinkThick,
    uiBaseMatKey,
    uiSinkMatKey,
    uiMatrixSize,
    uiUseFins,
    uiSolarMode,
    uiUseReflector,
    structureWeight,
    useManualCost,
    manualCostInput,
  ]);

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

  // --- EXPORT REPORT HANDLER ---
  const handleExportReport = useCallback(() => {
    if (!activeParams || !projectCost || !paybackPeriod) return;

    const date = new Date().toLocaleString("es-ES");
    const filename = `StarrySky_Report_${
      new Date().toISOString().split("T")[0]
    }.txt`;

    const content = `
===================================================================
STARRY SKY - ENGINEERING FEASIBILITY REPORT
MAGIC TELESCOPE THERMAL MANAGEMENT SYSTEM
Generated: ${date}
Version: 14.0.0
===================================================================

[1] PROJECT TEAM
-------------------------------------------------------------------
Plant:                Aissam Khadraoui
Completer Finisher:   Candela García
Coordinator:          Filip Denis

[2] SYSTEM CONFIGURATION (INPUTS)
-------------------------------------------------------------------
FWHM:                     ${activeParams.focusOffset.toFixed(3)} m
Magic Reflective Area:    ${activeParams.magicArea.toFixed(1)} m²
Matrix Resolution:        ${activeParams.matrixSize}x${activeParams.matrixSize}
Plate Dimensions:         ${activeParams.plateDim}m x ${activeParams.plateDim}m

-- ENVIRONMENT --
Base Solar Irradiance:    ${activeParams.qSolar.toFixed(0)} W/m²
Ambient Temperature:      ${activeParams.ambientTemp.toFixed(1)} °C
Wind Speed:               ${activeParams.windSpeed.toFixed(1)} m/s

-- LAYER GEOMETRY --
Conductor Thickness:      ${(activeParams.layerThick * 1000).toFixed(2)} mm
Heatsink Thickness:       ${(activeParams.sinkThick * 1000).toFixed(2)} mm
(C)PV Thickness:          ${activeParams.pvThick.toFixed(2)} mm
Cell Scale Factor:        ${(activeParams.cpvScale * 100).toFixed(1)} %
Cell Shape:               ${
      activeParams.useCircle ? "Circular Array" : "Square Array"
    }
Electric Generation Mode: ${
      activeParams.usePv
        ? "Photovoltaic Cells"
        : activeParams.useSolarCell
        ? "Concentrated PV Cells"
        : "No Solar Cells"
    }

-- ADD-ONS --
Active Features:          [${activeParams.useFins ? "X" : " "}] Fins  [${
      activeParams.useReflector ? "X" : " "
    }] Reflector

-- MATERIALS --
Base Material:            ${MATERIALS[activeParams.baseMatKey].name} (k=${MATERIALS[activeParams.baseMatKey].kt} W/(m·K), rho=${MATERIALS[activeParams.baseMatKey].rho} kg/m³)
Sink Material:            ${MATERIALS[activeParams.sinkMatKey].name} (k=${MATERIALS[activeParams.sinkMatKey].kt} W/(m·K), rho=${MATERIALS[activeParams.sinkMatKey].rho} kg/m³)

[3] THERMAL & ELECTRICAL PERFORMANCE
-------------------------------------------------------------------
Status:                   ${simStats.status.toUpperCase()}
Max Temperature:          ${simStats.maxTemp.toFixed(2)} °C
Electrical Output:        ${simStats.pElectric.toFixed(2)} W

[4] STRUCTURAL ANALYSIS
-------------------------------------------------------------------
Total Mass:               ${structureWeight.toFixed(2)} kg
Lifting Requirement:      ${
      structureWeight > 50 ? "CRANE REQUIRED" : "MANUAL LIFT OK"
    }

[5] ECONOMIC BREAKDOWN (Estimate)
-------------------------------------------------------------------
Calculation Mode:         ${
      useManualCost ? "MANUAL OVERRIDE" : "AUTOMATIC ESTIMATION"
    }
-------------------------------------------------------------------
> Raw Materials:          € ${projectCost.breakdown.materials.toFixed(2)}
> Manufacturing:          € ${projectCost.breakdown.manufacturing.toFixed(2)}
> Assembly & Elec:        € ${projectCost.breakdown.assembly.toFixed(2)}
> Engineering (NRE):      € ${projectCost.breakdown.engineering.toFixed(2)}
> Logistics & Install:    € ${projectCost.breakdown.logistics.toFixed(2)}
-------------------------------------------------------------------
TOTAL CAPEX (COST):       € ${projectCost.total.toFixed(2)}

[6] ROI CALCULATION
-------------------------------------------------------------------
Annual Savings:           € ${paybackPeriod.annualSavings.toFixed(2)} / yr
Payback Period:           ${paybackPeriod.years.toFixed(1)} Years
Viability (${maxRoi}yr max):     ${
      paybackPeriod.isViable ? "VIABLE" : "NOT VIABLE"
    }

===================================================================
CONFIDENTIAL - INTERNAL USE ONLY
STARRY SKY ENGINEERING GROUP
===================================================================
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [
    activeParams,
    projectCost,
    paybackPeriod,
    simStats,
    structureWeight,
    useManualCost,
    maxRoi,
  ]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden rounded-2xl">
      {/* HEADER */}
      <div
        className={`absolute w-full top-0 left-0 px-8 py-3 z-50 pointer-events-none select-none flex justify-between items-center transition-all duration-1000 ease-out border-b border-white/20 bg-neutral-900 shadow-2xl ${
          introFinished && !hideUI
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-8"
        }`}
      >
        <div className="flex justify-between w-full">
          <div className="flex gap-5">
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">
              STARRY SKY
            </h1>
            <div className="h-9 border-r border-cyan-700" />
            <div className="flex items-center gap-4 text-[10px] md:text-xs font-medium text-cyan-400 uppercase tracking-widest">
              <div className="flex flex-col items-end leading-none">
                <span className="text-white font-bold">Aissam Khadraoui</span>
                <span className="text-[8px] text-gray-500">Plant</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex flex-col items-end leading-none">
                <span className="text-white font-bold">Candela García</span>
                <span className="text-[8px] text-gray-500">
                  Completer Finisher
                </span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex flex-col items-end leading-none">
                <span className="text-white font-bold">Filip Denis</span>
                <span className="text-[8px] text-gray-500">Coordinator</span>
              </div>
            </div>
          </div>
          {/* NEW SYSTEM STATUS BAR (IN HEADER) */}
          <div className="ml-4 pointer-events-auto">
            <SystemStatusBar
              status={simStats.status}
              loading={simStats.loading}
            />
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
            ? "opacity-100 scale-100"
            : "opacity-0  scale-110"
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
        <PerspectiveCamera makeDefault position={[2, 0, 2]} fov={40} />
        <OrbitControls
          makeDefault
          minDistance={2}
          maxDistance={50}
          target={[0, 0, 0]}
          enablePan={true}
          panSpeed={1.0}
        />
        {/* ENGINEERING COORDINATE SYSTEM (Bottom-Right) */}
        <GizmoHelper alignment="bottom-left" margin={[150, 130]}>
          <GizmoViewport
            axisColors={["#ff3653", "#0adb50", "#2c8fdf"]}
            labelColor="white"
            hideNegativeAxes={true}
          />
        </GizmoHelper>
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
            simLayerNz={activeParams?.layerNz ?? null}
            simSinkNz={activeParams?.sinkNz ?? null}
            simUseCircle={activeParams?.useCircle ?? null}
            simUsePv={activeParams?.usePv ?? null}
            simUseSolarCell={activeParams?.useSolarCell ?? null}
            // Pass new sim params
            simUseFins={activeParams?.useFins ?? null}
            simUseReflector={activeParams?.useReflector ?? null}
            simBaseMatKey={activeParams?.baseMatKey ?? null}
            simSinkMatKey={activeParams?.sinkMatKey ?? null}
            simWindSpeed={activeParams?.windSpeed ?? null}
            simAmbientTemp={activeParams?.ambientTemp ?? null}
            simQSolar={activeParams?.qSolar ?? null}
            visMatrixSize={uiMatrixSize}
            visFwhm={uiFwhm}
            visMagicArea={uiMagicArea}
            visCpvScale={uiCpvScale}
            visUseCircle={uiUseCircle}
            visLayerThick={realScale ? uiLayerThick : uiLayerThick * 5}
            visSinkThick={realScale ? uiSinkThick : uiSinkThick * 5}
            visUseFins={uiUseFins}
            visUseReflector={uiUseReflector}
            visSolarMode={uiSolarMode}
            visBaseMatKey={uiBaseMatKey}
            visSinkMatKey={uiSinkMatKey}
            hasPendingChanges={hasPendingChanges}
            status={simStats}
            realScale={realScale}
            showGaussian={showGaussian}
            explodedView={explodedView}
            showGrid={showGrid}
            showLabels={showLabels}
            visNx={uiNx} // Controlling grid visually via same variable
            visLayerNz={uiLayerNz}
            visSinkNz={uiSinkNz}
            onUpdateStats={onUpdateStats}
          />
        </Suspense>
      </Canvas>

      {/* LEFT CONTROL PANEL */}
      <div
        className={`absolute z-30 top-22 left-8 flex flex-col items-start gap-4 pointer-events-auto transition-all duration-1000 ${
          introFinished && !hideUI
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-10 pointer-events-none"
        }`}
      >
        {/* UPDATED MULTI-SELECTOR */}
        <div className="w-full">
          <PresetSelector
            activeKeys={activePresetKeys}
            onToggle={togglePreset}
          />
        </div>

        {/* UNIFIED COMPACT INPUT */}
        <div className="w-full bg-neutral-900 p-2 rounded-xl border border-white/10 shadow-xl">
          {/* Header with Status Indicator */}
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
              Visualització
            </span>

            {/* Logic: If results exist and not loading -> Visualization Mode */}
            {activeParams && !simStats.loading && !hasPendingChanges ? (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 px-2 py-0.5 rounded border border-red-500/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                </span>
                <span className="text-[7px] font-bold uppercase text-red-400 tracking-wide">
                  Temp. Activa
                </span>
              </div>
            ) : (
              <div className="h-1 w-1 bg-gray-600 rounded-full"></div>
            )}
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {/* 1. HEAT (Flux) */}
            <button
              onClick={() => setShowGaussian((prev) => (prev + 1) % 3)}
              title="Veure Distribució de Calor Incident"
              className={`aspect-square cursor-pointer flex flex-col items-center justify-center rounded-md border transition-all duration-200 active:scale-95 group ${
                showGaussian === 1
                  ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                  : showGaussian === 2
                  ? "bg-red-500/20 border-red-500/50 text-red-400"
                  : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mb-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span className="text-[6px] font-black uppercase">Flux</span>
            </button>

            {/* 2. SCALE (Real) */}
            <button
              onClick={() => setRealScale(!realScale)}
              title="Escala Z Real (1:1)"
              className={`aspect-square cursor-pointer flex flex-col items-center justify-center rounded-md border transition-all duration-200 active:scale-95 group ${
                realScale
                  ? "bg-green-500/20 border-green-500/50 text-green-400"
                  : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mb-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2a2 2 0 100-4 2 2 0 000 4z"
                />
              </svg>
              <span className="text-[6px] font-black uppercase">Real</span>
            </button>

            {/* 3. GRID (Malla) */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              title="Veure Malla de Càlcul"
              className={`aspect-square flex flex-col items-center justify-center rounded-md border transition-all duration-200 active:scale-95 group ${
                activeParams && !simStats.loading && !hasPendingChanges
                  ? "opacity-30 cursor-not-allowed bg-black/20 border-transparent text-gray-600"
                  : showGrid
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 cursor-pointer"
                  : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300 cursor-pointer"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mb-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <span className="text-[6px] font-black uppercase">Malla</span>
            </button>

            {/* 4. LAYERS (Capes) - Disabled if Simulating */}
            <button
              onClick={() => setExplodedView(!explodedView)}
              title="Obrir/Tancar Capes"
              className={`aspect-square flex flex-col items-center justify-center rounded-md border transition-all duration-200 group ${
                activeParams && !simStats.loading && !hasPendingChanges
                  ? "opacity-30 cursor-not-allowed bg-black/20 border-transparent text-gray-600"
                  : explodedView
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-400 active:scale-95 cursor-pointer"
                  : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300 active:scale-95 cursor-pointer"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mb-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span className="text-[6px] font-black uppercase">Capes</span>
            </button>

            {/* 5. LABELS (Info) - Disabled if Simulating */}
            <button
              onClick={() => setShowLabels((prev) => (prev + 1) % 3)}
              disabled={
                !!(activeParams && !simStats.loading && !hasPendingChanges)
              }
              title="Mostrar Etiquetes (Desactivat durant simulació)"
              className={`aspect-square flex flex-col items-center justify-center rounded-md border transition-all duration-200 group ${
                activeParams && !simStats.loading && !hasPendingChanges
                  ? "opacity-30 cursor-not-allowed bg-black/20 border-transparent text-gray-600"
                  : showLabels === 1
                  ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-300 active:scale-95 cursor-pointer"
                  : showLabels === 2
                  ? "bg-yellow-500/30 border-yellow-500/70 text-yellow-400 active:scale-95 cursor-pointer"
                  : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300 active:scale-95 cursor-pointer"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mb-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-[6px] font-black uppercase">Info</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced(true)}
          className="group cursor-pointer w-full flex items-center justify-between px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl transition-all duration-300"
        >
          <span className="text-[10px] uppercase tracking-widest font-bold text-cyan-400 transition-colors">
            Configurar Paràmteres
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
              className="w-4 h-4 text-cyan-400 animate-spin"
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
      {/* ADVANCED SETTINGS SIDEBAR (Sliding from Left) */}
      <div
        className={`absolute top-0 left-0 h-full z-[60] w-full md:w-[500px] bg-neutral-900 border-r border-white/10 flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] will-change-transform ${
          showAdvanced
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        {/* --- Header (Fixed) --- */}
        <div className="flex-none flex items-center justify-between p-6 pb-4 border-b border-white/10 bg-neutral-900/50">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-white">
              Configuració Avançada
            </h2>
            <p className="text-[10px] text-gray-400 mt-1">
              Ajusts manuals de paràmetres
            </p>
          </div>
          <button
            onClick={() => setShowAdvanced(false)}
            className="cursor-pointer text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
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
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-10 no-scrollbar">
          {/* SECTION 1: GEOMETRIA I DIMENSIONS */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-cyan-500/80 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
              Paràmetres del Telescopi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ControlRow
                label="FWHM (m)"
                value={uiFwhm.toFixed(3)}
                colorClass="text-cyan-400"
                onDec={() => {
                  setUiFwhm((p) => Math.max(p - 0.01, 0));
                  handleManualChange("fwhm");
                }}
                onInc={() => {
                  setUiFwhm((p) => Math.min(p + 0.01, FWHM_MAX));
                  handleManualChange("fwhm");
                }}
                onSet={(n) => {
                  setUiFwhm((p) => Math.min(Math.max(n, 0), FWHM_MAX));
                  handleManualChange("fwhm");
                }}
                showMax
                showMin
                onMax={() => {
                  setUiFwhm(FWHM_MAX);
                  handleManualChange("fwhm");
                }}
                onMin={() => {
                  setUiFwhm(FWHM_MIN);
                  handleManualChange("fwhm");
                }}
              />
              <ControlRow
                label="Àrea (m²)"
                value={uiMagicArea}
                colorClass="text-cyan-400"
                onDec={() => {
                  setUiMagicArea((p) =>
                    Math.max(p - 1, Math.pow(uiMatrixSize, 2))
                  );
                  handleManualChange("magicArea");
                }}
                onInc={() => {
                  setUiMagicArea((p) => Math.min(p + 1, 236));
                  handleManualChange("magicArea");
                }}
                onSet={(n) => {
                  setUiMagicArea(Math.max(Math.min(n, 236), 0));
                  handleManualChange("magicArea");
                }}
                onMax={() => {
                  setUiMagicArea(236);
                  handleManualChange("magicArea");
                }}
                onMin={() => {
                  setUiMagicArea(Math.pow(uiMatrixSize, 2));
                  handleManualChange("magicArea");
                }}
                showMax
                showMin
              />
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* NEW SECTION: ENTORN I AMBIENT */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-emerald-500/80 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Entorn i Ambient
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ControlRow
                label="Irradiància"
                value={uiQSolar.toFixed(0)}
                unit="W/m²"
                colorClass="text-emerald-400"
                onDec={() => {
                  setUiQSolar((p) => Math.max(p - 50, 0));
                  handleManualChange("qSolar");
                }}
                onInc={() => {
                  setUiQSolar((p) => Math.min(p + 50, 2000));
                  handleManualChange("qSolar");
                }}
                onSet={(n) => {
                  setUiQSolar(Math.max(Math.min(n, 2000), 0));
                  handleManualChange("qSolar");
                }}
              />
              <ControlRow
                label="Temp. Ambient"
                value={uiAmbientTemp.toFixed(1)}
                unit="°C"
                colorClass="text-emerald-400"
                onDec={() => {
                  setUiAmbientTemp((p) => Math.max(p - 1, -50));
                  handleManualChange("ambientTemp");
                }}
                onInc={() => {
                  setUiAmbientTemp((p) => Math.min(p + 1, 80));
                  handleManualChange("ambientTemp");
                }}
                onSet={(n) => {
                  setUiAmbientTemp(Math.max(Math.min(n, 80), -50));
                  handleManualChange("ambientTemp");
                }}
              />
              <ControlRow
                label="Vel. Vent"
                value={uiWindSpeed.toFixed(1)}
                unit="m/s"
                colorClass="text-emerald-400"
                onDec={() => {
                  setUiWindSpeed((p) => Math.max(p - 0.5, 0));
                  handleManualChange("windSpeed");
                }}
                onInc={() => {
                  setUiWindSpeed((p) => Math.min(p + 0.5, 50));
                  handleManualChange("windSpeed");
                }}
                onSet={(n) => {
                  setUiWindSpeed(Math.max(Math.min(n, 50), 0));
                  handleManualChange("windSpeed");
                }}
              />
            </div>
          </div>

          <div className="border-t border-white/5" />

          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-purple-500/80 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
              Geometria i Dimensions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ControlRow
                label="Matriu NxN"
                value={`${uiMatrixSize}x${uiMatrixSize}`}
                colorClass="text-purple-400"
                onDec={() => {
                  setUiMatrixSize((p) => Math.max(p - 1, MATRIX_SIZE_MIN));
                  handleManualChange("matrixSize");
                }}
                onInc={() => {
                  setUiMatrixSize((p) => Math.min(p + 1, MATRIX_SIZE_MAX));
                  handleManualChange("matrixSize");
                }}
              />
              <ControlRow
                label="Mida Placa"
                value={uiPlateDim.toFixed(1)}
                unit="m"
                colorClass="text-purple-400"
                onDec={() => {
                  setUiPlateDim((p) => Math.max(p - 0.1, 0.01));
                  handleManualChange("plateDim");
                }}
                onInc={() => {
                  setUiPlateDim((p) => Math.min(p + 0.1, 3.0));
                  handleManualChange("plateDim");
                }}
              />
              <ControlRow
                label="Gruix Conductor"
                value={uiLayerThick.toFixed(4)}
                unit="m"
                colorClass="text-purple-400"
                onDec={() => {
                  setUiLayerThick((p) => Math.max(p - 0.005, 0.005));
                  handleManualChange("layerThick");
                }}
                onInc={() => {
                  setUiLayerThick((p) => Math.min(p + 0.005, 0.1));
                  handleManualChange("layerThick");
                }}
                onSet={(n) => {
                  setUiLayerThick(Math.max(Math.min(n, 0.1), 0.005));
                  handleManualChange("layerThick");
                }}
              />
              <ControlRow
                label="Gruix Dissipador"
                value={uiSinkThick.toFixed(4)}
                unit="m"
                colorClass="text-purple-400"
                onDec={() => {
                  setUiSinkThick((p) => {
                    const val = Math.max(p - 0.005, 0.0);
                    if (val < 0.001) setUiUseFins(false);
                    return val;
                  });
                  handleManualChange("sinkThick");
                }}
                onInc={() => {
                  setUiSinkThick((p) => Math.min(p + 0.005, 0.1));
                  handleManualChange("sinkThick");
                }}
                onSet={(n) => {
                  setUiSinkThick(Math.max(Math.min(n, 0.1), 0.005));
                  handleManualChange("sinkThick");
                }}
              />
              <ControlRow
                label="Gruix (C)PV"
                value={uiPvThick.toFixed(4)}
                unit="mm"
                colorClass="text-purple-400"
                onDec={() => {
                  setUiPvThick((p) => Math.max(p - 0.1, 0.2));
                  handleManualChange("pvThick");
                }}
                onInc={() => {
                  setUiPvThick((p) => Math.min(p + 0.1, 10));
                  handleManualChange("pvThick");
                }}
                onSet={(n) => {
                  setUiPvThick(Math.max(Math.min(n, 10), 0.2));
                  handleManualChange("pvThick");
                }}
              />
              <ControlRow
                label="Escala CPV"
                value={(uiCpvScale * 100).toFixed(0)}
                unit="%"
                colorClass="text-purple-400"
                onDec={() => {
                  setUiCpvScale((p) => Math.max(p - 0.01, 0.1));
                  handleManualChange("cpvScale");
                }}
                onInc={() => {
                  setUiCpvScale((p) => Math.min(p + 0.01, 1.0));
                  handleManualChange("cpvScale");
                }}
              />
              <div className="col-span-1 sm:col-span-2">
                <ToggleRow
                  label="Forma Circular (C)PV"
                  colorClass="text-purple-400"
                  checked={uiUseCircle}
                  onChange={(v) => {
                    setUiUseCircle(v);
                    handleManualChange("useCircle");
                  }}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* SECTION 2: MATERIALS I COMPONENTS */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-blue-500/80 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Materials i Components
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <MaterialSelector
                label="Material Conductor"
                selectedKey={uiBaseMatKey}
                onChange={(v) => {
                  setUiBaseMatKey(v);
                  handleManualChange("baseMatKey");
                }}
                colorClass="text-blue-400"
              />
              <MaterialSelector
                label="Material Dissipador"
                selectedKey={uiSinkMatKey}
                onChange={(v) => {
                  setUiSinkMatKey(v);
                  handleManualChange("sinkMatKey");
                }}
                colorClass="text-blue-400"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div
                  className={`col-span-1 sm:col-span-2 ${
                    uiSinkThick < 0.001
                      ? "opacity-50 pointer-events-none grayscale"
                      : ""
                  }`}
                >
                  <ToggleRow
                    label="Aletes Dissipació"
                    colorClass="text-blue-400"
                    checked={uiUseFins}
                    onChange={(v) => {
                      setUiUseFins(v);
                      handleManualChange("useFins");
                    }}
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <ToggleRow
                    label="Capa reflectora"
                    colorClass="text-blue-400"
                    checked={uiUseReflector}
                    onChange={(v) => {
                      setUiUseReflector(v);
                      handleManualChange("useReflector");
                    }}
                  />
                </div>
                <MultiStateToggle
                  label="Tipus de Captació Solar"
                  value={uiSolarMode}
                  options={[
                    { label: "Cap (Tèrmic)", value: "none" },
                    { label: "PV Estàndard", value: "pv" },
                    { label: "CPV (High Tech)", value: "cpv" },
                  ]}
                  onChange={(val) => {
                    setUiSolarMode(val as any);
                    handleManualChange("usePv"); // Reuse existing key or add new one
                  }}
                  colorClass="text-blue-400"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-white/5" />

          {/* SECTION 3: SIMULACIÓ I LÍMITS */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-pink-500/80 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              Simulació i Límits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ControlRow
                label="Resolució XY"
                value={uiNx}
                colorClass="text-pink-400"
                onDec={() => {
                  setUiNx((p) => Math.max(p - 10, 10));
                  handleManualChange("nx");
                }}
                onInc={() => {
                  setUiNx((p) => Math.min(p + 10, 100));
                  handleManualChange("nx");
                }}
              />
              <ControlRow
                label="Resolució Z Conductor"
                value={uiLayerNz}
                colorClass="text-pink-400"
                onDec={() => {
                  setUiLayerNz((p) => Math.max(p - 1, 3));
                  handleManualChange("layerNz");
                }}
                onInc={() => {
                  setUiLayerNz((p) => Math.min(p + 1, 20));
                  handleManualChange("layerNz");
                }}
              />
              <div
                className={` ${
                  uiSinkThick < 0.001
                    ? "opacity-50 pointer-events-none grayscale"
                    : ""
                }`}
              >
                <ControlRow
                  label="Resolució Z Dissipador"
                  value={uiSinkNz}
                  colorClass="text-pink-400"
                  onDec={() => {
                    setUiSinkNz((p) => Math.max(p - 1, 3));
                    handleManualChange("sinkNz");
                  }}
                  onInc={() => {
                    setUiSinkNz((p) => Math.min(p + 1, 20));
                    handleManualChange("sinkNz");
                  }}
                />
              </div>
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

          {/* Bottom Padding for scroll */}
          <div className="h-10" />
        </div>

        {/* --- Footer (Fixed) --- */}
        <div className="flex-none p-6 border-t border-white/10 bg-neutral-900/50 flex justify-end gap-3">
          <button
            onClick={() => setShowAdvanced(false)}
            className="px-6 py-3 cursor-pointer rounded-xl bg-cyan-600 hover:bg-cyan-500 text-[10px] font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-cyan-900/20"
          >
            Aplicar Canvis
          </button>
        </div>
      </div>
      {/* RIGHT STATS PANEL */}
      <div
        className={`absolute top-22 right-8 w-[320px] pointer-events-auto bg-neutral-900/95 p-5 rounded-2xl border border-white/20 shadow-2xl transition-all duration-1000 hover:border-cyan-500/30 ${
          introFinished && !hideUI
            ? "opacity-100 translate-x-0"
            : "opacity-0 translate-x-10"
        }`}
      >
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
            Dades de viabilitat
          </h3>
        </div>

        {/* ALWAYS SHOW STRUCTURAL WEIGHT */}
        <div className="flex justify-between items-center mb-4">
          <p
            className={`text-[11px] uppercase tracking-wider ${
              structureWeight > 200 ? "text-red-400" : "text-white"
            }`}
          >
            Pes Estructural
          </p>
          <p
            className={`font-mono font-bold text-lg ${
              structureWeight > 200 ? "text-red-400" : "text-white"
            } leading-none`}
          >
            {structureWeight.toFixed(1)} kg
          </p>
        </div>
        <div className="flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-300">
          {/* COST INPUT / TOGGLE SECTION */}
          <div className="flex flex-col gap-2 bg-neutral-800/50 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase text-gray-300 font-bold">
                Mode de Cost
              </span>
              <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/5">
                <button
                  onClick={() => setUseManualCost(false)}
                  className={`px-2 py-1 cursor-pointer text-[9px] font-bold uppercase rounded-md transition-all ${
                    !useManualCost
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  Auto
                </button>
                <button
                  onClick={() => setUseManualCost(true)}
                  className={`px-2 py-1 cursor-pointer text-[9px] font-bold uppercase rounded-md transition-all ${
                    useManualCost
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>

            {useManualCost ? (
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">€</span>
                <input
                  type="number"
                  value={manualCostInput}
                  onChange={(e) => setManualCostInput(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-right font-mono text-white text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-yellow-500/80">Estimat</span>
                <span className="font-mono font-bold text-lg text-yellow-400">
                  {projectCost.total.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* ROI RESULTS BLOCK */}
          {paybackPeriod && (
            <div
              className={`rounded-lg p-3 border flex flex-col gap-3 ${
                paybackPeriod.isViable
                  ? "bg-green-900/10 border-green-500/30"
                  : "bg-red-900/10 border-red-300/30"
              }`}
            >
              {/* 1. Annual Savings */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-gray-300">
                  Beneficis anuals
                </span>
                <span className="font-mono font-bold text-white">
                  {paybackPeriod.annualSavings.toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-wider text-gray-300">
                  Beneficis bruts ({maxRoi}a)
                </span>
                <span className="font-mono font-bold text-white">
                  {(maxRoi * paybackPeriod.annualSavings).toLocaleString(
                    "es-ES",
                    {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }
                  )}
                </span>
              </div>
              <div className="border-t border-white/10 my-1"></div>

              {/* 2. ROI Years */}
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    paybackPeriod.isViable ? "text-green-300" : "text-red-300"
                  }`}
                >
                  Retorn Inversió
                </span>
                <span
                  className={`font-mono font-bold text-lg ${
                    paybackPeriod.isViable ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {paybackPeriod.years.toFixed(1)} Anys
                </span>
              </div>

              <div className="border-t border-white/10 my-1"></div>

              {/* 3. Total Profit (Projected) */}
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] uppercase tracking-wider ${
                    paybackPeriod.isViable ? "text-green-300" : "text-red-300"
                  }`}
                >
                  Benefici Net ({maxRoi}a)
                </span>
                <span
                  className={`font-mono font-bold text-lg ${
                    paybackPeriod.isViable ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {(
                    (maxRoi - paybackPeriod.years) *
                    paybackPeriod.annualSavings
                  ).toLocaleString("es-ES", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          )}
          {!paybackPeriod && (
            <div className="p-4 text-center border border-dashed border-white/10 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                Dades de viabilitat no disponibles
              </p>
            </div>
          )}
          {/* EXPORT BUTTON - ONLY VISIBLE WHEN RESULTS EXIST */}
          {activeParams && !simStats.loading && !hasPendingChanges && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
              <button
                onClick={handleExportReport}
                className="group cursor-pointer w-full relative overflow-hidden rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 active:scale-95"
              >
                <div className="absolute inset-0 bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <div className="relative flex items-center justify-center gap-3 py-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-cyan-400 group-hover:text-white transition-colors"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                  <div className="flex flex-col items-start leading-none">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">
                      Exportar Informe
                    </span>
                    <span className="text-[8px] font-mono text-cyan-400/80 mt-0.5">
                      .TXT
                    </span>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM HUD BAR */}
      {activeParams &&
      !hideUI &&
      simStats.maxTemp > 0 &&
      simStats.status !== "Stopped" &&
      !simStats.loading &&
      !hasPendingChanges ? (
        <div className="absolute bottom-0 left-0 z-50 w-full bg-neutral-900 border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          {/* Flex Container: Single Horizontal Line */}
          <div className="flex items-center justify-between px-4 py-1 gap-6 overflow-x-auto no-scrollbar h-16">
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
        !simStats.loading &&
        !hideUI &&
        introFinished && (
          // Placeholder Bar when not running
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="px-6 py-2 bg-neutral-900/80 border border-white/10 rounded-full shadow-2xl text-xs text-gray-400 italic">
              {hasPendingChanges
                ? "⚠️ Paràmetres modificats. Executeu la simulació."
                : "ℹ️ Inicieu la simulació per veure resultats."}
            </div>
          </div>
        )
      )}
      {/* FLOATING HIDE/SHOW UI BUTTON (Bottom Right Corner) */}
      {introFinished && (
        <div className="absolute bottom-12 right-6 z-[60] pointer-events-auto">
          <button
            onClick={() => setHideUI(!hideUI)}
            className={`group cursor-pointer relative flex items-center justify-center w-12 h-12 rounded-full border shadow-2xl transition-all duration-300 ${
              hideUI
                ? "bg-cyan-600/80 border-cyan-400 text-white hover:bg-cyan-500"
                : "bg-black/40 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title={hideUI ? "Mostrar UI" : "Amagar UI"}
          >
            {hideUI ? (
              // Eye Open Icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              // Eye Slash Icon
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
