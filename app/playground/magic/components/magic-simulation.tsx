"use client";

import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  Suspense, // Import Suspense
} from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, RepeatWrapping } from "three";
import Link from "next/link";

// --- Constants ---
const DAY_TEXTURE_URL = "/textures/sky2.jpg";
const NIGHT_TEXTURE_URL = "/textures/stars.jpg";
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

// --- UTILITY: Trigger when Suspense finishes ---
// This component only mounts when all assets in the Suspense boundary are loaded.
function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

// ------------------------------------------------------------------
// SECTION 1: SHARED 3D COMPONENTS
// ------------------------------------------------------------------

export function SkySphere({ isNight }: { isNight: boolean }) {
  const textureUrl = isNight ? NIGHT_TEXTURE_URL : DAY_TEXTURE_URL;
  const texture = useLoader(TextureLoader, textureUrl) as THREE.Texture;

  useLayoutEffect(() => {
    if (!texture) return;
    if (isNight) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(6, 6);
    } else {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(1, 1);
    }
    texture.needsUpdate = true;
  }, [texture, isNight]);

  return (
    <mesh scale={[500, 500, 500]}>
      <sphereGeometry args={[1, 64, 64, (3 * Math.PI) / 2]} />
      <meshBasicMaterial
        map={texture}
        color={texture ? "white" : isNight ? "#000000" : "#0f172a"}
        side={THREE.BackSide}
        fog={false}
      />
    </mesh>
  );
}

export function TexturedGround({ isNight }: { isNight: boolean }) {
  const texture = useLoader(TextureLoader, GROUND_TEXTURE_URL) as THREE.Texture;

  useLayoutEffect(() => {
    if (!texture) return;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(15, 15);
    texture.needsUpdate = true;
  }, [texture]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
      <planeGeometry args={[1000, 1000]} />
      <meshStandardMaterial
        map={texture}
        color={isNight ? "#222" : "white"}
        roughness={0.9}
      />
    </mesh>
  );
}

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
      <mesh position={[0, hubDepth, 0]}>
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

