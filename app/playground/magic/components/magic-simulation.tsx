"use client";

import React, {
  useMemo,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
  Suspense,
  memo,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Instances,
  Instance,
  Sky,
  Stars,
  Sparkles,
  Grid,
  Html, // Added Html for annotations
} from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";

// [Previous Constants remain the same]
const FOCAL_LENGTH = 20;
const DISH_RADIUS = 10;
const MIRROR_SIZE = 0.45;
const MIRROR_GAP = 0.05;
const TUBE_THICKNESS = 0.2;
const RAY_SPEED = 0.8;
const PLATE_WIDTH = 1.5;
const PLATE_DEPTH = 1.5;
const FOCUS_OFFSET_MIN = -1;
const FOCUS_OFFSET_MAX = 0;
const MATRIX_SIZE_MIN = 1;
const MATRIX_SIZE_MAX = 7;

const tubeGeo = new THREE.CylinderGeometry(1, 1, 1, 8);
const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

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



// ------------------------------------------------------------------
// NEW COMPONENT: METRICS PANEL
// ------------------------------------------------------------------
const MetricsPanel = ({
  matrixSize,
  focusOffset,
  magicArea,
}: {
  matrixSize: number;
  focusOffset: number;
  magicArea: number;
}) => {
  const fwhm = Math.sqrt(Math.pow(0.17, 2) + Math.pow(focusOffset, 2));
  const sigma = fwhm / 2.355;
  const pIn = magicArea * 0.9;
  const peakSuns = pIn / (2 * Math.pow(Math.PI, 2) * Math.pow(sigma, 2) * Math.pow(matrixSize, 2));

  const minSigma = 0.17 / 2.355;
  const amplitude = magicArea * 2 * Math.pow(Math.PI, 2) * Math.pow(minSigma, 2) / (2 * Math.pow(Math.PI, 2) * Math.pow(sigma, 2) * Math.pow(matrixSize, 2) * 236);

  console.log({ amplitude})
  const spacing = 0.8;
  const width = 280;
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

  // NEW: Find the exact coordinate of the visual peak
  const peakPoint = useMemo(() => {
    if (points.length === 0) return null;
    // In SVG, 0 is at the top, so the "highest" peak has the lowest Y value
    return points.reduce((min, p) => (p[1] < min[1] ? p : min), points[0]);
  }, [points]);

  const pathData =
    points.length > 0
      ? `M ${points[0][0]} ${points[0][1]} ` +
        points
          .slice(1)
          .map((p) => `L ${p[0]} ${p[1]}`)
          .join(" ")
      : "";

  return (
    <>
      {/* --- RIGHT STATS PANEL --- */}
      <div className="absolute top-28 right-8 w-[320px] pointer-events-auto bg-neutral-900 p-5 rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 hover:border-cyan-500/30">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
            Resultats en Temps Real
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3 text-white">
          <StatItem
            label="Potència Incident"
            value={pIn * 1000 + " kW"}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />
          <StatItem
            label="Pic de Sols"
            value={`${peakSuns.toFixed(1)} Sols`}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />

          <StatItem
            label="FWHM"
            value={fwhm.toFixed(3) + " m"}
            colorBorder="border-white/10"
            colorLabel="text-gray-400"
          />
        </div>

        <div className="text-white transition-all duration-300 hover:border-cyan-500/30 mt-4">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-cyan-400">
              Distribució Incident
            </h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-200/70">
                TALL 1D
              </span>
            </div>
          </div>
          <div className="relative bg-black/60 rounded-lg border border-white/10 overflow-hidden shadow-inner">
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <svg
              width={width}
              height={height}
              className="overflow-visible relative z-10"
            >
              <defs>
                <linearGradient id="plotGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
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
                stroke="#22d3ee"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />

              {/* --- NEW: PEAK LABEL --- */}
              {peakPoint && (
                <g transform={`translate(${peakPoint[0]}, ${peakPoint[1]})`}>
                  
                  {/* The Label Text */}
                  <text
                    y="-12"
                    textAnchor="start"
                    fill="#22d3ee"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    style={{ textShadow: "0px 0px 4px rgba(34,211,238,0.5)" }}
                  >
                    {peakSuns.toFixed(0)} Sols
                  </text>
                </g>
              )}

            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

// ------------------------------------------------------------------
// EXISTING COMPONENTS (With slight tweaks)
// ------------------------------------------------------------------

function SceneReady({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

const SceneEnvironment = ({ isNight }: { isNight: boolean }) => {
  return (
    <>
      <color attach="background" args={[isNight ? "#050a14" : "#b1d9fc"]} />
      {!isNight && (
        <fog
          attach="fog"
          args={[
            isNight ? "#050a14" : "#dbecfb",
            isNight ? 10 : 50,
            isNight ? 60 : 600,
          ]}
        />
      )}
      <group position={[0, -3, 0]}>
        <Grid
          args={[100, 100]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor={isNight ? "#1a2e4a" : "#599905"}
          sectionSize={2.5}
          sectionThickness={1.2}
          sectionColor={isNight ? "#4fa9c9" : "#60a605"}
          fadeDistance={isNight ? 30 : 150}
          fadeStrength={1.5}
          infiniteGrid
        />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.5, 0]}
          receiveShadow
        >
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial
            color={isNight ? "#040810" : "#7fa848"}
            roughness={1}
            metalness={0}
            polygonOffset={true}
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      </group>
      {isNight && (
        <>
          <Stars
            radius={60}
            depth={10}
            count={2000}
            factor={5}
            saturation={0.3}
            fade
            speed={0.5}
          />
          <Sparkles
            count={80}
            scale={15}
            size={3}
            speed={0.3}
            opacity={0.5}
            color="#88ccff"
            noise={0.5}
            position={[0, 10, 0]}
          />
        </>
      )}
      {!isNight && (
        <Sky
          distance={450000}
          sunPosition={[50, 200, 50]}
          inclination={0}
          azimuth={0.25}
          rayleigh={0.1}
          turbidity={10}
          mieCoefficient={0.005}
        />
      )}
    </>
  );
};

const TubeInstance = ({
  start,
  end,
  thickness = 0.2,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  thickness?: number;
}) => {
  const { position, rotation, scale } = useMemo(() => {
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3()
      .addVectors(start, end)
      .multiplyScalar(0.5);
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(
      up,
      direction.normalize()
    );
    return {
      position: midpoint,
      rotation: new THREE.Euler().setFromQuaternion(quat),
      scale: [thickness, length, thickness] as [number, number, number],
    };
  }, [start, end, thickness]);
  return <Instance position={position} rotation={rotation} scale={scale} />;
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

  const points = useMemo(() => {
    const dishLeft = new THREE.Vector3(-DISH_RADIUS, dishEdgeHeight, 0);
    const dishRight = new THREE.Vector3(DISH_RADIUS, dishEdgeHeight, 0);
    const plateLeft = new THREE.Vector3(-PLATE_WIDTH / 2, currentFocusY, 0);
    const plateRight = new THREE.Vector3(PLATE_WIDTH / 2, currentFocusY, 0);
    return { dishLeft, dishRight, plateLeft, plateRight };
  }, [currentFocusY, dishEdgeHeight]);

  return (
    <group>
      {/* Structural Plate */}
      <mesh
        position={[0, currentFocusY, 0]}
        castShadow
        receiveShadow
        geometry={boxGeo}
        scale={[PLATE_WIDTH, 0.1, PLATE_DEPTH]}
      >
        <meshStandardMaterial color="#222" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* Receiver Content */}
      <group position={[0, currentFocusY, 0]}>
        <CPVGrid matrixSize={matrixSize} focusOffset={focusOffset} />
      </group>

      {Math.abs(focusOffset) > 0.1 && (
        <mesh position={[0, FOCAL_LENGTH, 0]} geometry={sphereGeo} scale={0.05}>
          <meshBasicMaterial color="red" transparent opacity={0.6} />
        </mesh>
      )}

      <mesh
        position={[0, dishEdgeHeight, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[DISH_RADIUS, TUBE_THICKNESS, 16, 64]} />
        <meshStandardMaterial color="#888" />
      </mesh>

      <Instances range={2} geometry={tubeGeo} castShadow receiveShadow>
        <meshStandardMaterial color="#888" />
        <TubeInstance
          start={points.dishLeft}
          end={points.plateLeft}
          thickness={TUBE_THICKNESS}
        />
        <TubeInstance
          start={points.dishRight}
          end={points.plateRight}
          thickness={TUBE_THICKNESS}
        />
      </Instances>
    </group>
  );
};

const DishBackFrame = () => {
  const { ribsData, rings } = useMemo(() => {
    const numRibs = 12;
    const dishEdgeHeight = (DISH_RADIUS * DISH_RADIUS) / (4 * FOCAL_LENGTH);
    const hubDepth = -2.5;
    const outerRingRadius = DISH_RADIUS * 0.95;
    const outerRingHeight = dishEdgeHeight - 0.3;
    const midRingRadius = DISH_RADIUS * 0.5;
    const midRingHeight =
      (midRingRadius * midRingRadius) / (4 * FOCAL_LENGTH) - 0.8;
    const ribs = [];
    for (let i = 0; i < numRibs; i++) {
      const angle = (i / numRibs) * Math.PI * 2;
      const xOuter = Math.cos(angle) * outerRingRadius;
      const zOuter = Math.sin(angle) * outerRingRadius;
      const xMid = Math.cos(angle) * midRingRadius;
      const zMid = Math.sin(angle) * midRingRadius;
      ribs.push({
        outerPoint: new THREE.Vector3(xOuter, outerRingHeight, zOuter),
        midPoint: new THREE.Vector3(xMid, midRingHeight, zMid),
        centerPoint: new THREE.Vector3(0, hubDepth, 0),
      });
    }
    return {
      ribsData: ribs,
      rings: { outerRingRadius, outerRingHeight, midRingRadius, midRingHeight },
    };
  }, []);

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -2.5, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.5, 32]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh
        position={[0, rings.outerRingHeight, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[rings.outerRingRadius, 0.25, 16, 32]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh
        position={[0, rings.midRingHeight, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[rings.midRingRadius, 0.2, 16, 32]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <Instances range={ribsData.length * 3} geometry={tubeGeo} castShadow>
        <meshStandardMaterial color="#777" />
        {ribsData.map((rib, i) => (
          <group key={i}>
            <TubeInstance
              start={rib.outerPoint}
              end={rib.midPoint}
              thickness={0.15}
            />
            <TubeInstance
              start={rib.midPoint}
              end={rib.centerPoint}
              thickness={0.2}
            />
            <TubeInstance
              start={rib.outerPoint}
              end={rib.centerPoint}
              thickness={0.12}
            />
          </group>
        ))}
      </Instances>
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
        <mesh position={[8, -2.2, 0]} geometry={boxGeo} scale={[1.5, 0.8, 1]}>
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[-8, -2.2, 0]} geometry={boxGeo} scale={[1.5, 0.8, 1]}>
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
      <group>
        <mesh
          position={[-9, 2.8, 0]}
          castShadow
          geometry={boxGeo}
          scale={[1.5, 10, 3]}
        >
          <meshStandardMaterial color="#666" />
        </mesh>
        <mesh
          position={[9, 2.8, 0]}
          castShadow
          geometry={boxGeo}
          scale={[1.5, 10, 3]}
        >
          <meshStandardMaterial color="#666" />
        </mesh>
        <mesh position={[0, -1, 0]} castShadow>
          <coneGeometry args={[8, 3, 12]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </group>
    </group>
  );
};

// [AnimatedRay and RayTracer components remain the same]
const AnimatedRay = ({
  start,
  impact,
  endPoint,
}: {
  start: THREE.Vector3;
  impact: THREE.Vector3;
  endPoint: THREE.Vector3;
}) => {
  const lineRef = useRef<THREE.Line>(null);
  const currentTipPos = useRef(new THREE.Vector3());
  const phase = useRef<"incoming" | "reflecting" | "finished">("incoming");
  const distToImpact = useMemo(() => start.distanceTo(impact), [start, impact]);
  const distToEndpoint = useMemo(
    () => impact.distanceTo(endPoint),
    [impact, endPoint]
  );

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

  useLayoutEffect(() => {
    currentTipPos.current.copy(start);
    phase.current = "incoming";
    if (lineRef.current && lineRef.current.geometry) {
      const posAttr = lineRef.current.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;
      posAttr.set(initialPositions);
      posAttr.needsUpdate = true;
    }
  }, [start, impact, endPoint, initialPositions]);

  useFrame((state, delta) => {
    if (!lineRef.current || phase.current === "finished") return;
    const geometry = lineRef.current.geometry;
    const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    const moveDistance = RAY_SPEED * delta * 60;

    if (phase.current === "incoming") {
      const direction = impact.clone().sub(start).normalize();
      currentTipPos.current.add(direction.multiplyScalar(moveDistance));
      if (start.distanceTo(currentTipPos.current) >= distToImpact) {
        currentTipPos.current.copy(impact);
        phase.current = "reflecting";
        positions[3] = positions[6] = impact.x;
        positions[4] = positions[7] = impact.y;
        positions[5] = positions[8] = impact.z;
      } else {
        positions[3] = positions[6] = currentTipPos.current.x;
        positions[4] = positions[7] = currentTipPos.current.y;
        positions[5] = positions[8] = currentTipPos.current.z;
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
    posAttr.needsUpdate = true;
  });

  return (
    <primitive
      ref={lineRef as any}
      object={
        new THREE.Line(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial({
            color: "#ff2a6d",
            opacity: 1.0,
            transparent: true,
            linewidth: 2,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        )
      }
      frustumCulled={false}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[initialPositions, 3]}
          count={3}
        />
      </bufferGeometry>
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
    const rayCount = 40;
    const plateY = FOCAL_LENGTH + focusOffset;
    const spacing = PLATE_WIDTH / matrixSize;
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
      const target = targets[i % targets.length];
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

  const { count, initialData } = useMemo(() => {
    const data = [];
    const range = Math.ceil(DISH_RADIUS / (MIRROR_SIZE + MIRROR_GAP));
    for (let x = -range; x <= range; x++) {
      for (let y = -range; y <= range; y++) {
        const xPos = x * (MIRROR_SIZE + MIRROR_GAP);
        const yPos = y * (MIRROR_SIZE + MIRROR_GAP);
        if (xPos * xPos + yPos * yPos <= DISH_RADIUS * DISH_RADIUS) {
          const zHeight = (xPos * xPos + yPos * yPos) / (4 * FOCAL_LENGTH);
          data.push({ position: new THREE.Vector3(xPos, zHeight, yPos) });
        }
      }
    }
    return { count: data.length, initialData: data };
  }, []);

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    initialData.forEach((data, i) => {
      dummy.position.copy(data.position);
      dummy.lookAt(currentTargetPoint);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [currentTargetPoint, initialData]);

  return (
    <group>
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
    </group>
  );
};

// UPDATED CPVGRID: Adds Heatmap Glow
const CPVGrid = ({
  matrixSize,
  focusOffset,
}: {
  matrixSize: number;
  focusOffset: number;
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const spacing = PLATE_WIDTH / matrixSize;
  const size = spacing * 0.7;
  const count = matrixSize * matrixSize;

  // Calculate glow intensity based on focus offset (closer to 0 = brighter)
  const glowIntensity = Math.max(0, 1 - Math.abs(focusOffset) / 2) * 2;

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    const startOffset = -((matrixSize - 1) * spacing) / 2;
    let index = 0;
    for (let i = 0; i < matrixSize; i++) {
      for (let j = 0; j < matrixSize; j++) {
        dummy.position.set(
          startOffset + i * spacing,
          0,
          startOffset + j * spacing
        );
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(index++, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [matrixSize, spacing]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[size, size, 0.2]} />
      <meshStandardMaterial
        color="#6b6eff"
        emissive="#ff2a6d"
        emissiveIntensity={glowIntensity}
        toneMapped={false}
      />
    </instancedMesh>
  );
};


export default function TelescopePage() {
  const [showRays, setShowRays] = useState(false);
  const [focusOffset, setFocusOffset] = useState(0);
  const [matrixSize, setMatrixSize] = useState(1);
  const [magicArea, setMagicArea] = useState(75);

  const [loaded, setLoaded] = useState(false);
  const [introFinished, setIntroFinished] = useState(false);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        setIntroFinished(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  const isNight = !introFinished;

  return (
    <div className="w-full h-screen bg-black relative flex flex-col overflow-hidden rounded-2xl">
      <div
        className={`absolute w-full top-0 left-0 px-8 py-3 z-50 pointer-events-none select-none flex justify-between items-center transition-all duration-1000 ease-out border-b border-white/20 bg-neutral-900 shadow-2xl ${
          introFinished
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 via-purple-200 to-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">
            STARRY SKY
          </h1>
          <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-cyan-400 uppercase tracking-widest ">
            <span className="opacity-80">Aissam Khadraoui</span>
            <span className="text-white/20">•</span>
            <span className="opacity-80">Candela García</span>
            <span className="text-white/20">•</span>
            <span className="opacity-80">Filip Denis</span>
          </div>
        </div>
        <Link
          href="magic/thermal-simulation"
          className={`
        pointer-events-auto group relative overflow-hidden rounded-full bg-cyan-600 px-6 py-2.5 transition-all duration-300 
        hover:bg-cyan-500 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)]
        border border-white/20 shadow-lg
      `}
        >
          <div className="flex items-center gap-2">
            <span className="relative z-10 text-xs font-extrabold uppercase tracking-wider text-white">
              Simulació Tèrmica
            </span>
            <span className="relative z-10 text-white transition-transform duration-300 group-hover:translate-x-1">
              &rarr;
            </span>
          </div>
        </Link>
      </div>

      <div
        className={`absolute inset-0 bg-black/50 z-40 flex items-center justify-center pointer-events-none transition-all duration-1000 ease-in-out ${
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

      <div
        className={`flex-1 relative w-full h-full transition-opacity duration-1000 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      >
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            alpha: false,
            antialias: false,
            powerPreference: "high-performance",
            stencil: false,
          }}
        >
          <color attach="background" args={["#000000"]} />
          <PerspectiveCamera makeDefault position={[30, 20, 30]} fov={50} />
          <OrbitControls
            makeDefault
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={2}
            maxDistance={150}
            target={[0, 10, 0]}
            enablePan={true}
            autoRotate={loaded && !introFinished}
            autoRotateSpeed={0.5}
          />
          <Suspense fallback={null}>
            <SceneReady onReady={() => setLoaded(true)} />
            <ambientLight intensity={isNight ? 0.2 : 0.8} />
            <directionalLight
              position={[100, 200, 50]}
              intensity={isNight ? 0.5 : 2.5}
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0001}
              color={isNight ? "#b0c4de" : "#fffbf0"}
            />
            <Environment
              files={"/hdri/rooitou_park_1k.hdr"}
              background={false}
            />
            <SceneEnvironment isNight={isNight} />
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

        {/* CONTROLS */}
        <div
          className={`absolute top-28 left-8 flex flex-col items-start gap-4 pointer-events-auto transition-all duration-1000 delay-500 ${
            introFinished
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-10"
          }`}
        >
          <ControlRow
            label="Despl. (m)"
            value={
              focusOffset > 0
                ? "+" + focusOffset.toFixed(1)
                : focusOffset.toFixed(1)
            }
            colorClass="text-cyan-400"
            onDec={() =>
              setFocusOffset((p) => Math.max(p - 0.1, FOCUS_OFFSET_MIN))
            }
            onInc={() =>
              setFocusOffset((p) => Math.min(p + 0.1, FOCUS_OFFSET_MAX))
            }
          />

          <ControlRow
            label="Matriu NxN"
            value={`${matrixSize}x${matrixSize}`}
            colorClass="text-yellow-400"
            onDec={() => setMatrixSize((p) => Math.max(p - 1, MATRIX_SIZE_MIN))}
            onInc={() => setMatrixSize((p) => Math.min(p + 1, MATRIX_SIZE_MAX))}
          />

          <ControlRow
            label="Àrea (m²)"
            value={magicArea}
            colorClass="text-green-400"
            onDec={() => setMagicArea((p) => Math.max(p - 5, 10))}
            onInc={() => setMagicArea((p) => Math.min(p + 5, 236))}
          />
          <button
            onClick={() => setShowRays(!showRays)}
            className={`w-full py-3 cursor-pointer rounded-xl font-bold uppercase tracking-wider text-xs transition-all duration-300 shadow-xl border ${
              showRays
                ? "bg-cyan-600 border-cyan-400 text-white shadow-cyan-500/20 hover:bg-cyan-500"
                : "bg-neutral-900 border-white/20 text-gray-300 hover:bg-neutral-800 hover:text-white"
            }`}
          >
            {showRays ? "Desactivar Traçat" : "Activar Traçat"}
          </button>
        </div>

        {/* METRICS & PLOT */}
        {introFinished && showRays && (
          <MetricsPanel
          matrixSize={matrixSize}
          focusOffset={focusOffset}
          magicArea={magicArea}
        />
        )}
      </div>
    </div>
  );
}
