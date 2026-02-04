"use server";
import prisma from "@/lib/prisma";

export async function getMovimientosGlobales() {
  const temporada = await prisma.temporada.findFirst({ where: { activa: true } });
  if (!temporada) return { movimientos: [], resumen: null };

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
  const movimientos = [
    ...abonos.map(a => ({ 
      id: a.id, fecha: a.fecha, entidad: `${a.socio.nombre} ${a.socio.apellidos}`, 
      concepto: a.motivo || "Cuota Socio", monto: a.monto, tipo: 'INGRESO', metodo: a.metodo, estado: a.estado 
    })),
    ...externos.map(e => ({ 
      id: e.id, fecha: e.fecha, entidad: e.fuente, 
      concepto: e.concepto, monto: e.monto, tipo: 'INGRESO', metodo: 'TRANSFERENCIA', estado: 'APROBADO' 
    })),
    ...gastos.map(g => ({ 
      id: g.id, fecha: g.fecha, entidad: "Proveedor / Club", 
      concepto: g.concepto, monto: g.monto, tipo: 'GASTO', metodo: 'EFECTIVO', estado: 'APROBADO' 
    }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  // Totales
  const totalIngresos = movimientos.filter(m => m.tipo === 'INGRESO' && m.estado === 'APROBADO').reduce((acc, m) => acc + m.monto, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  return {
    movimientos,
    resumen: {
      saldoTotal: totalIngresos - totalGastos,
      ingresosTotales: totalIngresos,
      gastosTotales: totalGastos
    }
  };
}