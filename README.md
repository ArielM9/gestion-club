# Victorianos Gestión

Gestión interna del Club de Fútbol Victorianos. Aplicación web para la administración de jugadores, equipos, eventos, contabilidad y tienda del club.

> Proyecto personal desarrollado en solitario. No es un producto comercial.

---

## Stack Tecnológico

| Tecnología | Propósito |
|-------------|-----------|
| **Next.js 16** | Framework React con App Router |
| **React 19** | Biblioteca de UI |
| **TypeScript** | Tipado estático |
| **Prisma 7** | ORM para PostgreSQL |
| **better-auth** | Sistema de autenticación |
| **Zod** | Validación de esquemas |
| **react-hook-form** | Gestión de formularios |
| **TailwindCSS v4** | Estilos |
| **Bun** | Runtime y gestor de paquetes |

---

## Arquitectura del Proyecto

```
app/                    # Next.js App Router
├── (auth)/            # Rutas públicas (login, register)
├── (dashboard)/       # Rutas protegidas
│   ├── admin/        # Gestión de usuarios, temporadas
│   ├── contabilidad/# Control financiero
│   ├── documentos/   # Gestión documental
│   ├── eventos/     # Partidos, torneos, reuniones
│   ├── equipos/      # Gestión de equipos
│   ├── jugadores/   # Socios/jugadores
│   └── tienda/       # Venta de ropa, inventario
├── api/              # API routes (presigned URLs S3)
└── generated/        # Prisma client

components/           # Componentes React
├── ui/               # Componentes compartidos
├── auth/             # Autenticación
├── jugadores/        # Gestión de jugadores
├── contabilidad/     # Contabilidad
└── ...

lib/                 # Lógica compartida
├── actions/          # Server Actions
├── server/actions/   # Server Actions alternativos
├── validations/     # Esquemas Zod
├── prisma.ts        # Cliente Prisma singleton
├── auth.ts          # Configuración better-auth
└── utils/          # Utilidades
```

### Decisiones de Diseño

- **Server Components por defecto**: Los componentes son de servidor salvo que necesiten estado interactivo (`useState`, eventos)
- **Server Actions**: Toda la lógica de negocio reside en Server Actions, sin API routes innecesarias
- **Validaciones estrictas**: Zod con `refine()` para validaciones complejas, sin `any`
- **TypeScript strict**: Tipos específicos, evitando `any` salvo justificación documentada
- **Documentación en español**: UI y mensajes de error en español, código en inglés

---

## Patrones de Desarrollo

### Server Actions

```typescript
// lib/actions/eventos.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function crearEventoAction(data: EventoFormValues) {
  const result = EventoSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos de formulario inválidos" };
  }

  try {
    await prisma.evento.create({ data: result.data });
    revalidatePath("/eventos");
    return { success: true };
  } catch (error: unknown) {
    console.error("ERROR_CREAR_EVENTO:", error);
    if ((error as { code?: string }).code === "P2002") {
      return { error: "Ya existe un evento con estos datos" };
    }
    return { error: "Error de base de datos" };
  }
}
```

### Validaciones con Zod

```typescript
// lib/validations/socio.ts
const dniNieRegex = /^[XYZ]\d{7}[A-Z]$|^\d{8}[A-Z]$/i;

export const SocioSchema = z.object({
  nombre: z.string().min(2, "Obligatorio"),
  sexo: z.enum(["M", "F"]),
  dni: z.string().regex(dniNieRegex, "DNI/NIE inválido"),
  fechaNacimiento: z.coerce.date(),
  categoria: z.string().optional(),
  equipoId: z.string().optional(),
}).refine((data) => {
  if (data.categoria && !data.equipoId) {
    return { message: "Selecciona un equipo" };
  }
  return true;
}, { path: ["equipoId"] });

export type SocioFormValues = z.infer<typeof SocioSchema>;
```

### Orden de Imports

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearSocioAction } from "@/lib/actions/socios";
```

---

## Modelos de Datos

```
User          → Usuarios del sistema (ADMIN, CONTABILIDAD, COLABORADOR)
Socio        → Jugadores/socios del club
Temporada    → Temporadas (con precios por categoría)
Categoria    → M6, M8, M10... M22, Senior
Equipo       → Equipos del club
Evento       → Partidos, torneos, reuniones, sociales
Inscripcion  → Inscripciones por temporada
Cargo        → Pagos pendientes (ficha federativa, cuota club)
Abono        → Pagos recibidos
Documento   → Documentos subidos (DNI, seguro, licencia)
Producto     → Productos tienda
Venta        → Ventas tienda
MovimientoStock → Movimiento inventario
```

---

## Ejecución en Desarrollo

```bash
# Iniciar servidor development
bun dev

# Build de producción
bun build

# ESLint
bun lint
bun run lint --fix

# Database
bun run db:studio    # Prisma Studio
bun run db:push     # Push schema
bun run db:seed     # Seed datos

# TypeScript
bunx tsc --noEmit  # Type check
```

---

## Tecnologías Destacadas en CV

- **Next.js 16** con App Router y Server Components
- **Server Actions** para lógica de negocio en servidor
- **Prisma** con PostgreSQL para ORM
- **better-auth** para autenticación con roles
- **Zod + react-hook-form** para validación de formularios
- **TailwindCSS v4** para estilos
- **TypeScript strict** sin `any`
- **Bun** como runtime moderno
- **Monorepo** con estructura escalable

---

## Notas

- Proyecto desarrollado en solitario desde el diseño hasta la implementación
- No es un producto comercial, es una herramienta de gestión interna
- UI orientada a usuarios internos (directiva del club)
- Sin pagos online, solo efectivo y transferencia bancaria
- Sin acceso público, solo usuarios autenticados