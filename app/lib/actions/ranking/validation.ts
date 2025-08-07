import { z } from "zod";

export const rankingUpdateSchema = z.object({
  id: z.uuidv4({ message: "No se pudo identificar el recurso" }),
  type: z.string("El tipo de recurso es obligatorio").regex(/^(qual|diff)$/, "No se pudo identificar que quiere puntuar"),
  score: z.coerce
    .number()
    .min(0, { message: "La puntuación debe ser mayor o igual que 0" })
    .max(10, { message: "La puntuación debe ser menor o igual que 10" })
    .refine(val => Number.isFinite(val) && Math.round(val * 10) % 1 === 0, {
      message: "La puntuación debe ser un múltiplo de 0.1",
    }),
});

export type RankingUpdateInput = z.infer<typeof rankingUpdateSchema>;
