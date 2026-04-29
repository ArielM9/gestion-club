"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { 
  getYear, 
  getYearTemporada, 
  getCategoriaPorAnoNacimiento, 
  getAnosNacimientoCategoria, 
  getSexoCategoria, 
  getCategoriaAnterior,
  calcularEdad 
} from "@/lib/utils/categorias";

export async function getCategorias() {
  return await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: {
      equipos: {
        include: {
          temporada: true,
          categoria: true,
          inscripciones: {
            include: { socio: true }
          }
        }
      },
      socios: {
        select: { id: true, nombre: true, apellidos: true, dni: true }
      }
    },
  });
}

export async function getCategoriaById(id: string) {
  return await prisma.categoria.findUnique({
    where: { id },
    include: {
      equipos: {
        include: {
          temporada: true,
          categoria: true,
          inscripciones: {
            include: { socio: true }
          }
        }
      },
      socios: true
    },
  });
}

// === EQUIPOS ===

export async function getEquiposPorTemporada(temporadaId: string) {
  return await prisma.equipo.findMany({
    where: { temporadaId },
    include: {
      categoria: true,
      inscripciones: {
        include: { socio: true }
      }
    },
    orderBy: { categoria: { nombre: "asc" } },
  });
}

export async function getEquipoById(id: string) {
  return await prisma.equipo.findUnique({
    where: { id },
    include: {
      categoria: true,
      temporada: true,
      inscripciones: {
        include: { socio: true }
      }
    },
  });
}

export async function getEquiposPorCategoria(categoriaId: string, temporadaId: string) {
  return await prisma.equipo.findMany({
    where: { categoriaId, temporadaId },
    orderBy: { nombre: "asc" },
  });
}

export async function inscribirJugadorEnTemporadaAction(
  socioId: string,
  migrarDeuda: boolean = false
) {
  try {
    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true }
    });
    
    if (!temporadaActiva) {
      return { error: "No hay temporada activa", tieneDeuda: false };
    }

    const socio = await prisma.socio.findUnique({
      where: { id: socioId }
    });

    if (!socio) {
      return { error: "Socio no encontrado", tieneDeuda: false };
    }

    const tieneDeuda = socio.deudaPendiente > 0;

    if (tieneDeuda && !migrarDeuda) {
      return { 
        error: "El jugador tiene deuda pendiente", 
        tieneDeuda: true,
        deuda: socio.deudaPendiente
      };
    }

    if (tieneDeuda && migrarDeuda) {
      await prisma.cargo.create({
        data: {
          monto: socio.deudaPendiente,
          concepto: `Deuda temporada ${temporadaActiva.nombre}`,
          socioId: socio.id,
          temporadaId: temporadaActiva.id
        }
      });

      await prisma.socio.update({
        where: { id: socioId },
        data: { deudaPendiente: 0 }
      });
    }

    const anoTemporada = getYearTemporada(temporadaActiva.fechaInicio);
    const categoriaNombre = getCategoriaPorAnoNacimiento(
      getYear(socio.fechaNacimiento),
      anoTemporada,
      socio.sexo
    );

    if (!categoriaNombre) {
      return { error: "No se pudo determinar la categoría", tieneDeuda: false };
    }

    const categoria = await prisma.categoria.findFirst({
      where: { nombre: categoriaNombre }
    });

    if (!categoria) {
      return { error: "Categoría no encontrada", tieneDeuda: false };
    }

    const inscripcionExistente = await prisma.inscripcion.findFirst({
      where: {
        socioId: socio.id,
        temporadaId: temporadaActiva.id
      }
    });

    if (inscripcionExistente) {
      return { error: "El jugador ya está inscrito en esta temporada", tieneDeuda: false };
    }

    await prisma.inscripcion.create({
      data: {
        socioId: socio.id,
        temporadaId: temporadaActiva.id,
        categoriaId: categoria.id,
        equipoId: null,
        federado: false
      }
    });

    // Actualizar categoriaId del socio con la categoría calculada
    await prisma.socio.update({
      where: { id: socio.id },
      data: { categoriaId: categoria.id }
    });

    // Generar cargo de cuota si es categoría senior (M20, M22, Senior Masculino, Senior Femenino)
    const esSenior = ["M20", "M22", "Senior Masculino", "Senior Femenino"].includes(categoriaNombre);
    
    if (esSenior) {
      const precioTemporada = await prisma.temporadaCategoria.findFirst({
        where: {
          temporadaId: temporadaActiva.id,
          categoriaId: categoria.id,
        },
      });

      const montoCargo = precioTemporada?.costeCuota ?? 0;
      await prisma.cargo.create({
        data: {
          monto: montoCargo,
          concepto: `Cuota club - ${categoriaNombre}`,
          socioId: socio.id,
          temporadaId: temporadaActiva.id,
        },
      });
    }

    revalidatePath("/jugadores");
    revalidatePath("/jugadores/[id]");
    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
    revalidatePath("/categorias/[categoryId]");
    revalidatePath("/contabilidad");
    
    return { success: true, tieneDeuda: false };
  } catch (error) {
    console.error("ERROR_INSCRIBIR_JUGADOR:", error);
    return { error: "Error al inscribir jugador", tieneDeuda: false };
  }
}

