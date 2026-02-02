import { no } from "zod/locales";
import prisma from "./prisma";

export async function getProximosEventos() {
  const ahora = new Date();
  
  return await prisma.evento.findMany({
    where: {
      fecha: { gte: ahora },
    },
    include: {
      // Traemos la relación, NO el campo plano
      // Traemos el nombre del equipo y la categoria
      equipo: {
        include: {
          categoria: true,
        },
      },
    },
    orderBy: {
      fecha: "asc",
    },
    take: 5,
  });
}

export async function getResumenStats() {
  try {
    // 1. Contamos cuántos socios hay en total
    const totalSocios = await prisma.socio.count({
      where: {
        activo: true,
      },
    });

    // 2. Por ahora, devolvemos el resto de valores fijos
    // para poder construir la UI sin errores
    return {
      totalSocios,
      pagosPendientes: 12, // Esto lo haremos real cuando toquemos la tabla Pagos
      proximoEvento: "Mañana",
      stockBajo: 5
    };
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    return { totalSocios: 0, pagosPendientes: 0, proximoEvento: "-", stockBajo: 0 };
  }
}