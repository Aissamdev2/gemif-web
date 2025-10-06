import { ActionReturn } from "@/app/lib/definitions";
import { ZodObject } from "zod";
import { Result } from "./errors/types";
import { failure, success } from "./errors/result";
import { makeSessionResource, makeZodResource, ValidationError } from "./errors/factories";
import { ErrorTag } from "./errors/codes";

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export function parseWithSchema<T>({ payload, schema, errorPaths }: {
  payload: Record<string, FormDataEntryValue | FormDataEntryValue[]>,
  schema:  ZodObject<any>,
  errorPaths: Record<string, string>
}): Result<T> {

  const parsed = schema.safeParse(payload);

  if (parsed.success) {
    return success(parsed.data as T);
  }

  const errors = parsed.error.issues.map((e) => ValidationError({
    message: "Entrada inválida",
    details: e.message,
    metadata: {
      scope: errorPaths[e.path[0].toString()],
      operation: "Zod validation",
      sensitivity: "none",
      tags: [ErrorTag.zod, ErrorTag.parse],
      isExpected: true,
    },
    resource: makeZodResource({ path: errorPaths[e.path[0].toString()] })
  }))

  
  return failure(ValidationError({
    message: "Error de formato",
    details: "Error en el formato de entradas recibido",
    metadata: {
      scope: "Add main post",
      operation: "Zod validation",
      sensitivity: "none",
      tags: [ErrorTag.zod, ErrorTag.parse],
      isExpected: true,
    },
    parallelErrors: errors
  }))

}
