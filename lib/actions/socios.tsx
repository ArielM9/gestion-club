"use server";

import prisma from "@/lib/prisma";
import { SocioSchema, SocioUpdateSchema } from "@/lib/validations/socio";
import { revalidatePath } from "next/cache";
import { getCategoriaPorAnoNacimiento, getYearTemporada } from "@/lib/utils/categorias";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireRole } from "@/lib/server/auth-guard";

const ROLES_PERMITIDOS = ["ADMIN", "CONTABILIDAD", "DIRECTIVA"];

const validarDNI = (dni: string) => {
  // Expresión regular para DNI (8 números + letra) o NIE (Letra + 7 números + letra)
  const regex = /^[0-9XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  return regex.test(dni);
};

export async function crearSocioAction(data: any) {
  await requireRole(["ADMIN", "CONTABILIDAD", "DIRECTIVA"]);
  // Validamos con el esquema original que ya te funcionaba
  const result = SocioSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos de formulario inválidos" };
  }

  try {
    // Obtener temporada activa
    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true }
    });

    // Crear el socio
    let categoriaId: string | null = null;
    
    // Si hay temporada activa, calcular categoría
    if (temporadaActiva && result.data.fechaNacimiento) {
      const anoTemporada = getYearTemporada(temporadaActiva.fechaInicio);
      const anoNacimiento = new Date(result.data.fechaNacimiento).getFullYear();
      const nombreCategoria = getCategoriaPorAnoNacimiento(anoNacimiento, anoTemporada, result.data.sexo || "M");

      if (nombreCategoria) {
        const categoria = await prisma.categoria.findFirst({
          where: { nombre: nombreCategoria }
        });
        categoriaId = categoria?.id || null;
      }
    }

    const socio = await prisma.socio.create({
      data: {
        nombre: result.data.nombre,
        apellidos: result.data.apellidos,
        dni: result.data.dni,
        fechaNacimiento: new Date(result.data.fechaNacimiento),
        nacionalidad: result.data.nacionalidad,
        fotoUrl: result.data.fotoUrl || null,
        email: result.data.email || null,
        telefono: result.data.telefono || null,
        direccion: result.data.direccion || null,
        codigoPostal: result.data.codigoPostal || null,
        localidad: result.data.localidad || null,
        urlDniFrontal: result.data.urlDniFrontal || null,
        cuentaBancaria: result.data.cuentaBancaria || null,
        nombreTutor: result.data.nombreTutor || null,
        dniTutor: result.data.dniTutor || null,
        telefonoTutor: result.data.telefonoTutor || null,
        observaciones: result.data.observaciones || null,
        tallaRopa: result.data.tallaRopa || null,
        sexo: result.data.sexo || "M",
        activo: true,
        categoriaId: categoriaId,
      },
    });

    revalidatePath("/jugadores");
    revalidatePath("/categorias");
    return { success: true };
  } catch (error: any) {
    console.error("ERROR_CREAR_SOCIO:", error);
    if (error.code === 'P2002') return { error: "Este DNI ya está registrado" };
    return { error: "Error de base de datos" };
  }
}

