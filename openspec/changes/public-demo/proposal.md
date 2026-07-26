# Proposal: Public Demo

## Intent

Public demo instance for portfolio/client showcase. Auto-resets nightly, no login, realistic data covering ALL modules.

## Scope

### In Scope
- `demo` branch with env-gated anonymous access + banner
- `docker-compose.yml` (app + PostgreSQL + MinIO)
- Enhanced seed with MinIO upload + full data coverage
- GitHub Actions nightly reset

### Out of Scope
- Merging to `main`, production sync, write restrictions

## Capabilities

### New Capabilities
- `demo-mode`: Anonymous access, banner, auto-login
- `demo-seed`: Full-coverage seed with MinIO assets, documents, photos, ventas
- `demo-infrastructure`: Docker Compose, GitHub Actions nightly reset

### Modified Capabilities
None

## Approach

- `demo` branch, rebased weekly, never merged to `main`
- `NEXT_PUBLIC_IS_DEMO=true` → middleware auto-creates ADMIN session
- GitHub Actions cron 02:00 UTC → volume destroy + rebuild
- Seed uploads `demo-assets/` to MinIO

## Data Requirements

### Socios (~40-50)

| Attribute | Distribution |
|-----------|-------------|
| Categories | M6–M18, M20, M22, Senior M/F |
| Gender | ~60% male, ~40% female |
| Tutors | All minors have tutor data; adults null |
| Payment | ~50% paid, ~25% unpaid, ~25% partial |
| Completeness | ~30% full, ~40% standard, ~30% minimal |
| Status | ~35 active, ~5–8 archived |

### Temporadas (2)
- **Current** (2025/2026): active, ~35 inscribed, full prices
- **Previous** (2024/2025): closed, ~5 players with carried debt

### Equipos (5)
Senior M/F, M16 (federado); M14, M10 (no federado). Each with Inscripcion records.

### Eventos (~25)
Partidos (12), Torneos (4), Reuniones (4), Sociales (3), Otro (2).

### Contabilidad
- Abonos: ~20 APROBADO, ~5 PENDIENTE, ~3 RECHAZADO
- Gastos (~15): Arbitrajes, material, instalaciones, federación
- Ingresos (~5): Subvenciones, patrocinios
- ≥3 socios with unpaid cargo

### Documentos (~20)
Types: DNI, DR, DJ, ER, AI, COMPROBANTE_PAGO. States: ~10 VALIDADO, ~5 PENDIENTE, ~3 RECHAZADO, ~2 ORFANO. MinIO-stored.

### Fotos (12–15)
MinIO-stored. Generated (colored squares with initials) or placeholders. ≥2 per major category.

### Tienda
Ventas (~8): DIRECTA, ENTREGADA, PLAZOS, FIADO. MovimientoStock: COMPRA, VENTA, ENTREGA.

## Affected Areas

| Area | Impact |
|------|--------|
| `middleware.ts` | Demo auto-login |
| `app/layout.tsx` | Demo banner |
| `packages/db/prisma/seed.ts` | Full rewrite |
| `demo-assets/` | New: photos + docs |
| `docker-compose.yml` | New: stack |
| `.github/workflows/nightly-reset.yml` | New: cron |

## Risks

| Risk | Mitigation |
|------|------------|
| Branch diverges | Weekly rebase |
| MinIO URLs expire | Seed regenerates |
| Repo bloat | Images <10MB |

## Rollback

Delete `demo` branch and workflow. Fully isolated.

## Success Criteria

- [ ] Demo accessible without login
- [ ] All modules navigable with realistic data
- [ ] Photos and documents display from MinIO
- [ ] Nightly reset <10 min
