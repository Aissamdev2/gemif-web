"use client";

import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
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
import { useLoader } from "@react-three/fiber";
import { TextureLoader, RepeatWrapping, BackSide, Texture } from "three";

import init, { run_thermal_simulation } from "../wasm-embeddings/solar.js";
// --- Constants & Configuration ---
// Change these to your actual file paths in the public folder
const SKY_TEXTURE_URL = "/textures/sky.jpg";
const GROUND_TEXTURE_URL = "/textures/ground.jpg";

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

// --- Helper Components ---

function getSRGBEncodingIfAvailable(): number | undefined {
  // different three.js versions expose different symbols; try a few fallbacks
  const threeAny = THREE as any;
  return (
    threeAny.sRGBEncoding ??
    threeAny.SRGBEncoding ??
    threeAny.SRGBColorSpace ??
    undefined
  );
}

export function SkySphere() {
  // always call useLoader (never conditional)
  const texture = useLoader(TextureLoader, SKY_TEXTURE_URL) as
    | THREE.Texture
    | undefined;

  useEffect(() => {
    if (!texture) return;
    try {
      const sRGB = getSRGBEncodingIfAvailable();
      if (sRGB !== undefined) {
        // TS sometimes complains about .encoding so cast to any
        (texture as any).encoding = sRGB;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.repeat.set(1, 1); // horizontal repeats once
      }
      texture.needsUpdate = true;
    } catch (err) {
      console.warn("Could not set sky texture encoding:", err);
    }
  }, [texture]);

  return (
    <mesh scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 128, 128]} />
      <meshBasicMaterial
        map={texture ?? undefined}
        color={texture ? "white" : "#87CEEB"}
        side={(THREE as any).BackSide ?? THREE.BackSide}
        fog={false}
      />
    </mesh>
  );
}

export function TexturedGround() {
  const { gl } = useThree();
  const texture = useLoader(TextureLoader, GROUND_TEXTURE_URL) as
    | THREE.Texture
    | undefined;

  useEffect(() => {
    if (!texture) return;

    try {
      // wrapping & repeat
      (texture as any).wrapS = (texture as any).wrapT = RepeatWrapping;
      texture.repeat.set(15, 15);
    } catch (err) {
      console.warn("Could not set repeat/wrap on ground texture:", err);
    }

    try {
      // anisotropy: try common places safely
      let maxAnisotropy = 1;
      const glAny = gl as any;
      if (glAny?.capabilities) {
        const caps = glAny.capabilities;
        if (typeof caps.getMaxAnisotropy === "function") {
          maxAnisotropy = caps.getMaxAnisotropy();
        } else if (typeof caps.maxAnisotropy === "number") {
          maxAnisotropy = caps.maxAnisotropy;
        }
      } else if (typeof glAny.getMaxAnisotropy === "function") {
        maxAnisotropy = glAny.getMaxAnisotropy();
      }
      (texture as any).anisotropy = maxAnisotropy;
    } catch (err) {
      console.warn("Could not set anisotropy for ground texture:", err);
    }

    try {
      const sRGB = getSRGBEncodingIfAvailable();
      if (sRGB !== undefined) (texture as any).encoding = sRGB;
      texture.needsUpdate = true;
    } catch (err) {
      console.warn("Could not set encoding for ground texture:", err);
    }
  }, [texture, gl]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? "white" : "#456b3e"}
        roughness={0.9}
      />
    </mesh>
  );
}

