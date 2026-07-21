"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/server/auth-guard";

export async function getEquipos(temporadaId?: string) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  const where = temporadaId ? { temporadaId } : {};
  
  return await prisma.equipo.findMany({
    where,
    include: {
      categoria: true,
      temporada: true,
      inscripciones: {
        include: {
          socio: true,
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getEquipoById(id: string) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  return await prisma.equipo.findUnique({
    where: { id },
    include: {
      categoria: true,
      temporada: true,
      inscripciones: {
        include: {
          socio: {
            include: {
              categoria: true,
            },
          },
        },
      },
    },
  });
}

export async function getEquiposPorTemporada(temporadaId: string) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  return await prisma.equipo.findMany({
    where: { temporadaId },
    include: {
      categoria: true,
      _count: {
        select: {
          inscripciones: true,
        },
      },
    },
    orderBy: { nombre: "asc" },
  });
}

export async function crearEquipoAction(data: {
  nombre: string;
  categoriaId: string;
  temporadaId: string;
}) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  try {
    const existe = await prisma.equipo.findFirst({
      where: {
        nombre: data.nombre,
        temporadaId: data.temporadaId,
      },
    });

    if (existe) {
      return { error: "Ya existe un equipo con ese nombre en esta temporada" };
    }

    const equipo = await prisma.equipo.create({
      data: {
        nombre: data.nombre,
        categoriaId: data.categoriaId,
        temporadaId: data.temporadaId,
        federado: false,
        cerrado: false,
      },
    });

    revalidatePath("/equipos");
    revalidatePath("/admin/temporadas");
    return { success: true, equipo };
  } catch (error) {
    console.error("ERROR_CREAR_EQUIPO:", error);
    return { error: "Error al crear el equipo" };
  }
}

export async function actualizarEquipoAction(
  id: string,
  data: {
    nombre?: string;
    categoriaId?: string;
    federado?: boolean;
  }
) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  try {
    const equipo = await prisma.equipo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        categoriaId: data.categoriaId,
        federado: data.federado,
      },
    });

    revalidatePath("/equipos");
    revalidatePath(`/equipos/${id}`);
    return { success: true, equipo };
  } catch (error) {
    console.error("ERROR_ACTUALIZAR_EQUIPO:", error);
    return { error: "Error al actualizar el equipo" };
  }
}

export async function eliminarEquipoAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    const tieneInscripciones = await prisma.inscripcion.count({
      where: { equipoId: id },
    });

    if (tieneInscripciones > 0) {
      return { error: "No se puede eliminar un equipo con jugadores inscritos" };
    }

    await prisma.equipo.delete({
      where: { id },
    });

    revalidatePath("/equipos");
    return { success: true };
  } catch (error) {
    console.error("ERROR_ELIMINAR_EQUIPO:", error);
    return { error: "Error al eliminar el equipo" };
  }
}

export async function agregarJugadorAEquipoAction(
  equipoId: string,
  socioId: string
) {
  await requireRole(["ADMIN", "DIRECTIVA", "COLABORADOR"]);
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: equipoId },
      include: { temporada: true },
    });

    if (!equipo) {
      return { error: "Equipo no encontrado" };
    }

    const inscripcionExistente = await prisma.inscripcion.findFirst({
      where: {
        socioId,
        temporadaId: equipo.temporadaId,
      },
    });

    if (inscripcionExistente?.equipoId === equipoId) {
      return { error: "El jugador ya está en este equipo" };
    }

    if (inscripcionExistente) {
      await prisma.inscripcion.update({
        where: { id: inscripcionExistente.id },
        data: {
          equipoId,
          categoriaId: equipo.categoriaId,
        },
      });
    } else {
      await prisma.inscripcion.create({
        data: {
          socioId,
          equipoId,
          categoriaId: equipo.categoriaId,
          temporadaId: equipo.temporadaId,
        },
      });
    }

    revalidatePath("/equipos");
    revalidatePath(`/equipos/${equipoId}`);
    return { success: true };
  } catch (error) {
    console.error("ERROR_AGREGAR_JUGADOR:", error);
    return { error: "Error al agregar jugador al equipo" };
  }
}

export async function quitarJugadorDeEquipoAction(
  equipoId: string,
  socioId: string
) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: equipoId },
      include: { temporada: true },
    });

    if (!equipo) {
      return { error: "Equipo no encontrado" };
    }

    await prisma.inscripcion.deleteMany({
      where: {
        socioId,
        temporadaId: equipo.temporadaId,
        equipoId,
      },
    });

    revalidatePath("/equipos");
    revalidatePath(`/equipos/${equipoId}`);
    return { success: true };
  } catch (error) {
    console.error("ERROR_QUITAR_JUGADOR:", error);
    return { error: "Error al quitar jugador del equipo" };
  }
}
