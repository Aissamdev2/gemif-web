import z from "zod";


export const eventsAddSchema = z.object({
  name: z.string("El título obligatorio").max(255, "El título es demasiado largo"),
  date: z.iso.date({ message: "La fecha es obligatoria" }),
  time: z.iso.time({ message: "La hora es obligatoria" }),
  description: z.string().nullable().optional(),
  subjectid: z.uuidv4({ message: "No se pudo identificar la asignatura" }),
  primitiveid: z
  .string("El id primitivo es obligatorio")
  .length(8, "El id primitivo debe tener exactamente 8 caracteres")
  .regex(/^\d+$/, "El id primitivo debe contener solo números"),
  scope: z.string().min(1, "La visibilidad es obligatoria"),
});

export const eventsUpdateSchema = z.object({
  id: z.uuidv4({ message: "No se pudo identificar el evento" }),
  name: z.string("El título obligatorio").max(255, "El título es demasiado largo"),
  date: z.iso.date({ message: "La fecha es obligatoria" }),
  time: z.iso.time({ message: "La hora es obligatoria" }),
  description: z.string().nullable().optional(),
  subjectid: z.uuidv4({ message: "No se pudo identificar la asignatura" }),
  primitiveid: z
  .string()
  .length(8, "El id primitivo debe tener exactamente 8 caracteres")
  .regex(/^\d+$/, "El id primitivo debe contener solo números")
  .nullable()
  .optional(),

  scope: z.string().min(1, "La visibilidad es obligatoria"),
});

export const eventsDeleteSchema = z.object({
  id: z.uuidv4({ message: "No se pudo identificar el evento" }),
})



export type EventUpdateInput = z.infer<typeof eventsUpdateSchema>;
export type EventAddInput = z.infer<typeof eventsAddSchema>;
export type EventDeleteInput = z.infer<typeof eventsDeleteSchema>;