export async function actualizarSocioAction(id: string, data: unknown) {
  await requireRole(["ADMIN", "CONTABILIDAD", "DIRECTIVA"]);

  // Validación con Zod: SocioUpdateSchema es un allowlist de campos editables.
  // Zod strippea claves desconocidas (id, activo, createdAt, cargos, etc.),
  // por lo que NUNCA llegan a Prisma aunque el cliente intente forzarlas
  // (mass assignment). Solo `result.data` se usa para construir el update.
  const result = SocioUpdateSchema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return { error: firstIssue?.message ?? "Datos de formulario inválidos" };
  }

  const v = result.data;

  try {
    // Payload PATCH: solo incluimos campos presentes y validados, con
    // transformaciones (uppercase DNI, parseo de fecha) y coerción a null
    // para strings opcionales vacíos. `any` está acotado por Zod arriba.
    const updateData: Record<string, unknown> = {};

    if (v.nombre !== undefined) updateData.nombre = v.nombre;
    if (v.apellidos !== undefined) updateData.apellidos = v.apellidos;
    if (v.mote !== undefined) updateData.mote = v.mote || null;
    if (v.dni !== undefined) updateData.dni = v.dni.trim().toUpperCase();
    if (v.sexo !== undefined) updateData.sexo = v.sexo;
    if (v.fechaNacimiento !== undefined) {
      updateData.fechaNacimiento = v.fechaNacimiento
        ? new Date(v.fechaNacimiento as string | Date)
        : null;
    }
    if (v.nacionalidad !== undefined) updateData.nacionalidad = v.nacionalidad;
    if (v.email !== undefined) updateData.email = v.email || null;
    if (v.telefono !== undefined) updateData.telefono = v.telefono || null;
    if (v.direccion !== undefined) updateData.direccion = v.direccion || null;
    if (v.codigoPostal !== undefined) updateData.codigoPostal = v.codigoPostal || null;
    if (v.localidad !== undefined) updateData.localidad = v.localidad || null;
    if (v.fotoUrl !== undefined) updateData.fotoUrl = v.fotoUrl || null;
    if (v.urlDniFrontal !== undefined) updateData.urlDniFrontal = v.urlDniFrontal || null;
    if (v.cuentaBancaria !== undefined) updateData.cuentaBancaria = v.cuentaBancaria || null;
    if (v.nombreTutor !== undefined) updateData.nombreTutor = v.nombreTutor || null;
    if (v.dniTutor !== undefined) {
      updateData.dniTutor = v.dniTutor ? v.dniTutor.trim().toUpperCase() : null;
    }
    if (v.telefonoTutor !== undefined) updateData.telefonoTutor = v.telefonoTutor || null;
    if (v.tallaRopa !== undefined) updateData.tallaRopa = v.tallaRopa || null;
    if (v.observaciones !== undefined) updateData.observaciones = v.observaciones || null;
    if (v.categoriaId !== undefined) updateData.categoriaId = v.categoriaId || null;
    if (v.rgpdFirmado !== undefined) updateData.rgpdFirmado = v.rgpdFirmado;
    if (v.declaracionResponsable !== undefined) updateData.declaracionResponsable = v.declaracionResponsable;
    if (v.exoneracionResponsabilidad !== undefined) updateData.exoneracionResponsabilidad = v.exoneracionResponsabilidad;
    if (v.declaracionExtranjera !== undefined) updateData.declaracionExtranjera = v.declaracionExtranjera;

    const socio = await prisma.socio.update({
      where: { id },
      data: updateData as Parameters<typeof prisma.socio.update>[0]["data"],
    });

    revalidatePath("/jugadores");
    revalidatePath(`/jugadores/${id}`);

    return { success: true, socio };
  } catch (error: any) {
    console.error("ERROR_ACTUALIZAR_SOCIO:", error);
    if (error.code === 'P2002') return { error: "Ese DNI ya existe" };
    return { error: "Error al actualizar" };
  }
}

export async function getSociosInscritosEnTemporadaActiva() {
  try {
    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true }
    });

    if (!temporadaActiva) return [];

    const inscripciones = await prisma.inscripcion.findMany({
      where: { temporadaId: temporadaActiva.id },
      select: { socioId: true }
    });

    const socioIds = [...new Set(inscripciones.map((i) => i.socioId))];

    if (socioIds.length === 0) return [];

    const socios = await prisma.socio.findMany({
      where: { id: { in: socioIds } },
      include: { categoria: true },
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }]
    });

    return socios;
  } catch (error) {
    console.error("ERROR_GET_SOCIOS_INSCRITOS:", error);
    return [];
  }
}

export async function getTodosLosSocios(temporadaActiva?: boolean) {
  try {
    if (temporadaActiva) {
      return await getSociosInscritosEnTemporadaActiva();
    }

    // Original behavior - all active socios
    const socios = await prisma.socio.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        dni: true,
      },
      orderBy: { nombre: 'asc' }
    });
    return socios.map(s => ({
      ...s,
      nombreCompleto: `${s.nombre} ${s.apellidos}`
    }));
  } catch (error) {
    console.error("ERROR_GET_SOCIOS:", error);
    return [];
  }
}

