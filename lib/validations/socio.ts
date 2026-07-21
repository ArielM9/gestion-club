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
  fotoUrl: z.string().optional().or(z.literal("")),
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

// Schema para actualización parcial (PATCH) de un socio.
// Es un allowlist estricto: solo permite campos que un usuario legítimo
// puede modificar desde la UI. Campos sensibles (id, activo, createdAt,
// updatedAt, archivado, deudaPendiente) NO están aquí, por lo que Zod
// los strippea y nunca llegan a Prisma aunque el cliente intente
// forzarlos (mass assignment).
// Los flags de consentimiento solo se actualizan si el cliente los envía
// explícitamente; no se resetean en cada edición de perfil.
export const SocioUpdateSchema = z.object({
  // Datos personales
  nombre: z.string().min(2, "Obligatorio").optional(),
  apellidos: z.string().min(2, "Obligatorio").optional(),
  mote: z.string().nullable().optional(),
  dni: z.string().regex(dniNieRegex, "DNI/NIE inválido").optional(),
  fechaNacimiento: z.union([z.string(), z.date()]).optional(),
  sexo: z.enum(["M", "F"]).optional(),
  nacionalidad: z.string().min(1, "Obligatorio").optional(),
  // Contacto
  email: z
    .union([z.literal(""), z.string().email("Email inválido")])
    .nullable()
    .optional(),
  telefono: z
    .union([z.literal(""), z.string().min(9, "Teléfono inválido")])
    .nullable()
    .optional(),
  direccion: z.string().nullable().optional(),
  codigoPostal: z.string().nullable().optional(),
  localidad: z.string().nullable().optional(),
  fotoUrl: z.string().nullable().optional(),
  urlDniFrontal: z.string().nullable().optional(),
  cuentaBancaria: z.string().nullable().optional(),
  // Tutor
  nombreTutor: z.string().nullable().optional(),
  dniTutor: z
    .union([z.literal(""), z.string().regex(dniNieRegex, "DNI/NIE inválido")])
    .nullable()
    .optional(),
  telefonoTutor: z.string().nullable().optional(),
  // Otros
  tallaRopa: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
  categoriaId: z.string().nullable().optional(),
  // Flags de consentimiento (PATCH: solo se aplican si se envían)
  rgpdFirmado: z.boolean().optional(),
  declaracionResponsable: z.boolean().optional(),
  exoneracionResponsabilidad: z.boolean().optional(),
  declaracionExtranjera: z.boolean().optional(),
});

export type SocioUpdateValues = z.infer<typeof SocioUpdateSchema>;

// Función auxiliar para reusar
function calcularEdad(fecha: string) {
  const hoy = new Date();
  const cumple = new Date(fecha);
  let edad = hoy.getFullYear() - cumple.getFullYear();
  if (hoy < new Date(cumple.setFullYear(hoy.getFullYear()))) edad--;
  return edad;
}