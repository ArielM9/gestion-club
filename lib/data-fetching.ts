import prisma from "./prisma";

export async function getProximosEventos() {
  const ahora = new Date();

  return await prisma.evento.findMany({
    where: {
      fecha: { gte: ahora },
    },
    include: {
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

export async function getTemporadaActiva() {
  return await prisma.temporada.findFirst({
    where: { activa: true },
    select: {
      id: true,
      nombre: true,
      fechaInicio: true,
    },
  });
}

export async function getDashboardMetrics() {
  const [totalSocios, deudores] = await Promise.all([
    prisma.socio.count({
      where: { activo: true },
    }),
    prisma.socio.aggregate({
      where: { deudaPendiente: { gt: 0 } },
      _sum: { deudaPendiente: true },
      _count: true,
    }),
  ]);

  return {
    totalSocios,
    deudaTotal: deudores._sum.deudaPendiente ?? 0,
    sociosConDeuda: deudores._count,
  };
}

export type ActividadItem = {
  id: string;
  tipo: "pago" | "inscripcion" | "documento";
  fecha: Date;
  descripcion: string;
  href: string;
};

export async function getActividadReciente(): Promise<ActividadItem[]> {
  const [ultimosAbonos, ultimasInscripciones, ultimosDocumentos] =
    await Promise.all([
      prisma.abono.findMany({
        take: 5,
        orderBy: { fecha: "desc" },
        include: { socio: { select: { nombre: true, apellidos: true } } },
      }),
      prisma.inscripcion.findMany({
        take: 5,
        orderBy: { id: "desc" },
        include: {
          socio: { select: { id: true, nombre: true, apellidos: true } },
          temporada: { select: { nombre: true } },
        },
      }),
      prisma.documento.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { socio: { select: { id: true, nombre: true, apellidos: true } } },
      }),
    ]);

  // Inscripcion has no fecha/createdAt field, so we fall back to "now" as a
  // best-effort placeholder. The desc sort by CUID keeps them ordered roughly
  // by insertion time within the merge below.
  const ahora = new Date();

  const items: ActividadItem[] = [
    ...ultimosAbonos.map((a) => ({
      id: `abono-${a.id}`,
      tipo: "pago" as const,
      fecha: a.fecha,
      descripcion: `${a.socio.nombre} ${a.socio.apellidos} — ${formatMonto(a.monto)}`,
      href: `/contabilidad?tab=abonos&id=${a.id}`,
    })),
    ...ultimasInscripciones.map((i) => ({
      id: `inscripcion-${i.id}`,
      tipo: "inscripcion" as const,
      fecha: ahora,
      descripcion: `${i.socio.nombre} ${i.socio.apellidos} inscrito en ${i.temporada.nombre}`,
      href: `/jugadores/${i.socio.id}`,
    })),
    ...ultimosDocumentos.map((d) => ({
      id: `documento-${d.id}`,
      tipo: "documento" as const,
      fecha: d.createdAt,
      descripcion: `${d.filename} — ${d.socio.nombre} ${d.socio.apellidos}`,
      href: "/documentos",
    })),
  ];

  return items
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
    .slice(0, 5);
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(monto);
}