export async function actualizarFederadoJugadorAction(inscripcionId: string, federado: boolean) {
  try {
    await prisma.inscripcion.update({
      where: { id: inscripcionId },
      data: { federado },
    });
    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
    revalidatePath("/categorias/[categoryId]");
    return { success: true };
  } catch (error) {
    console.error("ERROR_ACTUALIZAR_FEDERADO:", error);
    return { error: "Error al actualizar" };
  }
}

export async function getJugadoresSinEquipoAction(temporadaId: string) {
  try {
    const inscripcionesEnTemporada = await prisma.inscripcion.findMany({
      where: { temporadaId },
      select: { socioId: true },
    });
    
    const idsInscritos: string[] = [];
    for (const insc of inscripcionesEnTemporada) {
      idsInscritos.push(insc.socioId);
    }

    const jugadores = await prisma.socio.findMany({
      where: {
        id: { notIn: idsInscritos },
      },
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
    });

    return { success: true, data: jugadores };
  } catch (error) {
    console.error("ERROR_GET_JUGADORES_SIN_EQUIPO:", error);
    return { error: "Error al buscar jugadores" };
  }
}

export async function inscribirJugadorAction(equipoId: string, socioId: string) {
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: equipoId },
      include: { temporada: true },
    });

    if (!equipo) {
      return { error: "Equipo no encontrado" };
    }

    const yaInscrito = await prisma.inscripcion.findFirst({
      where: {
        socioId,
        temporadaId: equipo.temporadaId,
      },
    });

    if (yaInscrito) {
      return { error: "El jugador ya está inscrito en esta temporada" };
    }

    await prisma.inscripcion.create({
      data: {
        socioId,
        equipoId,
        categoriaId: equipo.categoriaId,
        temporadaId: equipo.temporadaId,
        federado: false,
      },
    });

    // Actualizar categoriaId del socio con la categoría del equipo
    await prisma.socio.update({
      where: { id: socioId },
      data: { categoriaId: equipo.categoriaId }
    });

    // Generar cargo de cuota si es categoría senior (M20, M22, Senior Masculino, Senior Femenino)
    const categoria = await prisma.categoria.findUnique({
      where: { id: equipo.categoriaId },
    });
    
    const esSenior = categoria && ["M20", "M22", "Senior Masculino", "Senior Femenino"].includes(categoria.nombre);
    
    if (esSenior) {
      const precioTemporada = await prisma.temporadaCategoria.findFirst({
        where: {
          temporadaId: equipo.temporadaId,
          categoriaId: equipo.categoriaId,
        },
      });

      const montoCargo = precioTemporada?.costeCuota ?? 0;
      await prisma.cargo.create({
        data: {
          monto: montoCargo,
          concepto: `Cuota club - ${categoria.nombre}`,
          socioId,
          temporadaId: equipo.temporadaId,
        },
      });
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
    revalidatePath("/categorias/[categoryId]");
    revalidatePath("/contabilidad");
    return { success: true };
  } catch (error) {
    console.error("ERROR_INSCRIBIR_JUGADOR:", error);
    return { error: "Error al inscribir jugador" };
  }
}

export async function desinscribirJugadorAction(inscripcionId: string) {
  try {
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id: inscripcionId },
      include: { equipo: true },
    });

    if (!inscripcion) {
      return { error: "Inscripción no encontrada" };
    }

    await prisma.inscripcion.delete({
      where: { id: inscripcionId },
    });

    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
    revalidatePath("/categorias/[categoryId]");
    return { success: true };
  } catch (error) {
    console.error("ERROR_DESINSCRIBIR_JUGADOR:", error);
    return { error: "Error al desinscribir jugador" };
  }
}

