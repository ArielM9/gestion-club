"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/server/auth-guard";

export async function getAllCategorias() {
  return await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: {
        select: {
          socios: true,
          equipos: true,
          inscripciones: true,
        },
      },
    },
  });
}

export async function crearCategoriaAction(nombre: string) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  try {
    const nombreNormalizado = nombre.trim();
    
    const existe = await prisma.categoria.findUnique({
      where: { nombre: nombreNormalizado },
    });

    if (existe) {
      return { error: "Ya existe una categoría con ese nombre" };
    }

    await prisma.categoria.create({
      data: { nombre: nombreNormalizado },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/temporadas");
    return { success: true };
  } catch (error) {
    console.error("ERROR_CREAR_CATEGORIA:", error);
    return { error: "Error al crear la categoría" };
  }
}

export async function actualizarCategoriaAction(id: string, nombre: string) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  try {
    const nombreNormalizado = nombre.trim();

    const existe = await prisma.categoria.findFirst({
      where: {
        nombre: nombreNormalizado,
        id: { not: id },
      },
    });

    if (existe) {
      return { error: "Ya existe otra categoría con ese nombre" };
    }

    await prisma.categoria.update({
      where: { id },
      data: { nombre: nombreNormalizado },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/temporadas");
    return { success: true };
  } catch (error) {
    console.error("ERROR_ACTUALIZAR_CATEGORIA:", error);
    return { error: "Error al actualizar la categoría" };
  }
}

export async function eliminarCategoriaAction(id: string) {
  await requireRole(["ADMIN"]);
  try {
    const tieneSocios = await prisma.socio.count({
      where: { categoriaId: id },
    });

    if (tieneSocios > 0) {
      return { error: "No se puede eliminar una categoría que tiene socios asignados" };
    }

    const tieneEquipos = await prisma.equipo.count({
      where: { categoriaId: id },
    });

    if (tieneEquipos > 0) {
      return { error: "No se puede eliminar una categoría que tiene equipos asociados" };
    }

    await prisma.categoria.delete({
      where: { id },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/admin/temporadas");
    return { success: true };
  } catch (error) {
    console.error("ERROR_ELIMINAR_CATEGORIA:", error);
    return { error: "Error al eliminar la categoría" };
  }
}
