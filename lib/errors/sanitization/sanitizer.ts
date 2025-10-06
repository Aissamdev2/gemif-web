// utils/sanitizeError.ts
import { InternalError } from "../factories";
import { failure, isSuccess, setError, unwrapMetadata } from "../result";
import { AppError, Failure, PartialAppError, Resource, Result, SanitizedAppError, SanitizedResult } from "../types";


export function sanitizeResult<T, R extends Resource = Resource>(
  result: Result<T,R>
): SanitizedResult<T, R> {
  if (isSuccess(result)) return result
  const { sensitivity } = unwrapMetadata(result)

  if (sensitivity === "log-only") {
    return setError(result, {
      code: "INTERNAL_ERROR",
      message: "Ocurrió un error interno",
      details: "Contacta a un administrador si persiste"
    })
  }

  if (sensitivity === "masked") {
    return setError(result, sanitizeError(result.error))

  }

  // sensitivity === "none"
  return result
}


export function sanitizeError<R extends Resource = Resource>(
  error: AppError<R>
): SanitizedAppError<R> {

    return {
      code: error.code,
      message: error.message,
      details: error.details,
      raw: error.raw,
      resource: undefined,
      parallelErrors: error.parallelErrors?.map((pe) => sanitizeError(pe)),
    } as SanitizedAppError<R>

}




