"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function crearEventoAction(data: {
  tipo: "PARTIDO" | "TORNEO" | "SOCIAL" | "REUNION" | "OTRO";
  fecha: Date;
  ubicacion: string;
  titulo: string | null;
  detalles: string | null;
  esLocal: boolean;
  rival: string | null;
  equipoId: string | null;
}) {
  try {
    await prisma.evento.create({
      data: {
        tipo: data.tipo,
        fecha: data.fecha,
        ubicacion: data.ubicacion,
        titulo: data.titulo,
        detalles: data.detalles,
        esLocal: data.esLocal,
        rival: data.rival,
        equipoId: data.equipoId || null,
      },
    });

    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("ERROR_CREAR_EVENTO:", error);
    return { error: "Error al crear el evento" };
  }
}

export async function actualizarEventoAction(id: string, data: {
  tipo?: "PARTIDO" | "TORNEO" | "SOCIAL" | "REUNION" | "OTRO";
  fecha?: Date;
  ubicacion?: string;
  titulo?: string | null;
  detalles?: string | null;
  esLocal?: boolean;
  rival?: string | null;
  equipoId?: string | null;
}) {
  try {
    await prisma.evento.update({
      where: { id },
      data: {
        ...(data.tipo && { tipo: data.tipo }),
        ...(data.fecha && { fecha: data.fecha }),
        ...(data.ubicacion && { ubicacion: data.ubicacion }),
        ...(data.titulo !== undefined && { titulo: data.titulo }),
        ...(data.detalles !== undefined && { detalles: data.detalles }),
        ...(data.esLocal !== undefined && { esLocal: data.esLocal }),
        ...(data.rival !== undefined && { rival: data.rival }),
        ...(data.equipoId !== undefined && { equipoId: data.equipoId }),
      },
    });

    revalidatePath("/eventos");
    revalidatePath(`/eventos/${id}`);
    return { success: true };
  } catch (error) {
    console.error("ERROR_ACTUALIZAR_EVENTO:", error);
    return { error: "Error al actualizar el evento" };
  }
}

export async function eliminarEventoAction(id: string) {
  try {
    await prisma.evento.delete({
      where: { id },
    });

    revalidatePath("/eventos");
    return { success: true };
  } catch (error) {
    console.error("ERROR_ELIMINAR_EVENTO:", error);
    return { error: "Error al eliminar el evento" };
  }
}
