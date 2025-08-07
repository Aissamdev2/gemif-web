import { string, uuidv4, z } from "zod";
import { id } from "zod/v4/locales";

export const mainPostsAddSchema = z.object({
  type: string("El tipo de recurso es obligatorio").regex(/^(file|link)$/, "El tipo de recurso es inválido"),
  name: string("El título es obligatorio").max(255, "El título es demasiado largo"),
  description: string().nullable().optional(),
  subjectId: z
  .string("El id primitivo es obligatorio")
  .length(8, "El id primitivo debe tener exactamente 8 caracteres")
  .regex(/^\d+$/, "El id primitivo debe contener solo números"),
});

export const mainPostsUpdateSchema = z.object({
  id: uuidv4({ message: "No se pudo identificar el recurso" }),
  type: string("El tipo de recurso es obligatorio").regex(/^(file|link)$/, "El tipo de recurso es inválido"),
  name: string("El título es obligatorio").max(255, "El título es demasiado largo"),
  description: string().nullable().optional(),
  subjectId: z
  .string("El id primitivo es obligatorio")
  .length(8, "El id primitivo debe tener exactamente 8 caracteres")
  .regex(/^\d+$/, "El id primitivo debe contener solo números"),
});

export const mainPostsDeleteSchema = z.object({
  id: uuidv4({ message: "No se pudo identificar el recurso" }),
  type: string("El tipo de recurso es obligatorio").regex(/^(file|link)$/, "El tipo de recurso es inválido"),
  path: z.string("El path a borrar es obligatorio").regex(/^([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/, {
  message: "El path a borrar es inválido",
  })
});


export type MainPostUpdateInput = z.infer<typeof mainPostsUpdateSchema>;
export type MainPostAddInput = z.infer<typeof mainPostsAddSchema>;
export type MainPostDeleteInput = z.infer<typeof mainPostsDeleteSchema>;
