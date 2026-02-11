# AGENTS.md - Victorianos Gestión

## Build & Dev Commands

```bash
# Development
bun dev              # Start development server (Next.js 16)

# Build & Lint
bun build            # Production build
bun lint             # ESLint check

# Database (Prisma)
bun run db:push      # Push schema changes to database
bun run db:migrate   # Run migrations in development
bun run db:studio    # Open Prisma Studio GUI
bun run db:seed      # Run database seed
```

## Skills & Best Practices

### Vercel React Best Practices (MANDATORY)

**When writing, reviewing, or refactoring React/Next.js code, ALWAYS load the `vercel-react-best-practices` skill first.**

This skill provides 57 performance optimization rules from Vercel Engineering to prevent Next.js 16 specific errors.

**Usage:**
- Load skill before making any React/Next.js changes
- Follow patterns for Server/Client component boundaries
- Apply data fetching and caching best practices
- Use for bundle optimization and performance improvements

## Project Structure

```
app/
├── (auth)/           # Public routes (login, register)
├── (dashboard)/      # Protected routes with auth
│   ├── admin/
│   ├── contabilidad/
│   └── jugadores/
├── api/              # API routes
└── generated/        # Prisma generated client

components/
├── ui/               # Shared UI components
├── auth/             # Auth-related components
├── dashboard/        # Dashboard components
├── jugadores/        # Player management components
└── contabilidad/     # Accounting components

lib/
├── actions/          # Server actions ("use server")
├── validations/      # Zod schemas
├── prisma.ts         # Prisma client singleton
└── auth.ts           # Better-auth configuration

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seed data
```

## Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `Sidebar.tsx`, `FormularioSocio.tsx` |
| Server Actions | camelCase + Action | `crearSocioAction`, `actualizarPagoAction` |
| Zod Schemas | PascalCase + Schema | `SocioSchema`, `PagoSchema` |
| Type Exports | *FormValues | `SocioFormValues`, `PagoFormValues` |
| Files | Descriptive, feature-based | `CategoryFilter.tsx`, `ModalCargo.tsx` |

## Import Order

1. **Directive** (if needed): `"use server"` or `"use client"`
2. **Next.js**: `next/*` imports
3. **React**: `react`, `react-dom`
4. **Third-party**: `zod`, `lucide-react`, etc.
5. **Internal absolute**: `@/lib/*`, `@/components/*`

## Code Patterns

### Server Actions

```typescript
"use server";

export async function crearSocioAction(data: SocioFormValues) {
  const result = SocioSchema.safeParse(data);
  
  if (!result.success) {
    return { error: "Datos de formulario inválidos" };
  }
  
  try {
    await prisma.socio.create({ data: result.data });
    revalidatePath("/jugadores");
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: "Este DNI ya está registrado" };
    }
    return { error: "Error de base de datos" };
  }
}
```

### Validation with Zod

```typescript
import { z } from "zod";

const dniNieRegex = /^[0-9XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

export type SocioFormValues = z.infer<typeof SocioSchema>;

export const SocioSchema = z.object({
  nombre: z.string().min(2, "Obligatorio"),
  dni: z.string().toUpperCase().regex(dniNieRegex, "DNI/NIE inválido"),
  // ... more fields
});
```

### Role-Based Access

Roles available: `ADMIN`, `CONTABILIDAD`, `COLABORADOR`

```typescript
// In layouts
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect("/login");

// In components
const userRole = session?.user?.role;
const hasAccess = item.roles.includes(userRole);
```

## Styling Guidelines

- **Framework**: TailwindCSS v4 (use `@import "tailwindcss"`)
- **Color Scheme**: 
  - Background: `slate-900` (#1e293b)
  - Accents: `yellow-500`
  - Content areas: `bg-[#f8fafc]`
- **Dark mode UI** with light content areas
- Use `lucide-react` for icons

## Language Guidelines

- **UI Text**: Spanish (user-facing strings)
- **Code**: English (variables, functions, comments)
- **Error Messages**: Spanish for user display

## Error Handling

- Server actions always return `{ success: true }` or `{ error: string }`
- Log errors with descriptive prefixes: `console.error("ACTION_NAME:", error)`
- Handle Prisma unique constraint errors (P2002)
- Use `sonner` for toast notifications

## Prisma Guidelines

- Use singleton pattern from `lib/prisma.ts`
- Generated client at `app/generated/client`
- Use transactions for related operations
- Index frequently queried fields

## Security

- Never expose secrets in client code
- Use `headers()` from next/headers in server actions for auth
- Validate all inputs with Zod before database operations
- Check user roles before rendering sensitive UI

## Testing (Future)

Testing framework not yet configured. When ready for MVP testing, consider:
- Vitest for unit tests
- Playwright for E2E tests
