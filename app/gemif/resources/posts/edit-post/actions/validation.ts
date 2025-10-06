import z from "zod";

export const RESOURCES_POSTS_UPDATE_SCHEMA: Record<string, string> = {
  id: "ID",
  name: "Título",
  description: "Descripción",
  subjectId: "Asignatura",
  links: "Enlaces"
}


export const resourcesPostsUpdateSchema = z.object({
  id: z.uuidv4({ message: "No se pudo identificar el recurso" }),
  name: z.string("El título es obligatorio").max(255, "El título es demasiado largo"),
  description: z.string().nullable().optional(),
  links: z.union([
  z.array(z.url({
    protocol: /^https?$/,
    hostname: z.regexes.domain,
    error: "Uno o mas links tiene un formato incorrecto"}), "Enlaces inválidos"),
  z.literal([])
  ]),
  subjectId: z
  .string("El id primitivo es obligatorio")
  .length(8, "El id primitivo debe tener exactamente 8 caracteres")
  .regex(/^\d+$/, "El id primitivo debe contener solo números"),
});

