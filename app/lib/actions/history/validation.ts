import { string, uuidv4, z } from "zod";

export const historyAddSchema = z.object({
  type: string("El tipo de recurso es obligatorio").regex(/^(file|folder)$/, "El tipo de recurso es inválido"),
  parentPath: z
    .string("El path a borrar es obligatorio")
    .refine((val) => val.includes("/"), {
      message: "El path es inválido",
    })
    .regex(/^[^\\0]+$/, {
      message: "El path contiene carácteres inválidos",
    }),
  folderName: z.string("El nombre de la carpeta es obligatorio").max(255, "El nombre de la carpeta es demasiado largo"),
  files: z.array(z.instanceof(File), "Archivos subidos inválidos").min(1, "No se han proporcionado archivos, o son vacíos")
});


export const historyDeleteSchema = z.object({
  type: string("El tipo de recurso es obligatorio").regex(/^(file|folder)$/, "El tipo de recurso es inválido"),
  path: z
    .string("El path a borrar es obligatorio")
    .refine((val) => val.includes("/"), {
      message: "El path es inválido",
    }),
});


export type HistoryAddInput = z.infer<typeof historyAddSchema>;
export type HistoryDeleteInput = z.infer<typeof historyDeleteSchema>;
