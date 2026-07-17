# Tasks: Public Demo

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~760 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Docker infrastructure + env + asset generation | PR 1 (base: feature/demo) | Foundation: compose, Dockerfile, .env.demo, lib/demo.ts, generate-demo-assets.ts |
| 2 | Seed script + demo mode runtime | PR 2 (base: PR 1 branch) | Seed, middleware, layout, DemoBanner. Depends on lib/demo.ts from PR 1 |
| 3 | GitHub Actions workflow + final verification | PR 3 (base: PR 2 branch) | reset-demo.yml, smoke test the full stack |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Create `lib/demo.ts` — export `IS_DEMO` flag from `NEXT_PUBLIC_IS_DEMO` env var, server+client safe
- [x] 1.2 Create `.env.demo` — all demo variables: DATABASE_URL, S3_*, NEXT_PUBLIC_IS_DEMO=true, BETTER_AUTH_SECRET
- [x] 1.3 Create `docker-compose.demo.yml` — three services: `app` (build with Dockerfile.demo, port 3000), `db` (postgres:16, volume), `minio` (minio/minio, volume, bucket init). Use `.env.demo`
- [x] 1.4 Create `Dockerfile.demo` — extend multi-stage build: base → deps → builder → runner. Add post-build step: run `bun run db:push` + `bun run seed:demo`
- [x] 1.5 Create `scripts/generate-demo-assets.ts` — generate colored PNG squares with initials (hash-based deterministic colors). Output to `demo-assets/fotos/` and `demo-assets/documentos/`. Use `canvas` or inline SVG→PNG. ~80 lines
  - _Note: Asset generation is inlined into `scripts/seed-demo.ts` (PNG + PDF generators) rather than a separate file. The seed uploads directly to MinIO, so on-disk `demo-assets/` was unnecessary._
- [x] 1.6 Verify: `bun run build` passes (lib/demo.ts is type-safe)

## Phase 2: Demo Seed Script

- [x] 2.1 Create `scripts/seed-demo.ts` — main seed entry point. Import all sub-seeders, coordinate order (temporadas → socios → equipos → eventos → contabilidad → documentos → tienda)
- [x] 2.2 Seed temporadas: "2024/2025" CLOSED, "2025/2026" ACTIVE with TemporadaCategoria prices per category
- [x] 2.3 Seed socios: 45 records. Categories M6–Senior, 60/40 gender split, tutor data for minors, payment status variation (50/25/25), profile completeness variation, 5–8 archived
- [x] 2.4 Seed equipos: 5 teams (Senior M, Senior F, M16 federado, M14, M10) with Inscripcion records linking to socios
- [x] 2.5 Seed eventos: ~25 events — partidos (12), torneos (4), reuniones (4), sociales (3), otros (2). Valid dates, locations, type-specific fields (rival, esLocal, etc.)
- [x] 2.6 Seed contabilidad: ~20 abonos (APROBADO/PENDIENTE/RECHAZADO), ~15 gastos (arbitrajes, material, instalaciones, federación), ~5 ingresos (subvenciones, patrocinios). ≥3 socios with unpaid cargo
- [x] 2.7 Seed documentos: ~20 records. Types DNI/DR/DJ/ER/AI/COMPROBANTE_PAGO. States VALIDADO/PENDIENTE/RECHAZADO/ORFANO. Upload to MinIO `club-files/documentos/`
- [x] 2.8 Seed tienda: ~8 ventas (DIRECTA/ENTREGADA/PLAZOS/FIADO) with MovimientoStock records (COMPRA/VENTA/ENTREGA)
- [x] 2.9 Seed fotos: generate 12–15 player photos via `generate-demo-assets.ts`, upload to MinIO `club-files/fotos/`. ≥2 per major category group
- [x] 2.10 Verify: `bun run build` passes. Manual test: `bun run seed:demo` runs against local DB without errors

## Phase 3: Demo Mode Runtime

- [x] 3.1 Modify `middleware.ts` — add IS_DEMO guard at top: if IS_DEMO and no session cookie, call `auth.api.setSession` to auto-create ADMIN session for `admin@demo.local` (find-or-create user). Skip redirect to /login
  - _Note: middleware runs in Edge runtime. Implementation uses `NextResponse.next()` to bypass; the actual sign-in happens in `/api/demo/init` (Node runtime) which the dashboard layout redirects to. Cleaner separation._
- [x] 3.2 Modify `(dashboard)/layout.tsx` — add IS_DEMO fallback: if IS_DEMO and no session from `auth.api.getSession`, create demo session server-side before rendering
- [x] 3.3 Create `components/demo/DemoBanner.tsx` — client component. Fixed banner at top: "Esto es una demo. Los datos se borran cada madrugada." Dismiss button stores `demo-banner-dismissed` in `sessionStorage`. Reads `IS_DEMO` from `lib/demo.ts`
- [x] 3.4 Modify `app/layout.tsx` — conditionally render `<DemoBanner />` when `IS_DEMO` is true. Import from `components/demo/DemoBanner`
- [x] 3.5 Verify: `bun run build` passes. Smoke test: app starts with IS_DEMO=true, middleware doesn't redirect, banner renders

## Phase 4: CI/CD + Nightly Reset

- [x] 4.1 Create `.github/workflows/reset-demo.yml` — cron `0 2 * * *` + workflow_dispatch trigger. Steps: checkout demo branch, docker compose down -v, docker compose up --build -d, wait for health check, prune dangling images
- [x] 4.2 Add `scripts/seed-demo.ts` to `package.json` scripts as `"seed:demo"`
- [x] 4.3 Verify: YAML is valid (`actionlint` or manual review). Test with workflow_dispatch on feature branch

## Phase 5: Integration Verification

- [ ] 5.1 Run `docker compose -f docker-compose.demo.yml up -d --build` — verify all 3 services start healthy
- [ ] 5.2 Verify app loads at localhost:3000 — no login redirect, dashboard shows demo data
- [ ] 5.3 Navigate all modules: /jugadores, /contabilidad, /eventos, /documentos, /tienda — verify data renders
- [ ] 5.4 Verify photos display from MinIO (player avatars in socio cards)
- [ ] 5.5 Verify documents section shows uploaded files with correct states
- [ ] 5.6 Verify demo banner shows, dismiss works, reappears on new session
- [ ] 5.7 Verify write operations work: create a socio, edit an evento, confirm success toast
- [x] 5.8 Run `bun run build` one final time — zero TypeScript errors
