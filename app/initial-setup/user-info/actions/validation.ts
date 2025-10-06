import z from "zod";

export const INITIAL_SETUP_USER_INFO_ERROR_PATHS: Record<string, string> = {
  publicName: "Nombre público",
  name: "Nombre completo",
  year: "Curso"
}

export const initialSetupUserInfoSchema = z.object({
  publicName: z.string("El nombre público es obligatorio").max(255, "El nombre público es demasiado largo"),
  year: z.coerce
    .number("El curso es obligatorio")
    .int("El curso debe ser un número entero")
    .min(1, { message: 'El curso mínimo es 1' })
    .max(4, { message: 'El curso máximo es 4' }),
  name: z.string("El nombre completo es obligatorio").max(255, "El nombre completo es demasiado largo"),
});
