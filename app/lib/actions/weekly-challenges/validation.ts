import { z } from "zod";

export const weeklyChallengesAddSchema = z.object({
  title: z.string("El título es obligatorio"),
  description: z.string("La descripción del desafío es obligatoria"),
  isMultipleChoice: z.boolean("La pregunta debe ser de una sola respuesta o de varias"),
  options: z.union([
    z.array(z.string("Las opciones son obligatorias")).min(2, "Las opciones son obligatorias y deben ser de 2 o más"),
    z.array(z.literal('')).length(1, "Opciones inválidas"),
  ], "Debe ser de 2 o más"),
  correctAnswers: z
  .union([
    z.string("La respuesta es obligatoria").min(1, "La respuesta es obligatoria"),
    z.array(z.string("Las respuestas son obligatorias").min(1, "Las respuestas son obligatorias"), "Respuestas inválidas").min(1, "Al menos una respuesta es obligatoria"),
  ], "Al menos una es obligatoria")
  .transform((val) => (typeof val === "string" ? [val] : val)),
  difficulty: z.coerce
    .number()
    .min(0, { message: "La dificultad debe ser mayor o igual que 0" })
    .max(10, { message: "La dificultad debe ser menor o igual que 10" })
    .refine(val => Number.isFinite(val) && Math.round(val * 10) % 1 === 0, {
      message: "La dificultad debe ser un múltiplo de 0.1",
    }),
  deadline: z.iso.date({ message: "La fecha es obligatoria" }),
  strictAnswer: z.boolean("La respuesta debe ser obligatoria").default(false),
  active: z.boolean("La respuesta debe ser obligatoria").default(false),
  suggested: z.boolean("El tipo de desafio es obligatorio").default(false),
});

export const weeklyChallengesUpdateSchema = z.object({
  id: z.uuidv4({ message: "No se pudo identificar el desafío" }),
  title: z.string("El título es obligatorio"),
  description: z.string("La descripción del desafío es obligatoria"),
  isMultipleChoice: z.boolean("La pregunta debe ser de una sola respuesta o de varias"),
  options: z.union([
    z.array(z.string("Las opciones son obligatorias")).min(2, "Las opciones son obligatorias y deben ser de 2 o más"),
    z.array(z.literal('')).length(1, "Opciones inválidas"),
  ]),
  correctAnswers: z
  .union([
    z.string().min(1, "La respuesta es obligatoria"),
    z.array(z.string().min(1, "Las respuestas son obligatorias")).min(1, "Al menos una respuesta es obligatoria")
  ])
  .transform((val) => (typeof val === "string" ? [val] : val)),
  difficulty: z.coerce
    .number()
    .min(0, { message: "La dificultad debe ser mayor o igual que 0" })
    .max(10, { message: "La dificultad debe ser menor o igual que 10" })
    .refine(val => Number.isFinite(val) && Math.round(val * 10) % 1 === 0, {
      message: "La dificultad debe ser un múltiplo de 0.1",
    }),
  deadline: z.iso.date({ message: "La fecha es obligatoria" }),
  strictAnswer: z.boolean("La respuesta debe ser obligatoria").default(false),
  active: z.boolean("La respuesta debe ser obligatoria").default(false),
  suggested: z.boolean("El tipo de desafio es obligatorio").default(false),
});

export const weeklyChallengesDeleteSchema = z.object({
  id: z.uuidv4({ message: "No se pudo identificar el desafío" }),
});

export type WeeklyChallengesAddInput = z.infer<typeof weeklyChallengesAddSchema>;
export type WeeklyChallengesUpdateInput = z.infer<typeof weeklyChallengesUpdateSchema>;
export type WeeklyChallengesDeleteInput = z.infer<typeof weeklyChallengesDeleteSchema>;


