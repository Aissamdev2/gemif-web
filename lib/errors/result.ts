import { AppError, ErrorMetadata, Failure, PartialAppError, PartialSuccess, Resource, Result, SanitizedAppError, SanitizedFailure, SanitizedPartialAppError, SanitizedPartialSuccess, SanitizedResult, Success } from "./types";

// =============================================================================
// CORE CONSTRUCTORS
// =============================================================================

export const success = <T>(data: T, meta?: Record<string, unknown>): Success<T> => ({
  ok: true,
  kind: "success",
  data,
  meta
});

export const partialSuccess = <T, R extends Resource = Resource>(
  data: T, 
  error: PartialAppError<R>, 
  meta?: Record<string, unknown>
): PartialSuccess<T, R> => ({
  ok: true,
  kind: "partial",
  data,
  error,
  meta,
});


export function failure<R extends Resource = Resource>(
  error: AppError<R>,
): Failure<R> {
  return {
    ok: false,
    kind: 'failure',
    error: error
  }
}

export const isSuccess = <T, R extends Resource = Resource>(r: Result<T, R> | SanitizedResult<T,R> ): r is Success<T> => 
  r.ok === true && r.kind === "success";

export const isPartialSuccess = <T, R extends Resource = Resource>(r: Result<T, R>): r is PartialSuccess<T, R> => 
  r.ok === true && r.kind === "partial";

export function isFailure<T, R extends Resource = Resource>(r: Result<T, R> | SanitizedResult<T,R>): r is (Failure<R> | SanitizedFailure<R>) {
  return r.ok === false && r.kind === "failure";
}


export const unwrap = <T, R extends Resource = Resource>(r: Success<T> | PartialSuccess<T, R> | SanitizedPartialSuccess<T,R>): T =>
  r.data;

export const unwrapOr = <T, R extends Resource = Resource>(r: Result<T, R>, fallback: T): T => 
  r.ok ? r.data : fallback;


export const unwrapError = <T, R extends Resource = Resource>(r: PartialSuccess<T, R> | Failure<R>): AppError<R> | PartialAppError<R>  => 
  r.error

export const unwrapMeta = <T, R extends Resource = Resource>(r: Success<T> | PartialSuccess<T, R>): Record<string, unknown> | undefined => 
  r.meta;

export const unwrapMetadata = <T, R extends Resource = Resource>(r: Failure<R> | PartialSuccess<T, R>): ErrorMetadata => 
  r.error.metadata;

export const unwrapResource = <T, R extends Resource = Resource>(r: PartialSuccess<T, R> | Failure<R>): R | undefined => 
  r.error.resource


// Escribe las funciones que modifican meta, metadatos y resource

export const setData = <T, R extends Resource = Resource, NT = T>(r: Success<T> | PartialSuccess<T, R>, data: NT): Success<NT> | PartialSuccess<NT, R> => {
  return { ...r, data }
}


export const appendMeta = <T, R extends Resource = Resource>(r: Success<T> | PartialSuccess<T, R>, meta: Record<string, unknown>): Success<T> | PartialSuccess<T, R> => {
  return { ...r, meta: { ...(r.meta ?? {}), ...meta } }
}

export const appendMetadata = <T, R extends Resource = Resource>(r: Failure<R> | PartialSuccess<T, R>, metadata: Record<string, unknown>): Failure<R> | PartialSuccess<T, R> => {
  return { ...r, error: { ...r.error, metadata: { ...r.error.metadata, ...metadata } } } as Failure<R> | PartialSuccess<T, R>
}


export const setResource = <T, R extends Resource = Resource, NR extends Resource = Resource>(r: Failure<R> | PartialSuccess<T, R>, resource: NR): Failure<NR> | PartialSuccess<T, NR> => {
  return {
    ...r,
    error: {
      ...r.error,
      resource
    }
  } as Failure<NR> | PartialSuccess<T, NR>;
}

export const setError = <T, R extends Resource = Resource, NR extends Resource = Resource>(
  r: Failure<R> | PartialSuccess<T, R>,
  error: AppError<NR> | PartialAppError<NR> | SanitizedAppError<NR> | SanitizedPartialAppError<NR>
): Failure<NR> | PartialSuccess<T, NR> => {
  return {
    ...r,
    error
  } as Failure<NR> | PartialSuccess<T, NR>;
};






// export const partition = <T>(
//   results: readonly Result<T>[]
// ) => {
//   const successes: T[] = [];
//   const failures: AppError[] = [];
//   const partials: { data: T; errors: AppError[] }[] = [];
  
//   for (const result of results) {
//     if (isFailure(result)) {
//       failures.push(result.error);
//     } else if (isPartialSuccess(result)) {
//       partials.push({ data: result.data, errors: result.errors });
//     } else {
//       successes.push(result.data);
//     }
//   }
  
//   return { successes, failures, partials };
// };










