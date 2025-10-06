import z from "zod";

export const SIGN_IN_ERROR_PATHS: Record<string, string> = {
  email: 'Correo',
  password: 'Contraseña',
}

export const signInSchema = z.object({
  email: z.email({ message: "Correo inválido" }).max(255, "El correo es demasiado largo"),
  password: z.string("Contraseña inválida").min(4, "La contraseña es demasiado corta").max(50, "La contraseña es demasiado larga")
  .regex(/^[A-Za-z0-9_]+$/, {
    message: "La contraseña solo puede contener letras, números y _",
  })
});
