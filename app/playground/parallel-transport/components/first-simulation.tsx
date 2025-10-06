"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Line, useTexture, Html, useProgress, Loader } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

// WASM import: adjust path if different
// Assuming "../public/pkg/wasm_transport" is correct for your setup
import init, { parallel_transport_latitude } from "../wasm-embeddings/wasm_transport";
import { motion } from "framer-motion";

/* ---------- utils ---------- */
const deg2rad = (d: number) => (d * Math.PI) / 180;
const rad2deg = (r: number) => (r * 180) / Math.PI;
const TWO_PI = Math.PI * 2;



function makeEquatorPoints(n = 128, radius = 1, offset = 0.001) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const lambda = (i / n) * TWO_PI;
    const p = new THREE.Vector3(Math.sin(lambda) * radius, 0, Math.cos(lambda) * radius);
    // offset a tiny bit along normal (normal at equator is (0,0,1)), but for equator just lift along z
    p.z += offset;
    pts.push(p);
  }
  return pts;
}

/** Produce N points for the 0° meridian (lambda = 0), phi from -π/2..π/2. */
function makeMeridianPoints(n = 128, radius = 1, lambdaRad = 0, offset = 0.001) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= n; i++) {
    const frac = i / n;
    const phi = -Math.PI + 2*frac * Math.PI; // -π/2 -> +π/2
    const p = new THREE.Vector3(Math.cos(phi) * Math.sin(lambdaRad) * radius, Math.sin(phi) * radius, Math.cos(phi) * Math.cos(lambdaRad) * radius);
    // push outward a bit along the normal
    const normal = p.clone().normalize();
    p.add(normal.multiplyScalar(offset));
    pts.push(p);
  }
  return pts;
}

/** Equator + 0° meridian lines component */
export function EquatorMeridianLines({
  segments = 256,
  radius = 1,
  lineWidth = 1,
  colorEquator = "#999",
  colorMeridian = "#999",
}: {
  segments?: number;
  radius?: number;
  lineWidth?: number;
  colorEquator?: string;
  colorMeridian?: string;
}) {
  const eq = useMemo(() => makeEquatorPoints(segments, radius, 0.0015), [segments, radius]);
  const mer = useMemo(() => makeMeridianPoints(segments, radius, 0, 0.0015), [segments, radius]);
  return (
    <>
      <Line points={eq} color={colorEquator} lineWidth={lineWidth} />
      <Line points={mer} color={colorMeridian} lineWidth={lineWidth} />
    </>
  );
}

/** Compute a point on the sphere for given latitude (deg) and longitude (deg). */
function spherePointFromLatLon(latDeg: number, lonDeg: number, radius = 1) {
  const phi = deg2rad(latDeg); // latitude
  const lambda = deg2rad(lonDeg); // longitude
  // Swapped components for x/z to match original code's coordinate system based on WASM usage
  return new THREE.Vector3(Math.cos(phi) * Math.sin(lambda) * radius, Math.sin(phi) * radius, Math.cos(phi) * Math.cos(lambda) * radius);
}

/** Start / Stop markers component: two small spheres slightly offset above surface */
export function StartStopMarkers({
  latDeg,
  startLonDeg,
  stopLonDeg,
  markerRadius = 0.035,
  markerOffset = 0.02, // outward offset from sphere surface
}: {
  latDeg: number; // latitude of the path (in degrees)
  startLonDeg: number;
  stopLonDeg: number;
  markerRadius?: number;
  markerOffset?: number;
}) {
  const startPos = useMemo(() => {
    const p = spherePointFromLatLon(latDeg, startLonDeg, 1);
    const normal = p.clone().normalize();
    return p.add(normal.multiplyScalar(markerOffset));
  }, [latDeg, startLonDeg, markerOffset]);

  const stopPos = useMemo(() => {
    const p = spherePointFromLatLon(latDeg, stopLonDeg, 1);
    const normal = p.clone().normalize();
    return p.add(normal.multiplyScalar(markerOffset));
  }, [latDeg, stopLonDeg, markerOffset]);

  return (
    <>
      <mesh position={[startPos.x, startPos.y, startPos.z]}>
        <sphereGeometry args={[markerRadius, 16, 12]} />
        <meshStandardMaterial color="limegreen" emissive="limegreen" emissiveIntensity={0.3} />
      </mesh>

      <mesh position={[stopPos.x, stopPos.y, stopPos.z]}>
        <sphereGeometry args={[markerRadius, 16, 12]} />
        <meshStandardMaterial color="crimson" emissive="crimson" emissiveIntensity={0.3} />
      </mesh>
    </>
  );
}