export async function getJugadoresPorCategoriaAction(categoriaId: string, temporadaId: string) {
  try {
    const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
    if (!categoria) return { error: "Categoría no encontrada" };

    const temporada = await prisma.temporada.findUnique({ where: { id: temporadaId } });
    if (!temporada) return { error: "Temporada no encontrada" };

    const anoTemporada = getYearTemporada(temporada.fechaInicio);
    const anosCategoria = getAnosNacimientoCategoria(categoria.nombre, anoTemporada);
    const sexoRequerido = getSexoCategoria(categoria.nombre);

    if (!anosCategoria) return { error: "Categoría no válida para cálculo" };

    const todosSocios = await prisma.socio.findMany({
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
    });

    const esSenior = categoria.nombre === "Senior Masculino" || categoria.nombre === "Senior Femenino";

    const sociosFiltrados = todosSocios.filter(socio => {
      if (!socio.fechaNacimiento) return false;
      
      const anoNacimiento = getYear(socio.fechaNacimiento);
      
      // Para Senior, aceptar cualquier año <= ano2 (todos los mayores de edad)
      if (esSenior) {
        if (anoNacimiento > anosCategoria!.ano2) return false;
      } else {
        // Para categorías M, solo aceptar los dos años específicos
        if (anoNacimiento !== anosCategoria!.ano1 && anoNacimiento !== anosCategoria!.ano2) {
          return false;
        }
      }
      
      if (sexoRequerido) {
        if (!socio.sexo) return false;
        if (sexoRequerido === "M" && socio.sexo !== "M") return false;
        if (sexoRequerido === "F" && socio.sexo !== "F") return false;
      }
      
      return true;
    });

    const idsSociosFiltrados = sociosFiltrados.map(s => s.id);

    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        temporadaId,
        equipo: { categoriaId },
      },
    });

    const jugadores = sociosFiltrados.map(socio => {
      const inscripcion = inscripciones.find(i => i.socioId === socio.id);
      return {
        socio: {
          id: socio.id,
          nombre: socio.nombre,
          apellidos: socio.apellidos,
          dni: socio.dni,
          sexo: socio.sexo,
          fechaNacimiento: socio.fechaNacimiento,
          edad: socio.fechaNacimiento ? calcularEdad(socio.fechaNacimiento) : null,
        },
        inscripcionId: inscripcion?.id || null,
        federado: inscripcion?.federado || false,
        inscrito: !!inscripcion,
        equipoId: inscripcion?.equipoId || null,
      };
    });

    return { success: true, data: jugadores };
  } catch (error) {
    console.error("ERROR_GET_JUGADORES_POR_CATEGORIA:", error);
    return { error: "Error al obtener jugadores" };
  }
}

interface JugadorEquipoData {
  socio: {
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    sexo: string | null;
    fechaNacimiento: Date | null;
    edad: number | null;
  };
  inscripcionId: string | null;
  federado: boolean;
  inscribed: boolean;
  equipoId: string | null;
  esAno2: boolean;
}

