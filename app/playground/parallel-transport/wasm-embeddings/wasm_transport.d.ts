/* tslint:disable */
/* eslint-disable */
export function parallel_transport_latitude(phi: number, steps: number): TransportResult;
export class TransportResult {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  readonly points: Float64Array;
  readonly vectors: Float64Array;
  /**
   * Smallest positive Δλ (radians) after which the transported vector's orientation
   * equals the initial orientation again. Returns 0.0 if sin(phi) is (almost) zero.
   */
  readonly return_delta: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_transportresult_free: (a: number, b: number) => void;
  readonly transportresult_points: (a: number) => [number, number];
  readonly transportresult_vectors: (a: number) => [number, number];
  readonly transportresult_return_delta: (a: number) => number;
  readonly parallel_transport_latitude: (a: number, b: number) => number;
  readonly __wbindgen_export_0: WebAssembly.Table;
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
