-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONTABILIDAD', 'DIRECTIVA', 'COLABORADOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'DISABLED');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'COMPENSACION', 'CONDONACION');

-- CreateEnum
CREATE TYPE "EstadoAbono" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Socio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "fotoUrl" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "cuentaBancaria" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Temporada" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Temporada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscripcion" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "equipoId" TEXT NOT NULL,

    CONSTRAINT "Inscripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cargo" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "socioId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,

    CONSTRAINT "Cargo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abono" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodo" "MetodoPago" NOT NULL,
    "estado" "EstadoAbono" NOT NULL DEFAULT 'PENDIENTE',
    "motivo" TEXT,
    "comprobanteUrl" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "socioId" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "aprobadoPorId" TEXT,
    "cargoId" TEXT,

    CONSTRAINT "Abono_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngresoExterno" (
    "id" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fuente" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temporadaId" TEXT NOT NULL,

    CONSTRAINT "IngresoExterno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalles" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoDeportivo" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "visitante" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "detalles" TEXT,
    "equipoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoDeportivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "temporadaId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,

    CONSTRAINT "Equipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "costeFicha" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costeCuota" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "incluyeRopa" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Socio_dni_key" ON "Socio"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Inscripcion_socioId_temporadaId_key" ON "Inscripcion"("socioId", "temporadaId");

-- CreateIndex
CREATE INDEX "Log_createdAt_idx" ON "Log"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Equipo_nombre_temporadaId_key" ON "Equipo"("nombre", "temporadaId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_key" ON "Categoria"("nombre");

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscripcion" ADD CONSTRAINT "Inscripcion_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cargo" ADD CONSTRAINT "Cargo_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_aprobadoPorId_fkey" FOREIGN KEY ("aprobadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Abono" ADD CONSTRAINT "Abono_cargoId_fkey" FOREIGN KEY ("cargoId") REFERENCES "Cargo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngresoExterno" ADD CONSTRAINT "IngresoExterno_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoDeportivo" ADD CONSTRAINT "EventoDeportivo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_temporadaId_fkey" FOREIGN KEY ("temporadaId") REFERENCES "Temporada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipo" ADD CONSTRAINT "Equipo_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