export async function getJugadoresParaEquipoAction(categoriaId: string, temporadaId: string) {
  try {
    const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
    if (!categoria) return { error: "Categoría no encontrada" };

    const temporada = await prisma.temporada.findUnique({ where: { id: temporadaId } });
    if (!temporada) return { error: "Temporada no encontrada" };

    const anoTemporada = getYearTemporada(temporada.fechaInicio);
    const anosCategoria = getAnosNacimientoCategoria(categoria.nombre, anoTemporada);
    const sexoRequerido = getSexoCategoria(categoria.nombre);

    if (!anosCategoria) return { error: "Categoría no válida para cálculo" };

    const todosSocios = await prisma.socio.findMany({
      orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
    });

    const esSenior = categoria.nombre === "Senior Masculino" || categoria.nombre === "Senior Femenino";
    
    const jugadoresAno1 = todosSocios.filter(socio => {
      if (!socio.fechaNacimiento) return false;
      const anoNacimiento = getYear(socio.fechaNacimiento);
      
      // Para Senior, aceptar cualquier año <= ano2 (todos los mayores de edad)
      if (esSenior) {
        if (anoNacimiento > anosCategoria!.ano2) return false;
      } else {
        // Para categorías M, solo aceptar los dos años específicos
        if (anoNacimiento !== anosCategoria!.ano1 && anoNacimiento !== anosCategoria!.ano2) {
          return false;
        }
      }
      
      if (sexoRequerido) {
        if (!socio.sexo) return false;
        if (sexoRequerido === "M" && socio.sexo !== "M") return false;
        if (sexoRequerido === "F" && socio.sexo !== "F") return false;
      }
      return true;
    });

    const categoriaAnteriorNombre = getCategoriaAnterior(categoria.nombre);
    let anosCategoriaAnterior: { ano1: number; ano2: number } | null = null;
    
    if (categoriaAnteriorNombre) {
      anosCategoriaAnterior = getAnosNacimientoCategoria(categoriaAnteriorNombre, anoTemporada);
    }

    const sexoAnterior = categoriaAnteriorNombre ? getSexoCategoria(categoriaAnteriorNombre) : null;

    const jugadoresAno2 = anosCategoriaAnterior ? todosSocios.filter(socio => {
      if (!socio.fechaNacimiento) return false;
      const anoNacimiento = getYear(socio.fechaNacimiento);
      if (anoNacimiento !== anosCategoriaAnterior!.ano1 && anoNacimiento !== anosCategoriaAnterior!.ano2) {
        return false;
      }
      if (sexoAnterior) {
        if (!socio.sexo) return false;
        if (sexoAnterior === "M" && socio.sexo !== "M") return false;
        if (sexoAnterior === "F" && socio.sexo !== "F") return false;
      }
      return true;
    }) : [];

    const todosIds = [...jugadoresAno1, ...jugadoresAno2].map(s => s.id);

    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        temporadaId,
        socioId: { in: todosIds },
      },
    });

    const result: JugadorEquipoData[] = [
      ...jugadoresAno1.map(socio => {
        const inscripcion = inscripciones.find(i => i.socioId === socio.id);
        const esFederado = !!(inscripcion?.federado && inscripcion?.equipoId !== null);
        return {
          socio: {
            id: socio.id,
            nombre: socio.nombre,
            apellidos: socio.apellidos,
            dni: socio.dni,
            sexo: socio.sexo,
            fechaNacimiento: socio.fechaNacimiento,
            edad: socio.fechaNacimiento ? calcularEdad(socio.fechaNacimiento) : null,
          },
          inscripcionId: inscripcion?.id || null,
          federado: esFederado,
          inscribed: false,
          equipoId: inscripcion?.equipoId || null,
          esAno2: false,
        };
      }),
      ...jugadoresAno2.map(socio => {
        const inscripcion = inscripciones.find(i => i.socioId === socio.id);
        const esFederado = !!(inscripcion?.federado && inscripcion?.equipoId !== null);
        return {
          socio: {
            id: socio.id,
            nombre: socio.nombre,
            apellidos: socio.apellidos,
            dni: socio.dni,
            sexo: socio.sexo,
            fechaNacimiento: socio.fechaNacimiento,
            edad: socio.fechaNacimiento ? calcularEdad(socio.fechaNacimiento) : null,
          },
          inscripcionId: inscripcion?.id || null,
          federado: esFederado,
          inscribed: false,
          equipoId: inscripcion?.equipoId || null,
          esAno2: true,
        };
      }),
    ];

    return { 
      success: true, 
      data: result,
      categoriaAnterior: categoriaAnteriorNombre
    };
  } catch (error) {
    console.error("ERROR_GET_JUGADORES_PARA_EQUIPO:", error);
    return { error: "Error al obtener jugadores" };
  }
}

