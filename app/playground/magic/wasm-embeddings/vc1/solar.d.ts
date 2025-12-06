/* tslint:disable */
/* eslint-disable */

export class SimulationResult {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  get_t_max(): number;
  get_p_elec(): number;
  get_t_3d(): Float64Array;
  get_nx(): number;
  get_ny(): number;
  get_nz(): number;
}

export function run_thermal_simulation(fwhm: number, magic_area: number, n_matrix: number): SimulationResult;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_simulationresult_free: (a: number, b: number) => void;
  readonly simulationresult_get_t_max: (a: number) => number;
  readonly simulationresult_get_p_elec: (a: number) => number;
  readonly simulationresult_get_t_3d: (a: number) => [number, number];
  readonly simulationresult_get_nx: (a: number) => number;
  readonly simulationresult_get_ny: (a: number) => number;
  readonly simulationresult_get_nz: (a: number) => number;
  readonly run_thermal_simulation: (a: number, b: number, c: number) => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