// ------------------------------------------------------------------
// SECTION 2: TELESCOPE & RAYS
// ------------------------------------------------------------------

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
    <primitive
      object={
        new THREE.Line(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial()
        )
      }
      ref={lineRef}
      frustumCulled={false}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[initialPositions, 3]}
          count={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#ff0000"
        opacity={0.6}
        transparent
        linewidth={1}
      />
    </primitive>
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
            <meshBasicMaterial color="#6b6eff" />
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
  const amplitude = 1 / matrixSize;
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
        Distribució d&apos;Incidència (Tall 1D)
      </h3>
      <p className="text-xs opacity-70 mb-4 leading-tight">
        Distribució d&apos;energia, matriu {matrixSize}x{matrixSize}.
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

export default function TelescopePage() {
  const [showRays, setShowRays] = useState(false);
  const [focusOffset, setFocusOffset] = useState(0);
  const [matrixSize, setMatrixSize] = useState(1);

  // --- LOADING & INTRO STATE ---
  const [loaded, setLoaded] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  // Trigger the transition timer ONLY after the SceneReady component (inside Suspense) fires
  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        setIntroFinished(true);
      }, 3500); // 3.5 seconds of intro after loading
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  const isNight = !introFinished;

  return (
    // overflow-hidden prevents layout shift from scrollbars
    <div className="w-full h-screen bg-black relative flex flex-col overflow-hidden rounded-2xl">
      {/* Header Overlay */}
      <div
        className={`absolute w-full top-0 left-0 px-10 py-3 text-black bg-gray-300 z-50 pointer-events-none select-none drop-shadow-lg flex justify-between items-center transition-opacity duration-1000 ${
          introFinished ? "opacity-100" : "opacity-0"
        }`}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tighter">
            Telescopi MAGIC
          </h1>
          <p className="text-xs opacity-90">
            Aissam Khadraoui, Candela García, Filip Denis
          </p>
        </div>

        <Link
          href="magic/thermal-simulation"
          className={`
            font-bold text-white uppercase tracking-wider text-sm cursor-pointer pointer-events-auto flex items-center gap-3 px-3 py-1 rounded-full transition-all duration-300 bg-gradient-to-r from-cyan-600 to-blue-600 hover:scale-105 hover:shadow-cyan-500/50 ring-2 ring-white/50`}
        >
          Simulació Tèrmica &rarr;
        </Link>
      </div>

      {/* --- INTRO OVERLAY --- */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center pointer-events-none transition-all duration-1000 ease-in-out ${
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
            Preparant telescopi...
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      {/* Opacity transition prevents 'pop-in' of the scene. It stays black (invisible) until loaded=true */}
      <div
        className={`flex-1 relative w-full h-full transition-opacity duration-1000 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* gl={{ alpha: false }} forces a black canvas background by default, preventing white flash */}
        <Canvas shadows dpr={[1, 2]} gl={{ alpha: false, antialias: true }}>
          {/* Explicitly paint the 3D void black immediately */}
          <color attach="background" args={["#000000"]} />

          <PerspectiveCamera makeDefault position={[30, 20, 30]} fov={50} />
          <OrbitControls
            makeDefault
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={2}
            maxDistance={150}
            target={[0, 10, 0]}
            enablePan={true}
            panSpeed={1.0}
            autoRotate={loaded && !introFinished}
            autoRotateSpeed={0.5}
          />

          {/* SUSPENSE WRAPPER: Nothing inside here mounts until textures are ready */}
          <Suspense fallback={null}>
            {/* The Trigger: This component only mounts when Sky/Ground are ready */}
            <SceneReady onReady={() => setLoaded(true)} />

            {/* --- DYNAMIC LIGHTING --- */}
            <ambientLight intensity={isNight ? 0.2 : 1.0} />
            <directionalLight
              position={[100, 200, 50]}
              intensity={isNight ? 0.5 : 4.0}
              castShadow
              shadow-mapSize={[2048, 2048]}
              color={isNight ? "#b0c4de" : "#fffaed"}
            />
            <Environment
              files={"/hdri/rooitou_park_1k.hdr"}
              background={false}
            />

            <SkySphere isNight={isNight} />
            <TexturedGround isNight={isNight} />

            {/* 3D Scene Content */}
            <MountBase />
            <group position={[0, 8, 0]} rotation={[Math.PI / 4, 0, 0]}>
              <DishBackFrame />
              <MirrorDish focusOffset={focusOffset} />
              <Structure focusOffset={focusOffset} matrixSize={matrixSize} />
              {showRays && (
                <RayTracer focusOffset={focusOffset} matrixSize={matrixSize} />
              )}
            </group>
          </Suspense>
        </Canvas>

        {/* UI Overlays */}
        <div
          className={`absolute top-24 left-8 flex flex-col items-center gap-4 pointer-events-auto transition-all duration-1000 delay-500 ${
            introFinished
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-10"
          }`}
        >
          {/* Focus Control */}
          <div className="flex items-center gap-4 bg-black/60 backdrop-blur-md p-2 rounded-full text-white shadow-lg border border-white/20">
            <button
              onClick={() =>
                setFocusOffset((prev) => Math.max(prev - 0.5, FOCUS_OFFSET_MIN))
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
                {focusOffset > 0 ? "+" : ""}
                {focusOffset.toFixed(1)}
              </span>
            </div>
            <button
              onClick={() =>
                setFocusOffset((prev) => Math.min(prev + 0.5, FOCUS_OFFSET_MAX))
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
                setMatrixSize((prev) => Math.max(prev - 1, MATRIX_SIZE_MIN))
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
                {matrixSize}x{matrixSize}
              </span>
            </div>
            <button
              onClick={() =>
                setMatrixSize((prev) => Math.min(prev + 1, MATRIX_SIZE_MAX))
              }
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/30 transition active:scale-95"
            >
              +
            </button>
          </div>

          {/* Ray Toggle */}
          <button
            onClick={() => setShowRays(!showRays)}
            className={`px-6 py-2 cursor-pointer rounded-full font-bold transition-all duration-300 shadow-xl border border-white/20 text-sm ${
              showRays
                ? "bg-cyan-500 text-black hover:bg-cyan-400"
                : "bg-black/70 text-white hover:bg-black/90"
            }`}
          >
            {showRays ? "Desactivar Traçat" : "Activar Traçat"}
          </button>
        </div>

        {showRays && (
          <GaussianPlot focusOffset={focusOffset} matrixSize={matrixSize} />
        )}
      </div>
    </div>
  );
}