export async function togglearInscripcionAction(
  equipoId: string,
  socioId: string,
  federado: boolean
) {
  try {
    const equipo = await prisma.equipo.findUnique({
      where: { id: equipoId },
      include: { temporada: true, categoria: true },
    });
    if (!equipo) return { error: "Equipo no encontrado" };

    const inscripcionExistente = await prisma.inscripcion.findFirst({
      where: {
        socioId,
        temporadaId: equipo.temporadaId,
      },
    });

    if (inscripcionExistente) {
      // El jugador ya está inscrito, actualizar estado federado
      const estadoAnterior = inscripcionExistente.federado;
      
      await prisma.inscripcion.update({
        where: { id: inscripcionExistente.id },
        data: { federado },
      });

      // Manejar cargo de ficha federativa
      const categoria = await prisma.categoria.findUnique({
        where: { id: equipo.categoriaId },
      });

if (federado && !estadoAnterior) {
        // Cambió a federado → crear cargo de ficha
        const precioTemporada = await prisma.temporadaCategoria.findFirst({
          where: {
            temporadaId: equipo.temporadaId,
            categoriaId: equipo.categoriaId,
          },
        });

        const montoCargo = precioTemporada?.costeFicha ?? 0;
        await prisma.cargo.create({
          data: {
            monto: montoCargo,
            concepto: `Ficha federativa - ${categoria?.nombre || "Unknown"}`,
            socioId,
            temporadaId: equipo.temporadaId,
          },
        });
      } else if (!federado && estadoAnterior) {
        // Cambió a no federado → eliminar cargo de ficha
        await prisma.cargo.deleteMany({
          where: {
            socioId,
            temporadaId: equipo.temporadaId,
            concepto: { startsWith: "Ficha federativa" },
          },
        });
      }

      revalidatePath("/admin/categorias");
      revalidatePath("/categorias");
      revalidatePath("/categorias/[categoryId]");
      revalidatePath("/contabilidad");
      return { success: true, federado };
    } else {
      // El jugador no está inscrito, crear inscripción
      await prisma.inscripcion.create({
        data: {
          socioId,
          equipoId,
          categoriaId: equipo.categoriaId,
          temporadaId: equipo.temporadaId,
          federado,
        },
      });

      // Si federado, crear cargo de ficha
      if (federado) {
        const categoria = await prisma.categoria.findUnique({
          where: { id: equipo.categoriaId },
        });

        const precioTemporada = await prisma.temporadaCategoria.findFirst({
          where: {
            temporadaId: equipo.temporadaId,
            categoriaId: equipo.categoriaId,
          },
        });

        const montoCargo = precioTemporada?.costeFicha ?? 0;
        await prisma.cargo.create({
          data: {
            monto: montoCargo,
            concepto: `Ficha federativa - ${categoria?.nombre || "Unknown"}`,
            socioId,
            temporadaId: equipo.temporadaId,
          },
        });
      }
    }

    revalidatePath("/admin/categorias");
    revalidatePath("/categorias");
    revalidatePath("/categorias/[categoryId]");
    revalidatePath("/contabilidad");
    return { success: true, federado };
  } catch (error) {
    console.error("ERROR_TOGGLE_INSCRIPCION:", error);
    return { error: "Error al actualizar inscripción" };
  }
}

export async function getTemporadas() {
  const temporadas = await prisma.temporada.findMany({
    orderBy: { fechaInicio: "desc" },
    include: {
      equipos: { include: { categoria: true } },
      precios: { include: { categoria: true } },
      _count: {
        select: {
          inscripciones: true,
          documentos: true,
        },
      },
    },
  });
  return temporadas;
}

export async function getTemporadaActiva() {
  return await prisma.temporada.findFirst({
    where: { activa: true },
    include: {
      equipos: { include: { categoria: true } },
      precios: { include: { categoria: true } },
      _count: {
        select: {
          inscripciones: true,
          documentos: true,
        },
      },
    },
  });
}

export async function getTemporadaById(id: string) {
  return await prisma.temporada.findUnique({
    where: { id },
    include: {
      equipos: { include: { categoria: true } },
      precios: { include: { categoria: true } },
      abonos: { include: { socio: true } },
      cargos: { include: { socio: true } },
      gastos: true,
      ingresos: true,
    },
  });
}

export async function crearTemporadaAction(data: {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}) {
  try {
    // Verificar si ya hay temporada activa
    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true },
    });

    if (temporadaActiva) {
      return { error: "Ya hay una temporada activa. Ciérrala antes de crear una nueva." };
    }

    // Obtener categorías existentes
    const categorias = await prisma.categoria.findMany();

    // Crear temporada
    const temporada = await prisma.temporada.create({
      data: {
        nombre: data.nombre,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        activa: true,
        // Crear precios por categoría (null inicialmente)
        precios: {
          create: categorias.map((cat) => ({
            categoriaId: cat.id,
            costeCuota: null,
            costeFicha: null,
            incluyeRopa: false,
          })),
        },
        // Los equipos se crean manualmente desde el panel de equipos
      },
      include: { precios: true },
    });

    revalidatePath("/admin/temporadas");
    revalidatePath("/historico");
    return { success: true, temporada };
  } catch (error) {
    console.error("ERROR_CREAR_TEMPORADA:", error);
    return { error: "Error al crear la temporada" };
  }
}

