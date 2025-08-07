import { email, z } from "zod";

export const usersPostSchema = z.object({
  name: z.string("El nombre es obligatorio").max(255, "El nombre es demasiado largo"),
  year: z.coerce
  .number("El curso es obligatorio")
  .int("El curso debe ser un número entero")
  .min(1, { message: 'El curso mínimo es 1' })
  .max(4, { message: 'El curso máximo es 4' }),
  email: z.email({ message: "Correo inválido" }).max(255, "El correo es demasiado largo"),
  confirmEmail: z.email({ message: "Confirmación de correo inválida" }).max(255, "La confirmación del correo es demasiado larga"),
  password: z.string("La contraseña es obligatoria").min(4, "La contraseña es demasiado corta, debe tener al menos 4 caracteres"),
  confirmPassword: z.string("La confirmación de la contraseña es obligatoria").min(4, "La confirmación de la contraseña es demasiado corta, debe tener al menos 4 caracteres"),
  key: z.string("La clave es obligatoria"),
});

export type UserPostInput = z.infer<typeof usersPostSchema>;
