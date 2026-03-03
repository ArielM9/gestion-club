# AGENTS.md - Victorianos Gestión

## Build & Dev Commands

```bash
# Development
bun dev              # Start development server (Next.js 16 with Turbopack)

# Build & Lint
bun build            # Production build
bun lint             # ESLint check (use --fix for auto-fix)
bun lint --fix      # Auto-fix ESLint errors

# Database (Prisma)
bun run db:push      # Push schema changes to database
bun run db:migrate   # Run migrations in development
bun run db:studio    # Open Prisma Studio GUI
bun run db:seed      # Run database seed

# TypeScript
bunx tsc --noEmit   # TypeScript type checking only
```

## Reglas para Agentes

1. **Idioma**: Siempre responder en español
2. **Preparación**: Antes de hacer cambios significativos en React/Next.js, cargar el skill `vercel-react-best-practices`:
   ```bash
   skill name=vercel-react-best-practices
   ```
3. **Verificación**: Siempre ejecutar `bun run build` antes de finalizar para verificar que no hay errores de TypeScript
4. **Documentación**: Si hay algo que no está documentado en AGENTS.md, actualizarlo

## Arquitectura Servidor vs Cliente

- **Prefiere Server Components**: Usa componentes de servidor por defecto, solo usa `"use client"` cuando sea necesario (useState, useEffect, eventos, useSearchParams)
- **Lógica en servidor**: Toda la lógica de negocio debe estar en Server Actions
- **Minimiza Client Components**: Cuantos menos componentes con estado interactivo, mejor rendimiento
- **Datos en servidor**: Los componentes pueden hacer fetch directamente a Prisma

## Project Structure

```
app/
├── (auth)/           # Public routes (login, register)
├── (dashboard)/      # Protected routes with auth
│   ├── admin/
│   ├── contabilidad/
│   ├── documentos/
│   ├── eventos/     # Events module (partidos, torneos, reuniones, sociales)
│   └── jugadores/
├── api/              # API routes (only for S3/MinIO presigned URLs)
└── generated/        # Prisma generated client

components/
├── ui/               # Shared UI components
├── auth/             # Auth-related components
├── dashboard/        # Dashboard components
├── jugadores/        # Player management components
├── contabilidad/     # Accounting components
├── documentos/       # Document management
└── eventos/          # Event management

lib/
├── actions/          # Server actions ("use server")
├── server/actions/   # Server actions (alternative location)
├── validations/      # Zod schemas
├── prisma.ts         # Prisma client singleton
├── auth.ts           # Better-auth configuration
└── utils/            # Utility functions

prisma/
├── schema.prisma     # Database schema
└── seed.ts          # Seed data
```

## Code Style Guidelines

### TypeScript

- **Avoid `any`**: Always use specific types. If you must use `any`, document why.
- **Interfaces vs Types**: Use `interface` for object shapes, `type` for unions/primitives
- **Explicit Return Types**: Prefer explicit return types for Server Actions
- **Null Handling**: Use optional chaining (`?.`) and nullish coalescing (`??`)

```typescript
// GOOD
interface Socio {
  id: string;
  nombre: string;
  categoria: Categoria | null;
}

// AVOID
const socio: any = getSocio();
```

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `Sidebar.tsx`, `FormularioSocio.tsx` |
| Server Actions | camelCase + Action | `crearSocioAction`, `actualizarPagoAction` |
| Zod Schemas | PascalCase + Schema | `SocioSchema`, `PagoSchema` |
| Type Exports | *FormValues | `SocioFormValues`, `PagoFormValues` |
| Files | Descriptive, kebab-case | `category-filter.tsx`, `modal-cargo.tsx` |
| Events | onVerb | `onConfirm`, `onCancel`, `onSelect` |
| Booleans | is/has/should + noun | `isLoading`, `hasError`, `shouldRefetch` |

### Import Order

1. **Directive** (if needed): `"use server"` or `"use client"`
2. **Next.js**: `next/*` imports
3. **React**: `react`, `react-dom`
4. **Third-party**: `zod`, `lucide-react`, `sonner`, etc.
5. **Internal absolute**: `@/lib/*`, `@/components/*`

```typescript
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, User, Save } from "lucide-react";
import { toast } from "sonner";
import { crearSocioAction } from "@/lib/actions/socios";
```

### Server Actions Pattern

```typescript
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function crearEventoAction(data: EventoFormValues) {
  const result = EventoSchema.safeParse(data);
  
  if (!result.success) {
    return { error: "Datos de formulario inválidos" };
  }
  
  try {
    await prisma.evento.create({ data: result.data });
    revalidatePath("/eventos");
    return { success: true };
  } catch (error: any) {
    console.error("ERROR_CREAR_EVENTO:", error);
    if (error.code === 'P2002') {
      return { error: "Ya existe un evento con estos datos" };
    }
    return { error: "Error de base de datos" };
  }
}
```

### Error Handling

- Server actions MUST return `{ success: true }` or `{ error: string }`
- Log errors with descriptive prefixes: `console.error("ACTION_NAME:", error)`
- Handle Prisma unique constraint errors (code 'P2002')
- Use `sonner` for toast notifications
- Never expose internal error details to users

### Form Validation with Zod

```typescript
import { z } from "zod";

const TipoEventoEnum = z.enum(["PARTIDO", "TORNEO", "SOCIAL", "REUNION", "OTRO"]);

export const EventoSchema = z.object({
  tipo: TipoEventoEnum,
  fecha: z.coerce.date(),
  ubicacion: z.string().min(1, "Obligatorio"),
  titulo: z.string().optional(),
  detalles: z.string().optional(),
  esLocal: z.boolean().default(true),
  rival: z.string().optional(),
  equipoId: z.string().optional(),
});

export type EventoFormValues = z.infer<typeof EventoSchema>;
```

