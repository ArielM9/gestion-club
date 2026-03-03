"use server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMovimientosGlobales(search: string = "", page: number = 1, tipoFiltro: string = "todos") {
  const temporada = await prisma.temporada.findFirst({ where: { activa: true } });
  if (!temporada) return { movimientos: [], resumen: null, totalPages: 0 };

  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const [abonos, externos, gastos] = await Promise.all([
    prisma.abono.findMany({ 
      where: { temporadaId: temporada.id }, 
      include: { socio: true },
      orderBy: { fecha: 'desc' } 
    }),
    prisma.ingresoExterno.findMany({ 
      where: { temporadaId: temporada.id }, 
      orderBy: { fecha: 'desc' } 
    }),
    prisma.gasto.findMany({ 
      where: { temporadaId: temporada.id }, 
      orderBy: { fecha: 'desc' } 
    })
  ]);

  // Unificamos para la tabla
  let movimientos = [
    ...abonos.map(a => ({ 
      id: a.id, 
      fecha: a.fecha, 
      entidad: `${a.socio.nombre} ${a.socio.apellidos}`, 
      socioId: a.socio.id,
      concepto: a.motivo || "Cuota Socio", 
      monto: a.monto, 
      tipo: 'INGRESO', 
      metodo: a.metodo, 
      estado: a.estado,
      esSocio: true
    })),
    ...externos.map(e => ({ 
      id: e.id, fecha: e.fecha, entidad: e.fuente, 
      socioId: null,
      concepto: e.concepto, monto: e.monto, tipo: 'INGRESO', metodo: 'TRANSFERENCIA', estado: 'APROBADO',
      esSocio: false
    })),
    ...gastos.map(g => ({ 
      id: g.id, fecha: g.fecha, entidad: "Club", 
      socioId: null,
      concepto: g.concepto, monto: g.monto, tipo: 'GASTO', metodo: g.metodo, estado: 'APROBADO',
      esSocio: false
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Aplicar filtros
  if (tipoFiltro === "ingresos") {
    movimientos = movimientos.filter(m => m.tipo === 'INGRESO');
  } else if (tipoFiltro === "gastos") {
    movimientos = movimientos.filter(m => m.tipo === 'GASTO');
  }

  // Aplicar búsqueda
  if (search) {
    const searchLower = search.toLowerCase();
    movimientos = movimientos.filter(m => 
      m.entidad.toLowerCase().includes(searchLower) ||
      m.concepto?.toLowerCase().includes(searchLower)
    );
  }

  const totalItems = movimientos.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Aplicar paginación
  movimientos = movimientos.slice(skip, skip + pageSize);

  // Totales (sin paginación)
  const totalIngresos = abonos
    .filter(a => a.estado === 'APROBADO')
    .reduce((acc, a) => acc + a.monto, 0) + externos.reduce((acc, e) => acc + e.monto, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  return {
    movimientos,
    resumen: {
      saldoTotal: totalIngresos - totalGastos,
      ingresosTotales: totalIngresos,
      gastosTotales: totalGastos
    },
    totalPages,
    totalItems
  };
}

import { normalizeString } from "@/lib/utils/stringUtils";
import { MetodoPago } from "@/app/generated/client/enums";

export async function getSociosDeudores(search: string = "", page: number = 1, pageSize: number = 10) {
  const socios = await prisma.socio.findMany({
    include: {
      categoria: true,
      cargos: true,
      abonos: {
        where: { estado: "APROBADO" }
      }
    }
  });

  const queryNormalizada = normalizeString(search);

  const deudoresFiltrados = socios
    .map(socio => {
      const totalCargos = socio.cargos.reduce((acc, c) => acc + c.monto, 0);
      const totalAbonos = socio.abonos.reduce((acc, a) => acc + a.monto, 0);
      const deuda = totalCargos - totalAbonos;

      return {
        id: socio.id,
        nombre: `${socio.nombre} ${socio.apellidos}`,
        dni: socio.dni,
        categoria: socio.categoria?.nombre || "Sin categoría",
        totalCargos,
        totalAbonos,
        deuda: deuda > 0 ? deuda : 0,
        detalles: {
          cargos: socio.cargos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
          abonos: socio.abonos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        }
      };
    })
    .filter(s => {
      if (s.deuda <= 0) return false;
      if (!search) return true;
      
      const searchTerms = [s.nombre, s.dni];
      return searchTerms.some(term => normalizeString(term).includes(queryNormalizada));
    })
    .sort((a, b) => b.deuda - a.deuda);

  const totalCount = deudoresFiltrados.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const skip = (page - 1) * pageSize;
  const paginatedDeudores = deudoresFiltrados.slice(skip, skip + pageSize);

  return {
    deudores: paginatedDeudores,
    totalPages,
    totalCount
  };
}

export async function crearGastoAction(data: {
  monto: number;
  categoria: string;
  concepto: string;
  metodo: "EFECTIVO" | "TRANSFERENCIA" | "TARJETA";
}) {
  try {
    const temporada = await prisma.temporada.findFirst({ where: { activa: true } });
    if (!temporada) return { error: "No hay temporada activa." };

    await prisma.gasto.create({
      data: {
        monto: data.monto,
        categoria: data.categoria,
        concepto: data.concepto,
        metodo: data.metodo,
        temporadaId: temporada.id,
      }
    });

    revalidatePath("/contabilidad");
    return { success: true };
  } catch (e) {
    console.log(e);
    return { error: "Error al registrar el gasto." };
  }
}

export async function crearIngresoExternoAction(data: {
  monto: number;
  fuente: string;
  concepto: string;
}) {
  try {
    const temporada = await prisma.temporada.findFirst({ where: { activa: true } });
    if (!temporada) return { error: "No hay temporada activa." };

    await prisma.ingresoExterno.create({
      data: {
        monto: data.monto,
        fuente: data.fuente,
        concepto: data.concepto,
        temporadaId: temporada.id,
      }
    });

    revalidatePath("/contabilidad");
    return { success: true };
  } catch (e) {
    return { error: "Error al registrar el ingreso." };
  }
}

export async function getDatosGraficaMensual() {
  const temporada = await prisma.temporada.findFirst({ where: { activa: true } });
  if (!temporada) return [];

  // Traemos todo lo que afecta a la caja
  const [abonos, externos, gastos] = await Promise.all([
    prisma.abono.findMany({ where: { temporadaId: temporada.id, estado: "APROBADO" } }),
    prisma.ingresoExterno.findMany({ where: { temporadaId: temporada.id } }),
    prisma.gasto.findMany({ where: { temporadaId: temporada.id } })
  ]);

  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  // Inicializamos el array de 12 meses
  const datosFormateados = meses.map(mes => ({ name: mes, ingresos: 0, gastos: 0 }));

  // Sumamos ingresos (Abonos + Externos)
  abonos.forEach(a => { datosFormateados[new Date(a.fecha).getMonth()].ingresos += a.monto; });
  externos.forEach(e => { datosFormateados[new Date(e.fecha).getMonth()].ingresos += e.monto; });
  
  // Sumamos gastos
  gastos.forEach(g => { datosFormateados[new Date(g.fecha).getMonth()].gastos += g.monto; });

  return datosFormateados;
}

export async function getDatosGastosPorCategoria() {
  const temporada = await prisma.temporada.findFirst({ where: { activa: true } });
  if (!temporada) return [];

  // Agrupamos por categoría sumando el monto
  const gastos = await prisma.gasto.groupBy({
    by: ['categoria'],
    where: { temporadaId: temporada.id },
    _sum: { monto: true }
  });

  // Colores para la gráfica
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#94a3b8'];

  return gastos.map((g, index) => ({
    name: g.categoria,
    value: g._sum.monto || 0,
    fill: COLORS[index % COLORS.length]
  }));
}

export async function eliminarGastoAction(gastoId: string, motivo: string) {
  try {
    await prisma.gasto.delete({
      where: { id: gastoId }
    });
    
    revalidatePath("/contabilidad");
    return { success: true, message: `Gasto eliminado: ${motivo}` };
  } catch (error) {
    console.error("ERROR_ELIMINAR_GASTO:", error);
    return { error: "Error al eliminar el gasto" };
  }
}