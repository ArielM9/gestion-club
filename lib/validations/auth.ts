import { z } from "zod";

export const loginSchema = z.object({
  // He cambiado "username" por "email" porque Better Auth usa email por defecto
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Introduce un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(20, "El usuario es demasiado largo"),
    email: z.string().email("Email inválido").min(1, "El email es requerido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(1, "Debes confirmar la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"], // Esto indica que el error debe mostrarse en el campo confirmPassword
  });

// Este tipo servirá para que useForm sepa exactamente qué campos existen
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;