import z from "zod";

export const SIGN_UP_ERROR_PATHS: Record<string, string> = {
  email: 'Correo',
  confirmEmail: 'Confirmación de correo',
  password: 'Contraseña',
  confirmPassword: 'Confirmación de contraseña',
  key: 'Clave',
}

export const signUpSchema = z.object({
  email: z.email({ message: "Correo inválido" }).max(255, "El correo es demasiado largo"),
  confirmEmail: z.email({ message: "Confirmación de correo inválida" }).max(255, "La confirmación del correo es demasiado larga"),
  password: z.string("Contraseña inválida").min(4, "La contraseña es demasiado corta").max(50, "La contraseña es demasiado larga")
    .regex(/^[A-Za-z0-9_]+$/, {
      message: "La contraseña solo puede contener letras, números y _",
    }),
  confirmPassword: z.string("Confirmación de contraseña inválida").min(4, "La confirmación de contraseña es demasiado corta").max(50, "La confirmación de contraseña es demasiado larga")
    .regex(/^[A-Za-z0-9_]+$/, {
      message: "La confirmación contraseña solo puede contener letras, números y _",
    }),
  key: z.string("La clave es obligatoria").min(1, "Clave inválida").max(255, "La clave es demasiado larga"),
});
