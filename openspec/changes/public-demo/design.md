# Design: Public Demo

## Technical Approach

Three specs form a pipeline: `demo-infrastructure` (deployment) wraps `demo-mode` (runtime) and `demo-seed` (data). A dedicated `demo` branch holds overrides; Docker Compose orchestrates app + PostgreSQL + MinIO. GitHub Actions resets nightly. The `NEXT_PUBLIC_IS_DEMO` env var gates all behavior changes — zero code paths affected in production.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Auth bypass mechanism | Middleware auto-creates session via `auth.api.setSession` | Mocked auth provider, route-level bypass | Uses real Better Auth sessions — all role checks, Server Actions, and `auth.api.getSession` calls work natively |
| Seed asset strategy | `scripts/generate-demo-assets.ts` generates colored PNG squares with initials at build time | Pre-committed images, external CDN | Keeps repo under 200KB; colors are deterministic from initials (no AI dependency); generated assets never go stale |
| Demo branch isolation | `demo` branch with rebase-only sync from `main`, never merged | Feature flag in `main` | Complete isolation; demo-specific files (Dockerfile.demo, compose, workflow) don't pollute `main` |
| S3 bucket reuse | Same `club-files` bucket name with different MinIO instance | Separate bucket name | Keeps seed code identical between demo and dev; environment variables isolate instances |

## Data Flow

```
GitHub Actions (02:00 UTC)
  │
  ├─ docker compose down -v    ← destroys volumes
  ├─ docker compose up --build
  │    │
  │    ├─ postgres:16 ──── prisma db push ──── seed-demo.ts
  │    │                                           │
  │    │    ┌──────────────────────────────────────┘
  │    │    │  generates 45 socios, 25 eventos, 40 contabilidad records...
  │    │    │
  │    │    ├─ generate-demo-assets.ts (PNG → demo-assets/)
  │    │    └─ uploads to MinIO (fotos/, documentos/)
  │    │
  │    ├─ minio ──── bucket: club-files
  │    │
  │    └─ app (Next.js) ──── NEXT_PUBLIC_IS_DEMO=true
  │              │
  User ──────────┤
                 │
  middleware ────┤ IS_DEMO? → auth.api.setSession({role: ADMIN}) → continue
                 │ !IS_DEMO → normal redirect to /login
                 │
  layout ────────┤ IS_DEMO? → <DemoBanner /> at top + children
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `docker-compose.demo.yml` | Create | Three-service stack: postgres, minio, app |
| `Dockerfile.demo` | Create | Extends existing multi-stage build; adds seed + MinIO upload after `yarn build` |
| `scripts/seed-demo.ts` | Create | Full-coverage seed: 45 socios, 2 temporadas, 5 equipos, 25 eventos, 40 contabilidad records, 20 documentos, 8 ventas |
| `scripts/generate-demo-assets.ts` | Create | Generates colored PNG squares with initials; deterministic (hash of name → RGB) |
| `middleware.ts` | Modify | Add IS_DEMO guard: auto-create ADMIN session, skip redirect |
| `app/layout.tsx` | Modify | Conditionally render `<DemoBanner />` when IS_DEMO |
| `components/demo/DemoBanner.tsx` | Create | Fixed top banner: "Esto es una demo. Los datos se borran cada madrugada." Dismissible with `localStorage` |
| `lib/demo.ts` | Create | Server + client helper: `IS_DEMO` flag export, `ensureDemoSession()` for middleware |
| `.env.demo` | Create | All demo variables: DB, S3, auth, IS_DEMO |
| `.github/workflows/reset-demo.yml` | Create | Cron `0 2 * * *`: destroy volumes, rebuild, prune |
| `demo-assets/` | Create | Directory for generated photos + placeholder docs |

## Interfaces / Contracts

**lib/demo.ts** — shared flag:
```typescript
// Server and client-safe singleton
export const IS_DEMO = process.env.NEXT_PUBLIC_IS_DEMO === "true";
```

**middleware.ts** — demo guard (inserted before session check):
```typescript
if (IS_DEMO) {
  // Auto-create ADMIN session if none exists
  if (!getSessionCookie(request)) {
    // Set demo session cookie via auth API
    // (call auth.api.setSession or direct cookie injection)
  }
  return NextResponse.next();
}
```

**Dashboard layout** — demo session handling:
```typescript
// In (dashboard)/layout.tsx — before the existing redirect
if (IS_DEMO && !session) {
  // Auto-create via Better Auth internal API
  const demoUser = await ensureDemoUser(); // find-or-create admin@demo.local
  await auth.api.setSession({...});
}
```

**DemoBanner props**: None. Reads `IS_DEMO` from `lib/demo.ts`. Uses `localStorage` key `demo-banner-dismissed`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Build | Compose stack starts without errors | `docker compose -f docker-compose.demo.yml up --build` |
| Smoke | All modules render with demo data | Manual: visit /dashboard, /jugadores, /contabilidad, /eventos, /documentos, /tienda |
| Banner | Dismiss persists per-session | Manual: click dismiss, refresh page, verify banner returns |
| Reset | Cron destroys and recreates | Manual trigger of workflow; verify fresh data |

No automated test runner configured (per `openspec/config.yaml`).

## Migration / Rollout

No migration required. Feature lives entirely on the `demo` branch. Rollback: delete branch + workflow dispatch. Production is fully isolated.

## Open Questions

- [ ] Presigned URL TTL for documents (default 7 days — fine for demo that resets nightly)
- [ ] Coolify / reverse proxy config for demo VPS (out of scope per spec, but impacts actual deployment)