function Earth() {

  const earthTexture = useTexture("/textures/earth-daymap.jpg");

  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      {/* Sphere geometry (radius, width segments, height segments) */}
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial map={earthTexture} transparent opacity={0.5}  emissive="white" emissiveIntensity={0.7} emissiveMap={earthTexture} />
    </mesh>
  );
}


function Background() {
  const texture = useTexture('/textures/black-hole-sphere.jpg');
  const { scene } = useThree();

  // Configure wrap & offset
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.offset.x = 0.1; // move slightly to the right
  texture.offset.y = 0;   // optional vertical offset

  // Create a large sphere around the scene
  const geo = new THREE.SphereGeometry(10, 32, 32);
  const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
  const mesh = new THREE.Mesh(geo, mat);

  // Rotate the sphere: Euler angles (radians)
  mesh.rotation.y = Math.PI / 2; // rotate 45° around vertical axis
  mesh.rotation.x = 0;           // optional tilt
  mesh.rotation.z = 0;           // optional roll

  scene.add(mesh);

  return null;
}


// Spherical linear interpolation for vectors
function slerpVectors(v1: THREE.Vector3, v2: THREE.Vector3, t: number): THREE.Vector3 {
  // Ensure both vectors are normalized
  const a = v1.clone().normalize();
  const b = v2.clone().normalize();
  
  // Calculate the angle between vectors
  let dot = a.dot(b);
  
  // Clamp dot product to avoid numerical errors
  dot = Math.max(-1, Math.min(1, dot));
  
  // If vectors are very close or opposite, fall back to lerp
  if (Math.abs(dot) > 0.9995) {
    return a.clone().lerp(b, t).normalize();
  }
  
  const theta = Math.acos(dot) * t;
  const relative = b.clone().sub(a.clone().multiplyScalar(dot)).normalize();
  
  return a.clone().multiplyScalar(Math.cos(theta))
    .add(relative.multiplyScalar(Math.sin(theta)));
}


