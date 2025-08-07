import { z } from "zod";

const nullableString = z
  .string()
  .min(1, { message: "El campo no puede estar vacío." })
  .or(z.literal("").transform(() => null))
  .nullable();

export const primitiveSubjectsUpdateSchema = z
  .object({
    id: z
      .string()
      .regex(/^\d{8}$/, { message: "El ID debe ser una cadena de 8 números." }),

    name: z
      .string({ error: "El nombre debe ser una cadena de texto." })
      .max(255, { message: "El nombre no puede tener más de 255 caracteres." })
      .nullable(),

    credits: z
      .string()
      .transform(Number)
      .refine(n => !isNaN(n), {
        message: "Los créditos deben ser un número.",
      })
      .refine(n => n > 0, {
        message: "Los créditos deben ser un número positivo.",
      })
      .refine(n => n % 0.5 === 0, {
        message: "Los créditos deben ser múltiplos de 0.5.",
      })
      .nullable(),

    year: z
      .string()
      .regex(/^[1-4]$/, {
        message: "El año debe ser un número entre 1 y 4 (inclusive).",
      })
      .nullable(),

    quadri: z
      .string()
      .regex(/^[1-2]$/, {
        message: "El cuatrimestre debe ser 1 o 2.",
      })
      .nullable(),

    professors: z
      .array(z.string().min(1, { message: "El nombre del profesor no puede estar vacío." }))
      .min(1, { message: "Debe haber al menos un profesor." })
      .nullable(),

    emails: z
      .array(z.email({ message: "Debe ser un correo electrónico válido." }))
      .min(1, { message: "Debe haber al menos un correo electrónico." })
      .nullable(),
  })
  .refine(
    (data) =>
      data.name !== null ||
      data.credits !== null ||
      data.year !== null ||
      data.quadri !== null ||
      data.professors !== null ||
      data.emails !== null,
    {
      message: "Al menos uno de los campos (excepto el ID) debe tener un valor.",
      path: ["form"],
    }
  );


export type PrimitiveSubjectsUpdateSchema = z.infer<typeof primitiveSubjectsUpdateSchema>;
