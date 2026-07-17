# Demo Seed Specification

## Purpose

Defines the extended seed script that populates the demo database with realistic, diverse data covering all application modules, including MinIO asset upload.

## Requirements

### Requirement: Seed Script Coverage

The seed script SHALL create data for every application module: Socios, Temporadas, Equipos, Eventos, Contabilidad, Documentos, Tienda.

#### Scenario: All modules have representative data

- GIVEN the seed script runs on an empty database
- WHEN seeding completes
- THEN Socios exist (40-50), Temporadas (2), Equipos (5), Eventos (~25), Contabilidad records (~40), Documentos (~20), Tienda ventas (~8)

### Requirement: Socio Data Diversity

The seed SHALL produce socios with realistic attribute distributions.

#### Scenario: Category distribution covers all age groups

- GIVEN the seed creates 40-50 socios
- WHEN socios are generated
- THEN categories span M6 through Senior (M/F)
- AND approximately 60% are male, 40% female
- AND all minors have tutor data; adults do not

#### Scenario: Payment status variation

- GIVEN socios are seeded
- WHEN payment states are assigned
- THEN ~50% are fully paid, ~25% unpaid, ~25% partial
- AND at least 3 socios have unpaid cargos

#### Scenario: Profile completeness variation

- GIVEN socios are seeded
- WHEN profile data is populated
- THEN ~30% have full data, ~40% standard, ~30% minimal
- AND ~5-8 socios are archived (inactive)

### Requirement: Temporada with Historical Data

The seed SHALL create two temporadas to demonstrate cross-season behavior.

#### Scenario: Current and previous seasons exist

- GIVEN the seed runs
- WHEN temporadas are created
- THEN one "2024/2025" temporada exists with status CLOSED
- AND one "2025/2026" temporada exists with status ACTIVE
- AND ~5 players from the previous season carry unpaid debt

### Requirement: MinIO Asset Upload

The seed SHALL upload photos and documents to MinIO during execution.

#### Scenario: Player photos are uploaded

- GIVEN the seed script runs
- WHEN socios are created
- THEN 12-15 player photos are generated or placed in MinIO
- AND at least 2 photos exist per major category (Senior, M16-M18, M14-M12, M10-M6)
- AND photos are accessible via MinIO presigned URLs

#### Scenario: Documents are uploaded to MinIO

- GIVEN the seed script runs
- WHEN documents are created
- THEN ~20 documents are stored in MinIO
- AND types include DNI, DR, DJ, ER, AI, COMPROBANTE_PAGO
- AND states include ~10 VALIDADO, ~5 PENDIENTE, ~3 RECHAZADO, ~2 ORFANO

### Requirement: Event Diversity

The seed SHALL create events covering all event types.

#### Scenario: Event type distribution

- GIVEN events are seeded
- WHEN event types are assigned
- THEN partidos (~12), torneos (~4), reuniones (~4), sociales (~3), otros (~2) exist
- AND each event has a valid date, location, and associated type-specific fields

### Requirement: Contabilidad Records

The seed SHALL create accounting records demonstrating financial overview.

#### Scenario: Financial data covers all categories

- GIVEN accounting records are seeded
- WHEN abonos, gastos, and ingresos are created
- THEN ~20 abonos are APROBADO, ~5 PENDIENTE, ~3 RECHAZADO
- AND ~15 gastos exist (arbitrajes, material, instalaciones, federación)
- AND ~5 ingresos exist (subvenciones, patrocinios)

### Requirement: Tienda with Sales

The seed SHALL create tienda ventas demonstrating all sale states.

#### Scenario: Sales with stock movements

- GIVEN tienda is seeded
- WHEN ventas are created
- THEN ~8 ventas exist across DIRECTA, ENTREGADA, PLAZOS, FIADO states
- AND MovimientoStock records exist for COMPRA, VENTA, ENTREGA

## Non-Requirements

- Realistic photo generation (colored squares with initials are acceptable)
- Integration with external data sources
- Seed script performance optimization (runs once at deploy)
- Incremental seed updates (full reset each night)

## Dependencies

- Prisma schema (all models must exist)
- S3/MinIO client (`lib/s3.ts`) for asset upload
- `demo-assets/` directory with placeholder photos/documents