### Role-Based Access

Roles available: `ADMIN`, `CONTABILIDAD`, `COLABORADOR`

```typescript
// In layouts/pages
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/login");

// In components
const userRole = session?.user?.role;
const hasAccess = item.roles.includes(userRole);
```

## Styling Guidelines

- **Framework**: TailwindCSS v4
- **Component Style**: Use rounded corners (`rounded-2xl`, `rounded-[2rem]`)
- **Color Scheme**: 
  - Background: `slate-900` (#1e293b)
  - Content areas: `bg-white` or `bg-[#f8fafc]`
  - Accents: `blue-500`, `amber-500`
- **Dark mode UI** with light content areas
- **Icons**: Use `lucide-react`
- **Spacing**: Use consistent spacing (4, 6, 8 = 1rem, 1.5rem, 2rem)
- **Typography**: 
  - Headers: `font-black text-slate-900 uppercase text-xs tracking-widest`
  - Body: `font-bold text-sm text-slate-700`

## Component Patterns

### Dynamic Forms (Conditional Fields)

For event types that have different fields:

```typescript
const showEquipo = tipo === "PARTIDO" || tipo === "TORNEO";
const showRival = tipo === "PARTIDO";
const showTitulo = tipo !== "PARTIDO";

{showRival && (
  <div>
    <label>Rival</label>
    <input value={formData.rival} onChange={...} />
  </div>
)}
```

### Client Components

Mark components with `"use client"` when they:
- Use useState, useEffect, or other React hooks
- Handle user events (onClick, onChange)
- Use browser APIs
- Use Next.js client hooks (useSearchParams, useRouter)

### Server Components (Default)

Keep components as Server Components when possible:
- Fetch data directly from Prisma
- No interactive state needed
- Pass data to client children

## Prisma Guidelines

- Use singleton pattern from `lib/prisma.ts`
- Generated client at `app/generated/client`
- Use transactions for related operations
- Index frequently queried fields (`@@index([fecha])`)
- Include relations with `include: { relation: true }`

## Language Guidelines

- **UI Text**: Spanish (user-facing strings in Spanish)
- **Code**: English (variables, functions, comments)
- **Error Messages**: Spanish for user display
- **File Comments**: Spanish when explaining business logic

## Security

- Never expose secrets in client code
- Use `headers()` from next/headers in server actions for auth
- Validate all inputs with Zod before database operations
- Check user roles before rendering sensitive UI
- Use parameterized queries (Prisma does this automatically)

## Skills

### Vercel React Best Practices (OBLIGATORIO)

Cuando escribas, revises o refactorices código React/Next.js, SIEMPRE carga primero el skill `vercel-react-best-practices`.

```bash
# Cargar skill
skill name=vercel-react-best-practices
```

Este skill proporciona 57 reglas de optimización de rendimiento de Vercel Engineering para prevenir errores específicos de Next.js 16.

## Testing (Future)

Testing framework not yet configured. When ready for MVP testing, consider:
- Vitest for unit tests: `bun test`
- Playwright for E2E tests

If adding tests:
- Place tests next to components: `Component.tsx` → `Component.test.tsx`
- Use "@testing-library/react" for component tests
- Mock Prisma client in tests

## Features Futuras (Post-MVP)

Estas features se implementarán después del MVP, según prioridades del club.

### Sistema de Categorías y Asignación Automática

#### Categorías de rugby (España):
| Categoría | Edad | Observaciones |
|-----------|------|---------------|
| M6 | ≤6 años | Prebenjamín |
| M8 | ≤8 años | Benjamín |
| M10 | ≤10 años | Alevín |
| M12 | ≤12 años | Infantil |
| M14 | ≤14 años | Cadete |
| M16 | ≤16 años | Juvenil |
| M18 | ≤18 años | Junior |
| M20 | ≤20 años | Sub20 |
| M22 | ≤22 años | Sub22 |
| Senior | >18 años | Absoluto |

#### Lógica de asignación automática:
1. **Fecha de nacimiento** → determina categoría automáticamente
2. **Si edad ≥18 años** → equipo Senior (M20 y M22 van a Senior)
3. **Sexo** (solo adultos) → equipo Masculino o Femenino
4. **Excepciones**: editable manualmente en ficha del jugador

#### Precios por temporada:
- **Precio ficha**: configurable por categoría (se establece al crear temporada)
- **Precio cuota club**: único para todos los jugadores (se establece al crear temporada)

### Zona de Entrenadores (Futuro)
- Control de asistencia a entrenamientos y partidos
- Notas y observaciones por jugador
- Informes de rendimiento
- Nota: Actualmente los entrenadores NO tienen acceso a la app

### Lectura Inteligente de Documentos
- OCR o IA para extraer datos de documentos automáticamente
- No depender de nomenclatura de archivos
- Validación automática de documentos

### Integración con Federación
- Importar datos de la federación (número de licencia federativa)
- Asignación automática de número de ficha a cada jugador
- Sincronización de datos federativos

### Funcionalidades Futuras Consideradas y Descartadas
- App móvil: Descartado (uso interno-only)
- Pagos online (Stripe/Bizum): Descartado (solo efectivo y transferencia)
- Inscripciones públicas: Descartado (app solo para directiva)
- Chat/notificaciones a socios: Descartado (app solo para directiva)
- Zona pública para socios: Descartado
