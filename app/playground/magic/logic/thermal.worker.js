// thermal.worker.js
import init, { run_thermal_simulation } from "../wasm-embeddings/vc5/solar.js";

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
    layerThickness,     // Base Thickness
    sinkThickness,      // NEW: Sink Thickness
    plateDim,
    cpvScale,
    nXy,
    nZLayer,
    useCircle,
    // NEW: Material Properties
    baseKt,
    baseEmi,
    sinkKt,
    sinkEmi,
    wasmUrl
  } = data;

  try {
    console.log("Loading WASM from URL:", wasmUrl);
    await init(wasmUrl);

    // Call the Rust function with the new signature
    const result = run_thermal_simulation(
        fwhm,
        magicArea,
        matrixSize,
        layerThickness,
        sinkThickness, // Pass new param
        plateDim,
        cpvScale,
        nXy,
        nZLayer,
        useCircle,
        // Pass Material Props
        baseKt,
        baseEmi,
        sinkKt,
        sinkEmi
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

    const generateXYData = (zIndex) => {
      const fullNx = nx * 2;
      const fullNy = ny * 2;
      const dataSize = fullNx * fullNy * 4;
      const textureData = new Uint8Array(dataSize);
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
      const top = generateXYData(zEnd);
      const bottom = generateXYData(zStart);
      const frontBack = generateSideData(zStart, zEnd, true);
      const rightLeft = generateSideData(zStart, zEnd, false);
      return [rightLeft, rightLeft, top, bottom, frontBack, frontBack];
    };

    // The sink layers are fixed to 0-4 in Rust for simplicity in this version, 
    // but physically they now represent the new sink thickness.
    const sinkData = buildLayerData(0, 4);
    const baseData = buildLayerData(5, 12);
    const cpvData = buildLayerData(13, nz - 1);

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