const GaussianPlot = ({
  focusOffset,
  matrixSize,
}: {
  focusOffset: number;
  matrixSize: number;
}) => {
  const SIGMA_MIN = 0.15;
  const SIGMA_MAX = 1.5;
  const OFFSET_RANGE = Math.abs(FOCUS_OFFSET_MIN - FOCUS_OFFSET_MAX);
  const sigma =
    SIGMA_MIN +
    (SIGMA_MAX - SIGMA_MIN) * (Math.abs(focusOffset) / OFFSET_RANGE);
  const amplitude = 0.9 / matrixSize;
  const spacing = 0.6;
  const width = 220;
  const height = 140;
  const padding = 20;
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  const points = useMemo(() => {
    const plotPoints: [number, number][] = [];
    const numPoints = 150;
    const xRange = 4.0;
    const centers: number[] = [];
    if (matrixSize === 1) centers.push(0);
    else {
      const start = -((matrixSize - 1) * spacing) / 2;
      for (let i = 0; i < matrixSize; i++) centers.push(start + i * spacing);
    }
    for (let i = 0; i <= numPoints; i++) {
      const x = -xRange + (i / numPoints) * (2 * xRange);
      let ySum = 0;
      for (let c of centers)
        ySum += amplitude * Math.exp(-Math.pow(x - c, 2) / (2 * sigma * sigma));
      const svgX = padding + (i / numPoints) * plotWidth;
      const svgY = padding + plotHeight - Math.min(ySum, 1.0) * plotHeight;
      plotPoints.push([svgX, svgY]);
    }
    return plotPoints;
  }, [sigma, amplitude, matrixSize, plotWidth, plotHeight, padding]);

  const pathData =
    points.length > 0
      ? `M ${points[0][0]} ${points[0][1]} ` +
        points
          .slice(1)
          .map((p) => `L ${p[0]} ${p[1]}`)
          .join(" ")
      : "";

  return (
    <div className="absolute top-24 right-8 bg-black/70 backdrop-blur-md p-5 rounded-xl border border-white/10 shadow-2xl text-white w-[260px]">
      <h3 className="text-sm font-bold mb-1 text-cyan-400">
        Senyal d'Incidència (Tall 1D)
      </h3>
      <p className="text-xs opacity-70 mb-4 leading-tight">
        Distribució d'energia matriu {matrixSize}x{matrixSize}.
        <br />
        Amplitud màxima: {(amplitude * 100).toFixed(0)}%
      </p>
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="plotGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L ${width - padding} ${
              height - padding
            } L ${padding} ${height - padding} Z`}
            fill="url(#plotGradient)"
          />
          <path
            d={pathData}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="white"
            strokeOpacity="0.3"
          />
          <line
            x1={width / 2}
            y1={height - padding}
            x2={width / 2}
            y2={padding}
            stroke="white"
            strokeOpacity="0.1"
            strokeDasharray="4"
          />
        </svg>
        <div className="absolute top-0 right-0 bg-cyan-900/50 px-2 py-1 rounded text-[10px] font-mono text-cyan-300 border border-cyan-700/50">
          σ = {sigma.toFixed(3)}
        </div>
      </div>
    </div>
  );
};

const tempColor = new THREE.Color();
function updateHeatColor(t: number, targetArray: Uint8Array, offset: number) {
  // ... (Same color logic)
  const val = Math.min(Math.max(t, 0), 1);
  if (val < 0.33) {
    tempColor.setRGB(val * 3, 0, 0);
  } else if (val < 0.66) {
    tempColor.setRGB(1, (val - 0.33) * 3, 0);
  } else {
    tempColor.setRGB(1, 1, (val - 0.66) * 3);
  }
  targetArray[offset] = tempColor.r * 255;
  targetArray[offset + 1] = tempColor.g * 255;
  targetArray[offset + 2] = tempColor.b * 255;
  targetArray[offset + 3] = 255;
}

// Type for a set of textures
type LayerTextures = [THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture, THREE.Texture];

const ThermalSimulation = ({
  matrixSize,
  focusOffset,
  magicArea,
  onUpdateStats, // New prop to communicate with parent
}: {
  matrixSize: number;
  focusOffset: number;
  magicArea: number;
  onUpdateStats: (stats: Partial<SimStats>) => void;
}) => {
  // Local state only for visuals (textures)
  const [texSink, setTexSink] = useState<LayerTextures | null>(null);
  const [texBase, setTexBase] = useState<LayerTextures | null>(null);
  const [texCPV, setTexCPV] = useState<LayerTextures | null>(null);

  const fwhm = useMemo(() => {
    const ratio = Math.abs(focusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [focusOffset]);

  // 1. Initialize WASM
  useEffect(() => {
    init() 
      .then(() => onUpdateStats({ status: "Ready" }))
      .catch((err) => {
        console.error("Failed to load WASM:", err);
        onUpdateStats({ status: "Error Loading WASM" });
      });
  }, []);

  // 2. Run Simulation
  useEffect(() => {
    // Notify start of loading
    onUpdateStats({ loading: true });

    const timer = setTimeout(() => {
      try {
        const result = run_thermal_simulation(fwhm, magicArea, matrixSize);

        // Send numerical results up to App
        onUpdateStats({
          maxTemp: result.get_t_max(),
          pElectric: result.get_p_elec(),
          loading: false,
        });

        // --- Texture Generation Logic (Same as before) ---
        const nx = result.get_nx();
        const ny = result.get_ny();
        const nz = result.get_nz();
        const tempArray = result.get_t_3d();

        let gMin = Infinity;
        let gMax = -Infinity;
        for (let i = 0; i < tempArray.length; i++) {
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
                    const idx1 = ((ny + j) * fullNx + (nx + i)) * 4;
                    const idx2 = ((ny + j) * fullNx + (nx - 1 - i)) * 4;
                    const idx3 = ((ny - 1 - j) * fullNx + (nx - 1 - i)) * 4;
                    const idx4 = ((ny - 1 - j) * fullNx + (nx + i)) * 4;
                    updateHeatColor(norm, textureData, idx1);
                    updateHeatColor(norm, textureData, idx2);
                    updateHeatColor(norm, textureData, idx3);
                    updateHeatColor(norm, textureData, idx4);
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

        const generateSideTexture = (zStart: number, zEnd: number, isXFace: boolean) => {
            const depth = zEnd - zStart + 1;
            const width = isXFace ? nx * 2 : ny * 2;
            const dataSize = width * depth * 4;
            const textureData = new Uint8Array(dataSize);

            for (let k = 0; k < depth; k++) {
                const zIdx = zStart + k;
                const zOffset = zIdx * nx * ny;
                const quarterDim = isXFace ? nx : ny;
                for (let q = 0; q < quarterDim; q++) {
                    let val;
                    if (isXFace) val = tempArray[zOffset + (ny - 1) * nx + q]; 
                    else val = tempArray[zOffset + q * nx + (nx - 1)]; 
                    
                    const norm = (val - gMin) / range;
                    const idxRight = (k * width + (quarterDim + q)) * 4;
                    const idxLeft  = (k * width + (quarterDim - 1 - q)) * 4;
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
        }

        const buildLayerSet = (zStart: number, zEnd: number): LayerTextures => {
            const texTop = generateXYTexture(zEnd);
            const texBottom = generateXYTexture(zStart);
            const texFrontBack = generateSideTexture(zStart, zEnd, true);
            const texRightLeft = generateSideTexture(zStart, zEnd, false);
            return [texRightLeft, texRightLeft, texTop, texBottom, texFrontBack, texFrontBack];
        };

        setTexSink(buildLayerSet(0, 4));
        setTexBase(buildLayerSet(5, 12));
        setTexCPV(buildLayerSet(13, nz - 1));

        result.free();

      } catch (e) {
        console.error("Simulation failed:", e);
        onUpdateStats({ loading: false, status: "Error" });
      }
    }, 100); 

    return () => clearTimeout(timer);
  }, [fwhm, magicArea, matrixSize]);

  // Render 3D geometry only (No HTML)
  const hasData = texCPV && texBase && texSink;
  
  return (
    <group rotation={[Math.PI / 6, Math.PI / 4, 0]} position={[0, 0, 0]} visible={!!hasData}>
        {texSink && (
            <mesh position={[0, -0.6, 0]}>
            <boxGeometry args={[PLATE_WIDTH, 0.2, PLATE_DEPTH]} />
            {texSink.map((tex, i) => (
                <meshStandardMaterial key={i} attach={`material-${i}`} map={tex} emissiveMap={tex} emissiveIntensity={0.5} roughness={0.4} metalness={0.2} />
            ))}
            </mesh>
        )}
        {texBase && (
            <mesh position={[0, 0, 0]}>
            <boxGeometry args={[PLATE_WIDTH, 0.1, PLATE_DEPTH]} />
            {texBase.map((tex, i) => (
                <meshStandardMaterial key={i} attach={`material-${i}`} map={tex} emissiveMap={tex} emissiveIntensity={0.5} roughness={0.3} metalness={0.5} />
            ))}
            </mesh>
        )}
        {texCPV && (
            <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[PLATE_WIDTH, 0.05, PLATE_DEPTH]} />
            {texCPV.map((tex, i) => (
                <meshStandardMaterial key={i} attach={`material-${i}`} map={tex} emissiveMap={tex} emissiveIntensity={0.8} roughness={0.5} />
            ))}
            </mesh>
        )}
    </group>
  );
};



// ... (DynamicTube, ConnectedTube, DishBackFrame, MountBase, AnimatedRay, RayTracer, MirrorDish, CPVGrid, Structure components remain the same)

const DynamicTube = ({
  start,
  end,
  thickness = 0.2,
  color = "#888",
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  thickness?: number;
  color?: string;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => {
    if (meshRef.current) {
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      const midpoint = new THREE.Vector3()
        .addVectors(start, end)
        .multiplyScalar(0.5);
      meshRef.current.position.copy(midpoint);
      const up = new THREE.Vector3(0, 1, 0);
      meshRef.current.quaternion.setFromUnitVectors(up, direction.normalize());
      meshRef.current.scale.set(1, length, 1);
    }
  }, [start, end]);
  return (
    <mesh ref={meshRef} castShadow>
      <cylinderGeometry args={[thickness, thickness, 1, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const ConnectedTube = ({
  start,
  end,
  thickness = 0.2,
  color = "#888",
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  thickness?: number;
  color?: string;
}) => {
  return (
    <group>
      <mesh position={start} castShadow>
        <sphereGeometry args={[thickness * 1.5, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <DynamicTube
        start={start}
        end={end}
        thickness={thickness}
        color={color}
      />
    </group>
  );
};

const DishBackFrame = () => {
  const numRibs = 12;
  const dishEdgeHeight = (DISH_RADIUS * DISH_RADIUS) / (4 * FOCAL_LENGTH);
  const hubDepth = -2.5;
  const outerRingRadius = DISH_RADIUS * 0.95;
  const outerRingHeight = dishEdgeHeight - 0.3;
  const midRingRadius = DISH_RADIUS * 0.5;
  const midRingHeight =
    (midRingRadius * midRingRadius) / (4 * FOCAL_LENGTH) - 0.8;

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, hubDepth, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.5, 32]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0, outerRingHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[outerRingRadius, 0.25, 16, 32]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh position={[0, midRingHeight, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[midRingRadius, 0.2, 16, 32]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      {Array.from({ length: numRibs }).map((_, i) => {
        const angle = (i / numRibs) * Math.PI * 2;
        const xOuter = Math.cos(angle) * outerRingRadius;
        const zOuter = Math.sin(angle) * outerRingRadius;
        const xMid = Math.cos(angle) * midRingRadius;
        const zMid = Math.sin(angle) * midRingRadius;
        const outerPoint = new THREE.Vector3(xOuter, outerRingHeight, zOuter);
        const midPoint = new THREE.Vector3(xMid, midRingHeight, zMid);
        const centerPoint = new THREE.Vector3(0, hubDepth, 0);
        return (
          <group key={i}>
            <DynamicTube
              start={outerPoint}
              end={midPoint}
              thickness={0.15}
              color="#777"
            />
            <DynamicTube
              start={midPoint}
              end={centerPoint}
              thickness={0.2}
              color="#777"
            />
            <DynamicTube
              start={outerPoint}
              end={centerPoint}
              thickness={0.12}
              color="#666"
            />
          </group>
        );
      })}
    </group>
  );
};

const MountBase = () => {
  return (
    <group position={[0, 0, 0]}>
      <mesh
        position={[0, -2.4, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <torusGeometry args={[8, 0.5, 16, 64]} />
        <meshStandardMaterial color="#444" roughness={0.7} />
      </mesh>
      <mesh position={[0, -2.5, 0]} receiveShadow>
        <cylinderGeometry args={[9, 10, 0.2, 64]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      <group rotation={[0, 0.5, 0]}>
        <mesh position={[8, -2.2, 0]}>
          <boxGeometry args={[1.5, 0.8, 1]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[-8, -2.2, 0]}>
          <boxGeometry args={[1.5, 0.8, 1]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
      <group>
        <mesh position={[-9, 3, 0]} castShadow>
          <boxGeometry args={[1.5, 12, 3]} />
          <meshStandardMaterial color="#666" />
        </mesh>
        <mesh position={[-9, 0, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.5, 8, 0.5]} />
          <meshStandardMaterial color="#444" />
        </mesh>
        <mesh position={[9, 3, 0]} castShadow>
          <boxGeometry args={[1.5, 12, 3]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      </group>
    </group>
  );
};

const AnimatedRay = ({
  start,
  impact,
  endPoint,
}: {
  start: THREE.Vector3;
  impact: THREE.Vector3;
  endPoint: THREE.Vector3;
}) => {
  const lineRef =
    useRef<THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>>(null);
  const currentTipPos = useRef(start.clone());
  const phase = useRef<"incoming" | "reflecting" | "finished">("incoming");
  const distToImpact = start.distanceTo(impact);
  const distToEndpoint = impact.distanceTo(endPoint);

  useLayoutEffect(() => {
    currentTipPos.current.copy(start);
    phase.current = "incoming";
    if (lineRef.current) {
      const positions = lineRef.current.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < 9; i++) positions[i] = start.getComponent(i % 3);
      lineRef.current.geometry.attributes.position.needsUpdate = true;
    }
  }, [start, impact, endPoint]);

  useFrame((state, delta) => {
    if (!lineRef.current || phase.current === "finished") return;
    const geometry = lineRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const moveDistance = RAY_SPEED * delta * 60;

    if (phase.current === "incoming") {
      const direction = impact.clone().sub(start).normalize();
      currentTipPos.current.add(direction.multiplyScalar(moveDistance));
      if (start.distanceTo(currentTipPos.current) >= distToImpact) {
        currentTipPos.current.copy(impact);
        phase.current = "reflecting";
        positions[3] = impact.x;
        positions[4] = impact.y;
        positions[5] = impact.z;
        positions[6] = impact.x;
        positions[7] = impact.y;
        positions[8] = impact.z;
      } else {
        positions[3] = currentTipPos.current.x;
        positions[4] = currentTipPos.current.y;
        positions[5] = currentTipPos.current.z;
        positions[6] = currentTipPos.current.x;
        positions[7] = currentTipPos.current.y;
        positions[8] = currentTipPos.current.z;
      }
    } else if (phase.current === "reflecting") {
      const direction = endPoint.clone().sub(impact).normalize();
      currentTipPos.current.add(direction.multiplyScalar(moveDistance));
      if (impact.distanceTo(currentTipPos.current) >= distToEndpoint) {
        currentTipPos.current.copy(endPoint);
        phase.current = "finished";
      }
      positions[6] = currentTipPos.current.x;
      positions[7] = currentTipPos.current.y;
      positions[8] = currentTipPos.current.z;
    }
    geometry.attributes.position.needsUpdate = true;
  });

  const initialPositions = useMemo(
    () =>
      new Float32Array([
        start.x,
        start.y,
        start.z,
        start.x,
        start.y,
        start.z,
        start.x,
        start.y,
        start.z,
      ]),
    [start]
  );

  return (
    <line ref={lineRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={3}
          array={initialPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#00ffff"
        opacity={0.6}
        transparent
        linewidth={1}
      />
    </line>
  );
};

const RayTracer = ({
  focusOffset,
  matrixSize,
}: {
  focusOffset: number;
  matrixSize: number;
}) => {
  const rays = useMemo(() => {
    const _rays = [];
    const rayCount = 80;
    const plateY = FOCAL_LENGTH + focusOffset;
    const spacing = 0.4;
    const targets: THREE.Vector3[] = [];
    const startOffset = -((matrixSize - 1) * spacing) / 2;

    for (let i = 0; i < matrixSize; i++) {
      for (let j = 0; j < matrixSize; j++) {
        const targetX = startOffset + i * spacing;
        const targetZ = startOffset + j * spacing;
        targets.push(new THREE.Vector3(targetX, FOCAL_LENGTH, targetZ));
      }
    }
    for (let i = 0; i < rayCount; i++) {
      const r = Math.sqrt(Math.random()) * (DISH_RADIUS - 0.5);
      const theta = Math.random() * 2 * Math.PI;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const yImpact = (x * x + z * z) / (4 * FOCAL_LENGTH);
      const start = new THREE.Vector3(x, FOCAL_LENGTH + 25, z);
      const impact = new THREE.Vector3(x, yImpact, z);
      const target = targets[Math.floor(Math.random() * targets.length)];
      const reflectDir = new THREE.Vector3()
        .subVectors(target, impact)
        .normalize();
      if (Math.abs(reflectDir.y) > 0.0001) {
        const t = (plateY - yImpact) / reflectDir.y;
        if (t > 0) {
          const endPoint = new THREE.Vector3()
            .copy(impact)
            .add(reflectDir.multiplyScalar(t));
          _rays.push({ start, impact, endPoint });
        }
      }
    }
    return _rays;
  }, [focusOffset, matrixSize]);

  return (
    <group>
      {rays.map((ray, i) => (
        <AnimatedRay
          key={i}
          start={ray.start}
          impact={ray.impact}
          endPoint={ray.endPoint}
        />
      ))}
    </group>
  );
};

const MirrorDish = ({ focusOffset }: { focusOffset: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const currentTargetPoint = useMemo(
    () => new THREE.Vector3(0, FOCAL_LENGTH + focusOffset, 0),
    [focusOffset]
  );

  const { count, matrices } = useMemo(() => {
    const dummy = new THREE.Object3D();
    const tempMatrices: THREE.Matrix4[] = [];
    const range = Math.ceil(DISH_RADIUS / (MIRROR_SIZE + MIRROR_GAP));
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        const xPos = x * (MIRROR_SIZE + MIRROR_GAP);
        const yPos = y * (MIRROR_SIZE + MIRROR_GAP);
        if (xPos * xPos + yPos * yPos <= DISH_RADIUS * DISH_RADIUS) {
          const zHeight = (xPos * xPos + yPos * yPos) / (4 * FOCAL_LENGTH);
          dummy.position.set(xPos, zHeight, yPos);
          dummy.lookAt(currentTargetPoint);
          dummy.updateMatrix();
          tempMatrices.push(dummy.matrix.clone());
        }
      }
    }
    return { count: tempMatrices.length, matrices: tempMatrices };
  }, [currentTargetPoint]);

  useLayoutEffect(() => {
    if (meshRef.current) {
      matrices.forEach((mat, i) => meshRef.current!.setMatrixAt(i, mat));
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [matrices]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[MIRROR_SIZE, MIRROR_SIZE, 0.05]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.0}
        metalness={1.0}
        envMapIntensity={2.5}
      />
    </instancedMesh>
  );
};

const CPVGrid = ({ matrixSize }: { matrixSize: number }) => {
  const spacing = PLATE_WIDTH / matrixSize;
  const size = spacing * 0.7;
  const startOffset = -((matrixSize - 1) * spacing) / 2;
  const pixels = useMemo(() => {
    const _pixels = [];
    for (let i = 0; i < matrixSize; i++) {
      for (let j = 0; j < matrixSize; j++) {
        _pixels.push(
          <mesh
            key={`${i}-${j}`}
            position={[
              startOffset + i * spacing,
              0.0,
              startOffset + j * spacing,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <boxGeometry args={[size, size, 0.2]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        );
      }
    }
    return _pixels;
  }, [matrixSize, startOffset, spacing, size]);
  return <group>{pixels}</group>;
};

const Structure = ({
  focusOffset,
  matrixSize,
}: {
  focusOffset: number;
  matrixSize: number;
}) => {
  const dishEdgeHeight = (DISH_RADIUS * DISH_RADIUS) / (4 * FOCAL_LENGTH);
  const currentFocusY = FOCAL_LENGTH + focusOffset;
  const dishLeft = new THREE.Vector3(-DISH_RADIUS, dishEdgeHeight, 0);
  const dishRight = new THREE.Vector3(DISH_RADIUS, dishEdgeHeight, 0);
  const plateLeft = new THREE.Vector3(-PLATE_WIDTH / 2, currentFocusY, 0);
  const plateRight = new THREE.Vector3(PLATE_WIDTH / 2, currentFocusY, 0);

  return (
    <group>
      <mesh position={[0, currentFocusY, 0]} castShadow receiveShadow>
        <boxGeometry args={[PLATE_WIDTH, 0.1, PLATE_DEPTH]} />
        <meshStandardMaterial color="#222" roughness={0.7} metalness={0.2} />
      </mesh>
      <group position={[0, currentFocusY, 0]}>
        <CPVGrid matrixSize={matrixSize} />
      </group>
      {Math.abs(focusOffset) > 0.1 && (
        <mesh position={[0, FOCAL_LENGTH, 0]}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="red" transparent opacity={0.6} />
        </mesh>
      )}
      <mesh
        position={[0, dishEdgeHeight, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[DISH_RADIUS, TUBE_THICKNESS, 16, 100]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <ConnectedTube
        start={dishLeft}
        end={plateLeft}
        thickness={TUBE_THICKNESS}
        color="#888"
      />
      <ConnectedTube
        start={dishRight}
        end={plateRight}
        thickness={TUBE_THICKNESS}
        color="#888"
      />
    </group>
  );
};

// --- MAIN SCENE ---

const TelescopeScene = ({
  showRays,
  focusOffset,
  matrixSize,
  magicArea,
  showThermal,
  onUpdateStats, // Pass through
}: {
  showRays: boolean;
  focusOffset: number;
  matrixSize: number;
  magicArea: number;
  showThermal: boolean;
  onUpdateStats: (stats: Partial<SimStats>) => void;
}) => {
  const controlsTarget = useMemo(
    () => (showThermal ? [0, 0, 0] : [0, 10, 0]) as [number, number, number],
    [showThermal]
  );

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={showThermal ? [5, 5, 5] : [30, 20, 30]}
        fov={50}
      />
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={2}
        maxDistance={150}
        target={controlsTarget}
        enablePan={true}
        panSpeed={1.0}
      />

      <ambientLight intensity={1.0} />
      <directionalLight
        position={[100, 200, 50]}
        intensity={4.0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        color="#fffaed"
      />
      <Environment preset="park" />
      <SkySphere />
      <TexturedGround />
      <ContactShadows
        opacity={0.4}
        scale={60}
        blur={2.5}
        far={15}
        resolution={512}
        color="#000000"
      />

      {showThermal ? (
        <ThermalSimulation
          matrixSize={matrixSize}
          focusOffset={focusOffset}
          magicArea={magicArea}
          onUpdateStats={onUpdateStats} // Pass callback
        />
      ) : (
        <>
          <MountBase />
          <group position={[0, 8, 0]} rotation={[Math.PI / 4, 0, 0]}>
            <DishBackFrame />
            <MirrorDish focusOffset={focusOffset} />
            <Structure focusOffset={focusOffset} matrixSize={matrixSize} />
            {showRays && (
              <RayTracer focusOffset={focusOffset} matrixSize={matrixSize} />
            )}
          </group>
        </>
      )}
    </>
  );
};

interface SimStats {
  maxTemp: number;
  pElectric: number;
  status: string;
  loading: boolean;
}

export default function App() {
  const [showRays, setShowRays] = useState(false);
  const [focusOffset, setFocusOffset] = useState(0);
  const [matrixSize, setMatrixSize] = useState(1);
  const [showThermal, setShowThermal] = useState(false);
  const [magicArea, setMagicArea] = useState(75);

  // Lifted state for simulation results
  const [simStats, setSimStats] = useState<SimStats>({
    maxTemp: 25,
    pElectric: 0,
    status: "Initializing...",
    loading: false,
  });

  const fwhm = useMemo(() => {
    const ratio = Math.abs(focusOffset) / 2.5;
    return 0.1 + ratio * 0.5;
  }, [focusOffset]);

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas shadows dpr={[1, 2]}>
        <TelescopeScene
          showRays={showRays}
          focusOffset={focusOffset}
          matrixSize={matrixSize}
          magicArea={magicArea}
          showThermal={showThermal}
          onUpdateStats={(newStats) => setSimStats(prev => ({...prev, ...newStats}))}
        />
      </Canvas>

      {/* UI Overlay - Main Title */}
      <div className="absolute w-full top-0 left-0 px-10 py-2 text-black bg-gray-300 pointer-events-none select-none drop-shadow-lg text-shadow-md">
        <h1 className="text-3xl font-bold tracking-tighter shadow-black">
          Telescopi MAGIC
        </h1>
        <p className="text-sm opacity-90">
          Aissam Khadraoui, Candela García, Filip Denis
        </p>
      </div>

      {/* UI Overlay - Gaussian Plot */}
      {!showThermal && showRays && (
        <GaussianPlot focusOffset={focusOffset} matrixSize={matrixSize} />
      )}

      {/* UI Overlay - Thermal Results (Static Panel) */}
      {showThermal && (
        <div className="absolute top-24 left-8 pointer-events-auto bg-gray-900/90 p-4 rounded-lg border border-cyan-500/50 w-80 text-left shadow-2xl backdrop-blur-sm">
          <h3 className="text-lg font-bold text-cyan-400 mb-2 flex items-center gap-2">
            Resultats Simulació
            {simStats.loading && (
               <span className="flex items-center gap-2 text-xs text-yellow-400 animate-pulse border border-yellow-400/30 px-2 py-0.5 rounded bg-yellow-900/20">
                 <svg className="animate-spin h-3 w-3 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Calculant...
               </span>
            )}
          </h3>
          <div className="space-y-1 text-xs font-mono text-gray-300">
            <div className="flex justify-between">
              <span>Àrea Màgica:</span> <span>{magicArea} m²</span>
            </div>
            <div className="flex justify-between">
              <span>Matriu CPV:</span>
              <span>{matrixSize}x{matrixSize}</span>
            </div>
            <div className="flex justify-between">
              <span>Desplaçament:</span> <span>{focusOffset.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>FWHM Est.:</span> <span>{fwhm.toFixed(3)} m</span>
            </div>

            <div className="h-px bg-white/20 my-3"></div>

            <div className="flex justify-between text-red-400 font-bold text-sm items-center">
              <span>T. Màx:</span>
              <span className={`px-2 py-0.5 rounded border ${simStats.loading ? 'opacity-50' : ''} bg-red-900/30 border-red-500/30`}>
                {simStats.maxTemp.toFixed(1)} °C
              </span>
            </div>
            <div className="flex justify-between text-green-300 font-bold text-sm items-center mt-1">
              <span>Potència Elèc:</span>
              <span className={`px-2 py-0.5 rounded border ${simStats.loading ? 'opacity-50' : ''} bg-green-900/30 border-green-500/30`}>
                {simStats.pElectric.toFixed(2)} W
              </span>
            </div>

            <div className="h-px bg-white/20 my-3"></div>
            <p className="text-[10px] text-gray-500 leading-tight">
              Motor: Rust + nalgebra-sparse + PCG
              <br /> Estat: {simStats.status}
            </p>
          </div>
          <button
            onClick={() => setShowThermal(false)}
            className="mt-4 w-full py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded text-white font-bold text-xs transition-all shadow-lg"
          >
            Tancar
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute left-1/6 top-1/4 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-4 w-fit">
        {!showThermal && (
          <div className="flex flex-col items-center gap-4">
            {/* Focus Adjustment */}
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-1 rounded-full text-white shadow-lg border border-white/20">
              <button
                onClick={() => setFocusOffset((prev) => Math.max(prev - 0.5, FOCUS_OFFSET_MIN))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
              >
                -
              </button>
              <div className="flex flex-col items-center min-w-[100px]">
                <span className="text-xs text-white/70 uppercase tracking-widest font-semibold">
                  Desplaçament
                </span>
                <span className="font-mono text-xl font-bold text-cyan-400">
                  {focusOffset > 0 ? "+" : ""}
                  {focusOffset.toFixed(1)}
                </span>
              </div>
              <button
                onClick={() => setFocusOffset((prev) => Math.min(prev + 0.5, FOCUS_OFFSET_MAX))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
              >
                +
              </button>
            </div>

            {/* Matrix Size Adjustment */}
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-1 rounded-full text-white shadow-lg border border-white/20">
              <button
                onClick={() => setMatrixSize((prev) => Math.max(prev - 1, MATRIX_SIZE_MIN))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
              >
                -
              </button>
              <div className="flex flex-col items-center min-w-[100px]">
                <span className="text-xs text-white/70 uppercase tracking-widest font-semibold">
                  Matriu NxN
                </span>
                <span className="font-mono text-xl font-bold text-yellow-400">
                  {matrixSize}x{matrixSize}
                </span>
              </div>
              <button
                onClick={() => setMatrixSize((prev) => Math.min(prev + 1, MATRIX_SIZE_MAX))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
              >
                +
              </button>
            </div>

            {/* Magic Area Adjustment */}
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-1 rounded-full text-white shadow-lg border border-white/20">
              <button
                onClick={() => setMagicArea((prev) => Math.max(prev - 5, 10))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
              >
                -
              </button>
              <div className="flex flex-col items-center min-w-[100px]">
                <span className="text-xs text-white/70 uppercase tracking-widest font-semibold">
                  Àrea (m²)
                </span>
                <span className="font-mono text-xl font-bold text-green-400">
                  {magicArea}
                </span>
              </div>
              <button
                onClick={() => setMagicArea((prev) => Math.min(prev + 5, 200))}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
              >
                +
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {!showThermal && (
            <button
              onClick={() => setShowRays(!showRays)}
              className={`px-8 py-3 rounded-full font-bold transition-all duration-300 shadow-xl border border-white/20
                    ${
                      showRays
                        ? "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)]"
                        : "bg-black/70 text-white hover:bg-black/90 backdrop-blur-md"
                    }`}
            >
              {showRays ? "Desactivar Traçat" : "Activar Traçat"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