export async function actualizarPreciosTemporadaAction(
  temporadaId: string,
  precios: { categoriaId: string; costeCuota: number | null; costeFicha: number | null; incluyeRopa: boolean }[]
) {
  try {
    // Obtener precios actuales antes de actualizar
    const preciosActuales = await prisma.temporadaCategoria.findMany({
      where: { temporadaId },
      include: { categoria: true },
    });

    const preciosMap = new Map(preciosActuales.map(p => [p.categoriaId, p]));
    const categoriaIdToNombre = new Map(preciosActuales.map(p => [p.categoriaId, p.categoria.nombre]));

    let cargosActualizados = 0;

    for (const p of precios) {
      const precioActual = preciosMap.get(p.categoriaId);
      const nombreCategoria = categoriaIdToNombre.get(p.categoriaId) || "";

      // Actualizar precio en TemporadaCategoria
      await prisma.temporadaCategoria.upsert({
        where: {
          temporadaId_categoriaId: {
            temporadaId,
            categoriaId: p.categoriaId,
          },
        },
        update: {
          costeCuota: p.costeCuota,
          costeFicha: p.costeFicha,
          incluyeRopa: p.incluyeRopa,
        },
        create: {
          temporadaId,
          categoriaId: p.categoriaId,
          costeCuota: p.costeCuota,
          costeFicha: p.costeFicha,
          incluyeRopa: p.incluyeRopa,
        },
      });

      // Si el precio de cuota cambió, actualizar cargos existentes
      if (precioActual && precioActual.costeCuota !== null && p.costeCuota !== null && precioActual.costeCuota !== p.costeCuota) {
        const result = await prisma.cargo.updateMany({
          where: {
            temporadaId,
            concepto: { startsWith: `Cuota club - ${nombreCategoria}` },
          },
          data: { monto: p.costeCuota },
        });
        cargosActualizados += result.count;
      }

      // Si el precio de ficha cambió, actualizar cargos existentes
      if (precioActual && precioActual.costeFicha !== null && p.costeFicha !== null && precioActual.costeFicha !== p.costeFicha) {
        const result = await prisma.cargo.updateMany({
          where: {
            temporadaId,
            concepto: { startsWith: `Ficha federativa - ${nombreCategoria}` },
          },
          data: { monto: p.costeFicha },
        });
        cargosActualizados += result.count;
      }
    }

    revalidatePath("/admin/temporadas");
    revalidatePath("/contabilidad");
    revalidatePath("/jugadores");
    
    return { 
      success: true, 
      message: cargosActualizados > 0 
        ? `Precios actualizados. ${cargosActualizados} cargo(s) actualizado(s).`
        : "Precios actualizados correctamente."
    };
  } catch (error) {
    console.error("ERROR_ACTUALIZAR_PRECIOS:", error);
    return { error: "Error al actualizar los precios" };
  }
}

export async function corregirPrecioCategoriaAction(
  temporadaId: string,
  categoriaId: string,
  nuevoCoste: number,
  tipo: "cuota" | "ficha"
) {
  try {
    const precio = await prisma.temporadaCategoria.findFirst({
      where: { temporadaId, categoriaId },
    });

    if (!precio) return { error: "Precio no encontrado" };

    const updateData = tipo === "cuota" 
      ? { costeCuota: nuevoCoste }
      : { costeFicha: nuevoCoste };

    await prisma.temporadaCategoria.update({
      where: { id: precio.id },
      data: updateData,
    });

    const conceptoBuscar = tipo === "cuota" ? "Cuota club" : "Ficha federativa";

    const categoria = await prisma.categoria.findUnique({ where: { id: categoriaId } });
    const conceptoPattern = `${conceptoBuscar} - ${categoria?.nombre}`;

    const cargosActualizados = await prisma.cargo.updateMany({
      where: {
        temporadaId,
        concepto: { startsWith: conceptoPattern },
      },
      data: { monto: nuevoCoste },
    });

    revalidatePath("/admin/temporadas");
    revalidatePath("/contabilidad");
    revalidatePath("/jugadores");
    
    return { 
      success: true, 
      message: `Precio actualizado. ${cargosActualizados.count} cargo(s) corregido(s).`
    };
  } catch (error) {
    console.error("ERROR_CORREGIR_PRECIO:", error);
    return { error: "Error al corregir el precio" };
  }
}

