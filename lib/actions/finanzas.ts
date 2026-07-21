"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/server/auth-guard";

export async function registrarAbonoAction(data: {
  socioId: string;
  monto: number;
  metodo: "EFECTIVO" | "TRANSFERENCIA" | "COMPENSACION" | "CONDONACION";
  motivo: string;
}) {
  await requireRole(["ADMIN", "CONTABILIDAD"]);
  try {
    // 1. Buscamos la temporada marcada como actual: true
    const temporadaActual = await prisma.temporada.findFirst({
      where: { activa: true }
    });

    if (!temporadaActual) {
      return { error: "No hay una temporada configurada como 'Activa' en el sistema." };
    }

    // 2. Creamos el abono en estado PENDIENTE.
    // El pago debe ser revisado y aprobado por un usuario con rol adecuado
    // (ADMIN | CONTABILIDAD | DIRECTIVA) desde la pestaña "Pendientes" de Contabilidad.
    await prisma.abono.create({
      data: {
        monto: data.monto,
        metodo: data.metodo,
        motivo: data.motivo,
        estado: "PENDIENTE",
        socioId: data.socioId,
        temporadaId: temporadaActual.id,
        fecha: new Date(),
      }
    });

    // 3. Refrescamos los datos del jugador para que el balance se actualice al instante
    revalidatePath(`/jugadores/${data.socioId}`);
    revalidatePath("/contabilidad");
    return { success: true };

  } catch (error: any) {
    console.error("ERROR_REGISTRAR_ABONO:", error);
    return { error: "Error de base de datos al registrar el pago." };
  }
}

export async function crearCargoAction(data: {
  socioId: string;
  monto: number;
  concepto: string;
}) {
  await requireRole(["ADMIN", "CONTABILIDAD"]);
  try {
    const temporadaActual = await prisma.temporada.findFirst({
      where: { activa: true }
    });

    if (!temporadaActual) {
      return { error: "No hay una temporada configurada como 'Activa' en el sistema." };
    }

    await prisma.cargo.create({
      data: {
        monto: data.monto,
        concepto: data.concepto,
        socioId: data.socioId,
        temporadaId: temporadaActual.id,
        // fecha @default(now())
      }
    });

    revalidatePath(`/jugadores/${data.socioId}`);
    return { success: true };
  } catch (error: any) {
    console.error("ERROR_CREAR_CARGO:", error);
    return { error: "No se pudo generar el cargo." };
  }
}

