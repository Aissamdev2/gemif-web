// thermal.worker.js
import init, { run_thermal_simulation } from "../wasm-embeddings/vc15/solar.js";

const tempColor = { r: 0, g: 0, b: 0 };

function setTempColorRGB(r, g, b) {
  tempColor.r = r;
  tempColor.g = g;
  tempColor.b = b;
}

function updateHeatColor(t, targetArray, offset) {
  const val = Math.min(Math.max(t, 0), 1);
  if (val < 0.5) {
    const intensity = val * 2;
    setTempColorRGB(intensity, 0, 0);
  } else {
    const intensity = (val - 0.5) * 2;
    setTempColorRGB(1, intensity, intensity);
  }
  targetArray[offset] = tempColor.r * 255;
  targetArray[offset + 1] = tempColor.g * 255;
  targetArray[offset + 2] = tempColor.b * 255;
  targetArray[offset + 3] = 255;
}

self.onmessage = async ({ data }) => {
  const {
    fwhm,
    magicArea,
    matrixSize,
    layerThickness,
    sinkThickness,
    pvThickness,
    plateDim,
    cpvScale,
    nXy,
    nZLayer,
    nZSink,
    useCircle,
    usePv,
    useSolarCell,
    // Material Properties
    baseKt,
    baseEmi,
    sinkKt,
    sinkEmi,
    // Logic Toggles
    useFins,
    useReflector,
    // NEW: Environment Parameters
    windSpeed,
    ambientTemp,
    qSolar,
    // NEW: Customizable Fins & Efficiency
    finHeight,
    finSpacing,
    finThickness,
    finEfficiencyParam,
    opticalEfficiency,
    pvEfficiencyParam,
    
    wasmUrl
  } = data;

  try {
    await init(wasmUrl);

    // Call the Rust function with the new signature
    // IMPORTANT: Ensure this order matches the Rust function signature exactly
    const result = run_thermal_simulation(
        fwhm,
        magicArea,
        matrixSize,
        layerThickness,
        sinkThickness,
        pvThickness,
        plateDim,
        cpvScale,
        nXy,
        nZLayer,
        nZSink,
        useCircle,
        usePv,
        useSolarCell,
        baseKt,
        baseEmi,
        sinkKt,
        sinkEmi,
        useFins,
        useReflector,
        // NEW: Pass Environment Parameters
        windSpeed,
        ambientTemp,
        qSolar,
        // NEW: Pass Customizable Fins & Efficiency
        finHeight,
        finSpacing,
        finThickness,
        finEfficiencyParam,
        opticalEfficiency,
        pvEfficiencyParam
    );

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

    const stats = {
      maxTemp: result.get_t_max(),
      pElectric: result.get_p_elec(),
      minGlobal: gMin,
      maxGlobal: gMax,
    };

    const range = Math.max(gMax - gMin, 0.1);

    // --- UPDATED TEXTURE GENERATION ---

    const generateXYData = (zIndex) => {
      const fullNx = nx * 2;
      const fullNy = ny * 2;
      const dataSize = fullNx * fullNy * 4;
      const textureData = new Uint8Array(dataSize);
      
      // Safety Check: Return empty transparent texture if index is out of bounds
      if (zIndex < 0 || zIndex >= nz) {
        return { data: textureData, width: fullNx, height: fullNy };
      }

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
      return { data: textureData, width: fullNx, height: fullNy };
    };

    const generateSideData = (zStart, zEnd, isXFace) => {
      // Safety Check: Return 1x1 dummy if range is invalid
      if (zStart > zEnd || zStart < 0 || zEnd >= nz) {
        return { data: new Uint8Array(4), width: 1, height: 1 };
      }

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
      return { data: textureData, width, height: depth };
    };

    const buildLayerData = (zStart, zEnd) => {
      // If range is invalid (e.g. no sink), generate dummy textures
      if (zEnd < zStart) {
        const dummy = { data: new Uint8Array(4), width: 1, height: 1 };
        return [dummy, dummy, dummy, dummy, dummy, dummy];
      }
      
      const top = generateXYData(zEnd);
      const bottom = generateXYData(zStart);
      const frontBack = generateSideData(zStart, zEnd, true);
      const rightLeft = generateSideData(zStart, zEnd, false);
      return [rightLeft, rightLeft, top, bottom, frontBack, frontBack];
    };

    // --- Dynamic Layer Calculation ---
    // The Rust code always adds 5 'skin' layers at the top for the CPV/interface
    const skinLayers = 5;
    
    // Calculate boundaries
    let sinkStart = 0;
    let sinkEnd = -1; // Default to invalid
    let baseStart = 0;

    // Use the passed nZSink parameter for logic consistency
    // Note: Rust code ensures at least 2 points if sinkThickness > 0
    // So the sink layer count in the array will be approx nZSink (or 2)
    
    if (sinkThickness > 1e-6) {
        sinkStart = 0;
        // The number of Z points allocated to sink is roughly nZSink
        // We use the param to estimate the slice index
        // (In strict mode, we might want to return the exact layer indices from Rust, 
        //  but for now we assume nZSink corresponds to the allocated points)
        const actualSinkLayers = nZSink < 2 ? 2 : nZSink; 
        sinkEnd = actualSinkLayers - 1; 
        baseStart = actualSinkLayers;
    } else {
        // No sink layers generated (only 1 point at 0.0 usually)
        sinkStart = 0;
        sinkEnd = -1; 
        baseStart = 0; 
        // If sinkThickness is 0, Rust might put 1 dummy point or start base at 0.
        // Adjust logic if needed based on exact Rust grid construction.
    }

    // Rust logic: if sink_thickness > 1e-9, it adds 5 sink layers (indices 0-4)
    if (sinkThickness > 1e-6) {
        sinkStart = 0;
        sinkEnd = 4;
        baseStart = 5;
    } else {
        // No sink layers generated
        sinkStart = 0;
        sinkEnd = -1; // Triggers dummy generation
        baseStart = 0;
    }

    const cpvStart = nz - skinLayers; // Top 5 layers are CPV
    const cpvEnd = nz - 1;
    const baseEnd = cpvStart - 1;     // Base fills space between Sink and CPV

    const sinkData = buildLayerData(sinkStart, sinkEnd);
    const baseData = buildLayerData(baseStart, baseEnd);
    const cpvData = buildLayerData(cpvStart, cpvEnd);

    result.free();

    const allBuffers = [
      ...sinkData.map(d => d.data.buffer),
      ...baseData.map(d => d.data.buffer),
      ...cpvData.map(d => d.data.buffer)
    ];

    const uniqueTransferables = [...new Set(allBuffers)];

    self.postMessage({
      status: "success",
      stats,
      sinkData,
      baseData,
      cpvData
    }, uniqueTransferables);

  } catch (e) {
    self.postMessage({ status: "error", error: e.toString() });
  }
};