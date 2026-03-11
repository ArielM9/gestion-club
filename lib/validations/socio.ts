import { z } from "zod";

const dniNieRegex = /^[0-9XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
const ibanRegex = /^[A-Z]{2}[0-9]{22}$/i;

export type SocioFormValues = z.infer<typeof SocioSchema>;

export const SocioSchema = z.object({
  nombre: z.string().min(2, "Obligatorio"),
  apellidos: z.string().min(2, "Obligatorio"),
  sexo: z.enum(["M", "F"], { message: "Obligatorio" }),
  dni: z.string().toUpperCase().regex(dniNieRegex, "DNI/NIE inválido"),
  fechaNacimiento: z.string().min(1, "Obligatorio"),
  nacionalidad: z.string().min(1, "Obligatorio"),
  email: z.string().email("Email inválido"),
  telefono: z.string().min(9, "Teléfono inválido"),
  direccion: z.string().optional(),
  codigoPostal: z.string().optional(),
  localidad: z.string().optional(),
  urlDniFrontal: z.string().optional(),
  cuentaBancaria: z.string().optional().or(z.literal("")), // NO obligatorio
  observaciones: z.string().optional(),
  tallaRopa: z.string().optional(),
  // Eliminados campos de documentación (ahora es automático)
  // Campos del Tutor (Opcionales por defecto)
  nombreTutor: z.string().optional(),
  dniTutor: z.string().toUpperCase().regex(dniNieRegex, "DNI/NIE inválido").optional().or(z.literal("")),
  telefonoTutor: z.string().optional().or(z.literal("")),
}).refine((data) => {
  const edad = calcularEdad(data.fechaNacimiento);
  // Lógica: Si es menor, obligamos a Teléfono del Tutor. 
  // Si es mayor, obligamos a Teléfono del Socio.
  if (edad < 18) return !!data.telefonoTutor;
  return !!data.telefono;

}, {
  message: "El nombre del tutor es obligatorio para menores",
  path: ["nombreTutor"],
});

// Función auxiliar para reusar
function calcularEdad(fecha: string) {
  const hoy = new Date();
  const cumple = new Date(fecha);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  if (hoy < new Date(cumple.setFullYear(hoy.getFullYear()))) edad--;
  return edad;
}