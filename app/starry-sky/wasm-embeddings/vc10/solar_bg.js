let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const SimulationResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_simulationresult_free(ptr >>> 0, 1));

export class SimulationResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SimulationResult.prototype);
        obj.__wbg_ptr = ptr;
        SimulationResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SimulationResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_simulationresult_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get_t_max() {
        const ret = wasm.simulationresult_get_t_max(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get_p_elec() {
        const ret = wasm.simulationresult_get_p_elec(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {Float64Array}
     */
    get_t_3d() {
        const ret = wasm.simulationresult_get_t_3d(this.__wbg_ptr);
        var v1 = getArrayF64FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 8, 8);
        return v1;
    }
    /**
     * @returns {number}
     */
    get_nx() {
        const ret = wasm.simulationresult_get_nx(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_ny() {
        const ret = wasm.simulationresult_get_ny(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_nz() {
        const ret = wasm.simulationresult_get_nz(this.__wbg_ptr);
        return ret >>> 0;
    }
}
if (Symbol.dispose) SimulationResult.prototype[Symbol.dispose] = SimulationResult.prototype.free;

/**
 * @param {number} fwhm
 * @param {number} magic_area
 * @param {number} n_matrix
 * @returns {SimulationResult}
 */
export function run_thermal_simulation(fwhm, magic_area, n_matrix) {
    const ret = wasm.run_thermal_simulation(fwhm, magic_area, n_matrix);
    return SimulationResult.__wrap(ret);
}

export function __wbg___wbindgen_throw_dd24417ed36fc46e(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
};