/* ---------- TransportAnimation (smoothing + tangency) ---------- */
function TransportAnimation({
  phi,
  steps,
  lambda0Deg,
  lambda1Deg,
  playing,
  speed,
  progress,
  onSegmentLength,
  loop = false,
  onFinish,
}: {
  phi: number;
  steps: number;
  lambda0Deg: number;
  lambda1Deg: number;
  playing: boolean;
  speed: number;
  progress: number;
  onSegmentLength?: (len: number) => void;
  loop?: boolean;
  onFinish?: () => void;
}) {
  const [fullPts, setFullPts] = useState<THREE.Vector3[] | null>(null);
  const [fullVecs, setFullVecs] = useState<THREE.Vector3[] | null>(null);
  const [segPts, setSegPts] = useState<THREE.Vector3[] | null>(null);
  const [segVecs, setSegVecs] = useState<THREE.Vector3[] | null>(null);

  // single ArrowHelper instance
  const arrow = useMemo(
    () => new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 0.5, 0xff0000),
    []
  );

  // smoothing vectors
  const smoothPos = useRef(new THREE.Vector3());
  const smoothDir = useRef(new THREE.Vector3());
  const finalDir = useRef<THREE.Vector3 | null>(null); // To store the final direction

  // time index and finished flag
  const tRef = useRef(0);
  const finishedRef = useRef(false);

  // load full-circle data from wasm
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await init();
      const res = parallel_transport_latitude(phi, steps);

      // wasm-bindgen might expose getters as functions or properties.
      const rawPts = res.points;
      const rawVecs = res.vectors;

      const pts: THREE.Vector3[] = [];
      const vecs: THREE.Vector3[] = [];

      // steps now includes the wraparound point
      for (let i = 0; i < rawPts.length / 3; i++) {
        // Correcting apparent WASM index mapping to (x, y, z) = (pz, px, py)
        const px = rawPts[3 * i + 1];
        const py = rawPts[3 * i + 2];
        const pz = rawPts[3 * i];
        
        // Correcting apparent WASM index mapping for vectors
        const vx = rawVecs[3 * i + 1];
        const vy = rawVecs[3 * i + 2];
        const vz = rawVecs[3 * i];

        const p = new THREE.Vector3(px, py, pz);
        let v = new THREE.Vector3(vx, vy, vz);

        // project to tangent & normalize (safety)
        const proj = v.clone().sub(p.clone().multiplyScalar(v.dot(p)));
        if (proj.lengthSq() < 1e-12) v.normalize();
        else v = proj.normalize();

        pts.push(p);
        vecs.push(v);
      }

      if (!cancelled) {
        setFullPts(pts);
        setFullVecs(vecs);
        setSegPts(null);
        setSegVecs(null);
        tRef.current = 0;
        finishedRef.current = false;
        finalDir.current = null; // Reset final direction
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phi, steps]);

  /* segment-building: supports multi-turns and applies holonomy */
  useEffect(() => {
    if (!fullPts || !fullVecs) return;
    const n = fullPts.length - 1; // Don't count the duplicate wraparound point
    if (n === 0) return;

    const angleStart = deg2rad(lambda0Deg);
    const angleEnd = deg2rad(lambda1Deg);
    const totalAngle = angleEnd - angleStart;
    const absAngle = Math.abs(totalAngle);
    const samples = Math.max(2, Math.round((absAngle / TWO_PI) * n));

    const pts: THREE.Vector3[] = [];
    const vecs: THREE.Vector3[] = [];
    const wrapIdx = (i: number) => ((i % n) + n) % n;

    for (let k = 0; k <= samples; k++) {
      const frac = k / samples;
      const angle = angleStart + frac * totalAngle;
      const laps = Math.trunc(angle / TWO_PI);
      const angleMod = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
      const floatIdx = (angleMod / TWO_PI) * n;
      const base = Math.floor(floatIdx);
      const alpha = floatIdx - base;

      const i0 = wrapIdx(base);
      const i1 = wrapIdx(base + 1);

      const p = fullPts[i0].clone().lerp(fullPts[i1], alpha);
      let v = slerpVectors(fullVecs[i0], fullVecs[i1], alpha);

      // accumulate holonomy per completed lap (use phi)
      if (laps !== 0) {
        const extraRotation = -laps * TWO_PI * Math.sin(phi);
        v.applyAxisAngle(p.clone().normalize(), extraRotation);
      }

      // ensure tangency
      const proj = v.clone().sub(p.clone().multiplyScalar(v.dot(p)));
      v = proj.lengthSq() < 1e-12 ? v.normalize() : proj.normalize();

      pts.push(p);
      vecs.push(v);
    }

    setSegPts(pts);
    setSegVecs(vecs);
    if (pts.length > 0 && vecs.length > 0) {
      smoothPos.current.copy(pts[0]);
      smoothDir.current.copy(vecs[0]);
    }
    
    // Set initial position based on progress
    const maxIndex = Math.max(1, pts.length - 1);
    tRef.current = Math.max(0, Math.min(maxIndex, progress * maxIndex));
    finishedRef.current = false;
    finalDir.current = null; // Reset final direction
    onSegmentLength?.(pts.length);
  }, [fullPts, fullVecs, lambda0Deg, lambda1Deg, progress, onSegmentLength, phi]);

  // synchronize external progress scrub
  useEffect(() => {
    if (!segPts || !segVecs) return;
    const maxIndex = Math.max(1, segPts.length - 1);
    tRef.current = Math.max(0, Math.min(maxIndex, progress * maxIndex));
    const idx = Math.floor(tRef.current);
    
    if (segPts[idx] && segVecs?.[idx]) {
      smoothPos.current.copy(segPts[idx]);
      smoothDir.current.copy(segVecs[idx]);
    }
    
    // If progress is scrubbed to end, update finalDir and finished flag
    if (progress === 1 && segVecs.length > 0) {
        finalDir.current = segVecs[segVecs.length - 1].clone().normalize();
        finishedRef.current = true;
    } else {
        finishedRef.current = false;
        finalDir.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // animation loop: advance, smooth position, smooth direction (then project), apply to arrow
  useFrame((_, delta) => {
    if (!segPts || !segVecs || !arrow) return;
    const len = segPts.length;
    if (len === 0) return;
    const maxIndex = Math.max(0, len - 1);

    if (playing && !finishedRef.current) {
      tRef.current = tRef.current + speed * delta * 60;

      if (loop) {
        tRef.current = ((tRef.current % len) + len) % len;
      } else {
        if (tRef.current >= maxIndex) {
          tRef.current = maxIndex;
          finishedRef.current = true;
          // Set the final vector when finished
          finalDir.current = segVecs[maxIndex].clone().normalize(); 
          if (onFinish) onFinish();
        }
      }
    }
    
    let posTarget: THREE.Vector3;
    let dirTarget: THREE.Vector3;
    
    if (finishedRef.current && finalDir.current) {
        // Animation finished: use the final position and direction
        posTarget = segPts[maxIndex];
        dirTarget = finalDir.current;
    } else {
        // Animation running or paused before finish: use current interpolated index
        const idx = Math.floor(tRef.current);
        const frac = tRef.current - idx;
        const nextIdx = Math.min(idx + 1, maxIndex);
        
        posTarget = segPts[idx].clone().lerp(segPts[nextIdx], frac);
        dirTarget = slerpVectors(segVecs[idx], segVecs[nextIdx], frac);
    }

    const smoothFactor = Math.min(1, 40 * delta);

    // position
    smoothPos.current.lerp(posTarget, smoothFactor);

    // direction: lerp then project onto tangent at smooth position
    // Use target direction only if not finished, otherwise smoothly approach finalDir.current
    if (!finishedRef.current) {
        smoothDir.current.copy(slerpVectors(smoothDir.current, dirTarget, smoothFactor));
    } else if (finalDir.current) {
        // If finished, smoothly approach the final direction only if it hasn't settled
        smoothDir.current.lerp(finalDir.current, smoothFactor);
    }
    
    // Ensure tangency to sphere surface
    const normal = smoothPos.current.clone().normalize();
    const proj = smoothDir.current.clone().sub(normal.clone().multiplyScalar(smoothDir.current.dot(normal)));
    if (proj.lengthSq() < 1e-12) {
      // If projection failed (e.g., dir is parallel to normal), use the last valid direction or default
      smoothDir.current.normalize();
    } else {
      smoothDir.current.copy(proj.normalize());
    }

    const posOut = smoothPos.current.clone();
    posOut.add(smoothDir.current.clone().multiplyScalar(0.001));
    arrow.position.copy(posOut);
    arrow.setDirection(smoothDir.current);
    arrow.setLength(0.25, 0.08, 0.05);
  });

  if (!segPts || !segVecs) return null;

  return (
    <>
      <Line points={segPts} color="orange" lineWidth={2} />
      <primitive object={arrow} />
    </>
  );
}

function CustomLoader() {

  return (
    <Html center>
      <Loader
        containerStyles={{
          backgroundColor: "rgba(255,255,255,0.9)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        innerStyles={{
          width: "200px",
          height: "15px",
          borderRadius: "5px",
          background: "rgba(255,255,255,0.8)",
        }}
        barStyles={{
          height: "100%",
          borderRadius: "5px",
          background: "linear-gradient(90deg, #000000, #333333)",
        }}
        dataStyles={{
          color: "white",
          fontSize: "1rem",
          marginTop: "20px",
          fontWeight: "bold",
          textAlign: "center",
        }}
        dataInterpolation={(p) => `Cargando simulación: ${p.toFixed(0)} %`}
      />
    </Html>
  );
}


// Define possible states for the transport simulation
type TransportState = 'Idle' | 'Playing' | 'Recomputing';

/* ---------- Page component ---------- */
export default function ParallelTransportSimulation() {
  // UI state
  const [phiDeg, setPhiDeg] = useState(48.51); // degrees
  const [steps, setSteps] = useState(500);
  const [lambda0Deg, setLambda0Deg] = useState(0);
  const [lambda1Deg, setLambda1Deg] = useState(320);
  const [speed, setSpeed] = useState(1.0);
  const [progress, setProgress] = useState(0);
  const [segmentLen, setSegmentLen] = useState<number | null>(null);
  const [loop, setLoop] = useState(false);
  const [wasmReturnDeltaDeg, setWasmReturnDeltaDeg] = useState<number | null>(null);
  const [runKey, setRunKey] = useState(0);
  
  // Combined state for Play/Run/Recompute
  const [transportState, setTransportState] = useState<TransportState>('Playing'); // Start in playing mode

  const phiRad = deg2rad(phiDeg);

  // Called by child to update segment length
  const handleSegmentLength = (len: number) => setSegmentLen(len);

  // Force recompute and start playing
  const handleRun = () => {
    setRunKey((k) => k + 1);
    setProgress(0);
    setTransportState('Playing');
  };
  
  // Monitor control changes to prompt recompute
  useEffect(() => {
      // If the current state is not 'Recomputing', and we are not in the first run (key > 0)
      // Any change in controls (latitude, steps, longitudes) triggers 'Recomputing'
      if (transportState !== 'Recomputing' && runKey > 0) {
          setTransportState('Recomputing');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phiDeg, steps, lambda0Deg, lambda1Deg]); // Depend on control inputs

  // When the WASM module has return_delta we will set it in this effect by calling wasm.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await init();
      // Use the 'Run' parameters for the WASM calculation
      const res = parallel_transport_latitude(phiRad, Math.max(64, steps));
      // getter may be function or property:
      const deltaRad = res.return_delta
      if (!cancelled) setWasmReturnDeltaDeg(deltaRad && deltaRad > 0 ? rad2deg(deltaRad) : 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [phiRad, steps, runKey]); // Re-run WASM when parameters change OR 'Run' is clicked

  // Scrub handlers
  const handleScrubStart = () => setTransportState('Idle'); // Pause when scrubbing starts
  const handleScrubChange = (v: number) => setProgress(v);
  const handleScrubEnd = () => {
      // After scrubbing, stay 'Idle' unless it was scrubbed to the very end (then it's finished/idle)
      if (progress !== 1) setTransportState('Idle'); 
  };


  // Run until orientation returns using WASM-provided delta
  const handleRunUntilReturn = () => {
    if (wasmReturnDeltaDeg === null || transportState === 'Recomputing') {
      alert("El ángulo de retorno aún no está disponible o la simulación se está recalculando.");
      return;
    }
    if (wasmReturnDeltaDeg === 0) {
      alert("La orientación no regresa a su valor original en el ecuador.");
      return;
    }
    // set endpoint lambda1 = lambda0 + deltaDeg (deltaDeg may be > 360)
    const newLambda1 = lambda0Deg + wasmReturnDeltaDeg;
    setLambda1Deg(newLambda1); // This will trigger the recompute logic via useEffect
    setTransportState('Playing'); // Will be set back to 'Recomputing' by the useEffect, then 'Playing' by handleRun
    alert(`Ejecutando hasta que la orientación regrese: nuevo ángulo final ${newLambda1.toFixed(4)}°`);
  };

  // onFinish handler for child
  const handleFinish = () => {
    // if (!loop) setTransportState('Idle');
  };
  
  // Combined Play/Run button handler
  const handlePlayRunButton = () => {
      if (transportState === 'Playing') {
          setTransportState('Idle'); // Pause
      } else if (transportState === 'Idle') {
          setTransportState('Playing'); // Play
      } else if (transportState === 'Recomputing') {
          handleRun(); // Recompute and Play
      }
  }
  
  // Determine button text and color
  const buttonText = transportState === 'Playing' ? 'Parar' : transportState === 'Idle' ? 'Iniciar' : 'Reiniciar';
  const buttonColor = transportState === 'Playing' ? "#d9534f" : transportState === 'Idle' ? "#5cb85c" : "#337ab7";


  return (
    <div className="flex flex-col-reverse lg:flex-row w-full min-h-full lg:h-full max-w-screen items-stretch gap-3 bg-border border-8 border-border rounded p-4 sm:p-0">
      
      {/* Visualization */}
      <div className="w-full flex-1 min-h-[500px] sm:h-[400px] panel overflow-hidden bg-border sm:bg-black">
        <Canvas
          camera={{ position: [0, 1, 3], fov: 45, up: [0, 1, 0]}}
          className="w-full h-full"
          style={{ height: "100%" }}
        >
          <Suspense fallback={<CustomLoader />}>
            <Background />
            <ambientLight intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <OrbitControls target={[0, 0, 0]} />
            <Earth />
            <EquatorMeridianLines segments={256} radius={1} />
            <StartStopMarkers
              latDeg={phiDeg}
              startLonDeg={lambda0Deg}
              stopLonDeg={lambda1Deg}
            />
            <TransportAnimation
              key={runKey}
              phi={phiRad}
              steps={steps}
              lambda0Deg={lambda0Deg}
              lambda1Deg={lambda1Deg}
              playing={transportState === "Playing"}
              speed={speed}
              progress={progress}
              onSegmentLength={handleSegmentLength}
              loop={loop}
              onFinish={handleFinish}
            />
          </Suspense>
        </Canvas>
      </div>


      {/* Controls */}
      <aside className="w-full sm:w-full flex-1 min-w-0 p-4 panel space-y-4">
        <h2 className="heading-lg mb-2">Panel de control de la simulación</h2>

        {/* Latitude */}
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Latitud φ (º)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={-85}
                  max={85}
                  step={0.01}
                  value={phiDeg}
                  onChange={(e) => setPhiDeg(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <input
                  type="number"
                  min={-85}
                  max={85}
                  step={0.01}
                  value={phiDeg}
                  onChange={(e) => setPhiDeg(Number(e.target.value))}
                  className="input input-md w-[70px]"
                />
              </div>
              <div className="flex justify-between text-muted mt-1">
                <small>-85°</small>
                <span className="font-semibold">{phiDeg.toFixed(4)}°</span>
                <small>+85°</small>
              </div>
            </div>

            {/* Steps */}
            <div>
              <label className="label">Pasos de la simulación</label>
              <input
                type="number"
                min={50}
                max={5000}
                step={50}
                value={steps}
                onChange={(e) => setSteps(Math.max(50, Number(e.target.value)))}
                className="input input-md w-full"
              />
            </div>

            {/* Longitudes */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label">Longitud (ángulo) de inicio</label>
                <input
                  type="number"
                  value={lambda0Deg}
                  onChange={(e) => setLambda0Deg(Number(e.target.value))}
                  className="input input-md w-full"
                />
              </div>
              <div className="flex-1">
                <label className="label">Longitud (ángulo) de final</label>
                <input
                  type="number"
                  value={lambda1Deg}
                  onChange={(e) => setLambda1Deg(Number(e.target.value))}
                  className="input input-md w-full"
                />
              </div>
            </div>

            {/* Play / Run buttons */}
              <div>
                <button
                  onClick={handlePlayRunButton}
                  className="btn btn-lg btn-primary w-full"
                  style={{ backgroundColor: buttonColor }}
                >
                  {buttonText}
                </button>
              </div>

              <div>
                <button
                  onClick={handleRunUntilReturn}
                  disabled={wasmReturnDeltaDeg === null || transportState === "Recomputing"}
                  className={`btn btn-lg w-full ${
                    wasmReturnDeltaDeg === null || transportState === "Recomputing"
                      ? "disabled"
                      : "btn-secondary"
                  }`}
                >
                  Girar hasta que la orientación regrese
                </button>

              </div>

              {/* Loop */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                />
                <span className="text-body">Ejecutar en bucle</span>
              </label>
            </div>
          
          <div className="flex flex-col gap-4">
            {/* Speed */}
            <div>
              <label className="label">Velocidad</label>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-muted">
                <small>0.1x</small>
                <span className="font-semibold">{speed.toFixed(1)}x</span>
                <small>5x</small>
              </div>
            </div>

            {/* Progress */}
            <div>
              <label className="label">Modificar progreso manualmente</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.001}
                value={progress}
                onMouseDown={handleScrubStart}
                onTouchStart={handleScrubStart}
                onChange={(e) => handleScrubChange(Number(e.target.value))}
                onMouseUp={handleScrubEnd}
                onTouchEnd={handleScrubEnd}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-muted">
                <small>inicio</small>
                <span className="font-semibold">
                  {segmentLen
                    ? `Progreso ${(progress * 100).toFixed(2)}%`
                    : "—"}
                </span>
                <small>final</small>
              </div>
          </div>
          </div>
        </div>
        

        {/* Return angle */}
        <div className="text-body flex flex-col">
            <p className="text-body">Angulo de regreso:{" "}
              <span className="text-muted">
                {wasmReturnDeltaDeg === null
                  ? "calculando..."
                  : `${wasmReturnDeltaDeg.toFixed(6)}°`}
              </span>
            </p>
          <p className="text-body">Tiempo de regreso:{" "} 
              <span className="text-muted">
                {wasmReturnDeltaDeg === null
                  ? "calculando..."
                  : `${(wasmReturnDeltaDeg * 24 / 360).toFixed(6)}h`}
              </span>
            </p>
        </div>
      </aside>
    </div>

  );
}