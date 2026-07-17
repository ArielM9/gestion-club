"use server";

import prisma from "@/lib/prisma";
import { SocioSchema } from "@/lib/validations/socio";
import { revalidatePath } from "next/cache";
import { getCategoriaPorAnoNacimiento, getYearTemporada } from "@/lib/utils/categorias";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const ROLES_PERMITIDOS = ["ADMIN", "CONTABILIDAD", "DIRECTIVA"];

const validarDNI = (dni: string) => {
  // Expresión regular para DNI (8 números + letra) o NIE (Letra + 7 números + letra)
  const regex = /^[0-9XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
  return regex.test(dni);
};

export async function crearSocioAction(data: any) {
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

export async function actualizarSocioAction(id: string, data: any) {
  // VALIDACIÓN MANUAL (Sin Zod para evitar el error de 'overwrite keys')
  if (data.dni) {
    const dniLimpio = data.dni.trim().toUpperCase();

    // Bloqueo por longitud (Prevenir errores de tecleo)
    if (dniLimpio.length < 9 || dniLimpio.length > 10) {
      return { error: "El DNI/NIE debe tener entre 9 y 10 caracteres" };
    }

    if (!data.nombre || !data.apellidos) return { error: "Nombre y apellidos son obligatorios" };

    try {
      await prisma.socio.update({
        where: { id },
        data: {
          nombre: data.nombre,
          apellidos: data.apellidos,
          mote: data.mote || null,
          dni: data.dni.trim().toUpperCase(),
          fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined,
          nacionalidad: data.nacionalidad,
          fotoUrl: data.fotoUrl !== undefined ? (data.fotoUrl || null) : undefined,
          email: data.email || null,
          telefono: data.telefono || null,
          direccion: data.direccion || null,
          codigoPostal: data.codigoPostal || null,
          localidad: data.localidad || null,
          urlDniFrontal: data.urlDniFrontal || null,
          cuentaBancaria: data.cuentaBancaria || null,
          nombreTutor: data.nombreTutor || null,
          dniTutor: data.dniTutor || null,
          telefonoTutor: data.telefonoTutor || null,
          tallaRopa: data.tallaRopa || null,
          observaciones: data.observaciones || null,
          rgpdFirmado: data.rgpdFirmado ?? false,
          declaracionResponsable: data.declaracionResponsable ?? false,
          exoneracionResponsabilidad: data.exoneracionResponsabilidad ?? false,
          declaracionExtranjera: data.declaracionExtranjera ?? false,
          categoriaId: data.categoriaId,
        },
      });

      revalidatePath("/jugadores");
      revalidatePath(`/jugadores/${id}`);

      return { success: true };
    } catch (error: any) {
      console.error("ERROR_ACTUALIZAR_SOCIO:", error);
      if (error.code === 'P2002') return { error: "Ese DNI ya existe" };
      return { error: "Error al actualizar" };
    }
  }
}

export async function getTodosLosSocios() {
  try {
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