export async function actualizarEquipoAction(equipoId: string, data: { federado: boolean; nombre?: string }) {
  try {
    await prisma.equipo.update({
      where: { id: equipoId },
      data: {
        federado: data.federado,
        ...(data.nombre && { nombre: data.nombre }),
      },
    });

    revalidatePath("/admin/temporadas");
    return { success: true };
  } catch (error) {
    console.error("ERROR_ACTUALIZAR_EQUIPO:", error);
    return { error: "Error al actualizar el equipo" };
  }
}

export async function crearEquipoAction(temporadaId: string, categoriaId: string, nombre: string, federado: boolean = true) {
  try {
    const equipo = await prisma.equipo.create({
      data: {
        nombre,
        temporadaId,
        categoriaId,
        federado,
        cerrado: false,
      },
    });

    revalidatePath("/admin/temporadas");
    return { success: true, equipo };
  } catch (error: any) {
    console.error("ERROR_CREAR_EQUIPO:", error);
    if (error.code === 'P2002') {
      return { error: "Ya existe un equipo con ese nombre en esta temporada" };
    }
    return { error: "Error al crear el equipo" };
  }
}

export async function cerrarTemporadaAction(temporadaId: string, nuevaTemporadaId?: string) {
  try {
    const temporada = await prisma.temporada.findUnique({
      where: { id: temporadaId },
      include: {
        precios: true,
        equipos: true,
        inscripciones: { include: { socio: true } },
        cargos: true,
        abonos: { where: { estado: "APROBADO" } },
      },
    });

    if (!temporada) return { error: "Temporada no encontrada" };

    // Calcular deudas por socio
    const deudasPorSocio: Record<string, number> = {};
    
    for (const inscripcion of temporada.inscripciones) {
      const socioId = inscripcion.socioId;
      const cargosSocio = temporada.cargos.filter((c) => c.socioId === socioId);
      const abonosSocio = temporada.abonos.filter((a) => a.socioId === socioId);
      
      const totalCargos = cargosSocio.reduce((acc, c) => acc + c.monto, 0);
      const totalAbonos = abonosSocio.reduce((acc, a) => acc + a.monto, 0);
      const deuda = totalCargos - totalAbonos;
      
      if (deuda > 0) {
        deudasPorSocio[socioId] = deuda;
      }
    }

    // Cerrar temporada actual
    await prisma.temporada.update({
      where: { id: temporadaId },
      data: {
        activa: false,
        fechaCierre: new Date(),
      },
    });

    // Cerrar equipos
    await prisma.equipo.updateMany({
      where: { temporadaId },
      data: { cerrado: true },
    });

    // Marcar todos los socios inscritos como inactivos y borrar su categoría
    const socioIds = [...new Set(temporada.inscripciones.map(i => i.socioId))];
    if (socioIds.length > 0) {
      await prisma.socio.updateMany({
        where: { id: { in: socioIds } },
        data: { 
          activo: false,
          categoriaId: null, // Se borrará para forzar recalcular al reinscribir
        },
      });
    }

    // Si hay nueva temporada, crear balance de apertura
    if (nuevaTemporadaId) {
      for (const [socioId, deuda] of Object.entries(deudasPorSocio)) {
        await prisma.cargo.create({
          data: {
            monto: deuda,
            concepto: `Saldo temporada anterior: ${temporada.nombre}`,
            socioId,
            temporadaId: nuevaTemporadaId,
          },
        });
      }
    }

    revalidatePath("/admin/temporadas");
    revalidatePath("/historico");
    revalidatePath("/jugadores");
    return { 
      success: true, 
      message: `Temporada cerrada. ${socioIds.length} socios marcados como inactivos. ${Object.keys(deudasPorSocio).length} socios con deuda transferida.`,
      deudasCount: Object.keys(deudasPorSocio).length,
    };
  } catch (error) {
    console.error("ERROR_CERRAR_TEMPORADA:", error);
    return { error: "Error al cerrar la temporada" };
  }
}