export async function togglearFederadoAction(socioId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role || "COLABORADOR";
    
    if (!ROLES_PERMITIDOS.includes(userRole)) {
      return { error: "No tienes permisos para cambiar el estado de federado. Contacta con un administrador." };
    }
    
    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true },
    });

    if (!temporadaActiva) {
      return { error: "No hay temporada activa" };
    }

    const inscripcion = await prisma.inscripcion.findFirst({
      where: {
        socioId,
        temporadaId: temporadaActiva.id,
      },
      include: { categoria: true },
    });

    if (!inscripcion) {
      return { error: "El jugador no tiene inscripción en la temporada activa" };
    }

    const nuevoEstado = !inscripcion.federado;

    if (nuevoEstado && inscripcion.categoriaId) {
      const yaTieneCargo = await prisma.cargo.findFirst({
        where: {
          socioId,
          temporadaId: temporadaActiva.id,
          concepto: { startsWith: "Ficha federativa" },
        },
      });

      if (!yaTieneCargo) {
        const precioCategoria = await prisma.temporadaCategoria.findFirst({
          where: {
            temporadaId: temporadaActiva.id,
            categoriaId: inscripcion.categoriaId,
          },
        });

        if (precioCategoria && precioCategoria.costeFicha !== null && precioCategoria.costeFicha > 0) {
          await prisma.cargo.create({
            data: {
              monto: precioCategoria.costeFicha,
              concepto: `Ficha federativa - ${inscripcion.categoria!.nombre}`,
              socioId,
              temporadaId: temporadaActiva.id,
            },
          });
        }
      }
    }

    if (!nuevoEstado) {
      await prisma.cargo.deleteMany({
        where: {
          socioId,
          temporadaId: temporadaActiva.id,
          concepto: { startsWith: "Ficha federativa" },
        },
      });
    }

    await prisma.inscripcion.update({
      where: { id: inscripcion.id },
      data: { federado: nuevoEstado },
    });

    revalidatePath("/jugadores");
    revalidatePath(`/jugadores/${socioId}`);
    revalidatePath("/equipos");
    revalidatePath("/contabilidad");

    return { success: true, federado: nuevoEstado };
  } catch (error) {
    console.error("ERROR_TOGGLE_FEDERADO:", error);
    return { error: "Error al actualizar estado de federación" };
  }
}

export async function eliminarCargoAction(cargoId: string, motivo: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role || "COLABORADOR";

    if (userRole !== "ADMIN" && userRole !== "CONTABILIDAD") {
      return { error: "Sin permisos para eliminar cargos" };
    }

    await prisma.cargo.delete({
      where: { id: cargoId }
    });
    
    revalidatePath("/jugadores");
    revalidatePath("/contabilidad");
    return { success: true, message: `Cargo eliminado: ${motivo}` };
  } catch (error: any) {
    console.error("ERROR_ELIMINAR_CARGO:", error);
    return { error: "Error al eliminar el cargo" };
  }
}

export async function eliminarAbonoAction(abonoId: string, motivo: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userRole = session?.user?.role || "COLABORADOR";

    if (userRole !== "ADMIN" && userRole !== "CONTABILIDAD") {
      return { error: "Sin permisos para eliminar abonos" };
    }

    await prisma.abono.delete({
      where: { id: abonoId }
    });
    
    revalidatePath("/jugadores");
    revalidatePath("/contabilidad");
    return { success: true, message: `Abono eliminado: ${motivo}` };
  } catch (error: any) {
    console.error("ERROR_ELIMINAR_ABONO:", error);
    return { error: "Error al eliminar el abono" };
  }
}

// Busca TODOS los socios (incluyendo inactivos/archivados) para el flujo de renovación.
// Devuelve un flag `inscrito` que indica si el socio ya está inscrito en la temporada activa,
// para que la UI pueda mostrar el botón "Renovar" solo en los que corresponda.
export async function buscarTodosLosSocios(query: string) {
  await requireRole(["ADMIN", "CONTABILIDAD", "DIRECTIVA"]);
  try {
    if (!query || query.length < 2) {
      return { success: true, data: [] as Array<{
        id: string;
        nombre: string;
        dni: string;
        inscrito: boolean;
      }> };
    }

    const socios = await prisma.socio.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: "insensitive" } },
          { apellidos: { contains: query, mode: "insensitive" } },
          { dni: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        dni: true,
      },
      take: 20,
      orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
    });

    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true },
      select: { id: true },
    });

    let inscritoIds: Set<string> = new Set();
    if (temporadaActiva) {
      const inscripciones = await prisma.inscripcion.findMany({
        where: { temporadaId: temporadaActiva.id },
        select: { socioId: true },
      });
      inscritoIds = new Set(inscripciones.map((i) => i.socioId));
    }

    const data = socios.map((s) => ({
      id: s.id,
      nombre: `${s.nombre} ${s.apellidos}`,
      dni: s.dni,
      inscrito: inscritoIds.has(s.id),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("ERROR_BUSCAR_TODOS_SOCIOS:", error);
    return { error: "Error al buscar socios" };
  }
}