export async function getHistoricoTemporada(temporadaId: string) {
  return await prisma.temporada.findUnique({
    where: { id: temporadaId },
    include: {
      precios: { include: { categoria: true } },
      equipos: { 
        include: { 
          categoria: true,
          inscripciones: { include: { socio: true } },
        } 
      },
      inscripciones: { 
        include: { 
          socio: true,
          equipo: true,
        } 
      },
      cargos: { include: { socio: true } },
      abonos: { include: { socio: true } },
      gastos: true,
      ingresos: true,
      documentos: { include: { socio: true } },
    },
  });
}

export async function generarCargosTemporadaAction(temporadaId: string) {
  try {
    const temporada = await prisma.temporada.findUnique({
      where: { id: temporadaId },
      include: {
        precios: { include: { categoria: true } },
        equipos: { include: { categoria: true } },
        inscripciones: { 
          include: { 
            socio: true,
            equipo: { include: { categoria: true } },
          } 
        },
      },
    });

    if (!temporada) return { error: "Temporada no encontrada" };
    if (!temporada.activa) return { error: "La temporada no está activa" };

    // Verificar que hay precios de cuota configurados
    const preciosConCuota = temporada.precios.filter(p => p.costeCuota !== null);
    if (preciosConCuota.length === 0) {
      return { error: "Configure los precios antes de generar los cargos" };
    }

    // Obtener equipos federados
    const equiposFederados = new Set(temporada.equipos.filter(e => e.federado).map(e => e.id));

    let cuotasCreadas = 0;
    let fichasCreadas = 0;
    let errores: string[] = [];

    for (const inscripcion of temporada.inscripciones) {
      // Obtener categoriaId - si está federado la tiene del equipo, si no la calculamos
      let categoriaId: string;
      let nombreCategoria: string;
      
      if (inscripcion.equipo) {
        categoriaId = inscripcion.equipo.categoriaId;
        nombreCategoria = inscripcion.equipo.categoria.nombre;
      } else {
        // Jugador inscrito pero no federado - calcular categoría
        const anoTemporada = getYearTemporada(temporada.fechaInicio);
        const catNombre = getCategoriaPorAnoNacimiento(
          getYear(inscripcion.socio.fechaNacimiento),
          anoTemporada,
          inscripcion.socio.sexo
        );
        const cat = temporada.precios.find(p => p.categoria?.nombre === catNombre);
        if (!cat) continue;
        categoriaId = cat.categoriaId;
        nombreCategoria = catNombre || "";
      }

      // Obtener precio de la categoría
      const precio = temporada.precios.find(p => p.categoriaId === categoriaId);
      
      // 1. CREAR CARGO DE CUOTA (siempre)
      // Verificar si ya tiene cargo de cuota
      const yaTieneCuota = await prisma.cargo.findFirst({
        where: {
          socioId: inscripcion.socioId,
          temporadaId: temporada.id,
          concepto: { startsWith: "Cuota club" },
        },
      });

      if (!yaTieneCuota && precio) {
        await prisma.cargo.create({
          data: {
            monto: precio.costeCuota ?? 0,
            concepto: `Cuota club - ${nombreCategoria}`,
            socioId: inscripcion.socioId,
            temporadaId: temporada.id,
          },
        });
        cuotasCreadas++;
      }

      // 2. CREAR CARGO DE FICHA FEDERATIVA
      // Solo si: equipo federado Y jugador federado
      const equipoId = inscripcion.equipoId || null;
      const equipoFederado = equipoId ? equiposFederados.has(equipoId) : false;
      
      if (equipoFederado && inscripcion.federado && precio) {
        // Verificar si ya tiene cargo de ficha
        const yaTieneFicha = await prisma.cargo.findFirst({
          where: {
            socioId: inscripcion.socioId,
            temporadaId: temporada.id,
            concepto: { startsWith: "Ficha federativa" },
          },
        });

if (!yaTieneFicha) {
          await prisma.cargo.create({
            data: {
              monto: precio.costeFicha ?? 0,
              concepto: `Ficha federativa - ${nombreCategoria}`,
              socioId: inscripcion.socioId,
              temporadaId: temporada.id,
            },
          });
          fichasCreadas++;
        }
      }
    }

    revalidatePath("/admin/temporadas");
    revalidatePath("/contabilidad");
    
    return { 
      success: true, 
      message: `${cuotasCreadas} cuotas generadas, ${fichasCreadas} fichas federativas generadas` };
  } catch (error) {
    console.error("ERROR_GENERAR_CARGOS:", error);
    return { error: "Error al generar los cargos" };
  }
}
