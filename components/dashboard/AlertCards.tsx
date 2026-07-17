import prisma from "@/lib/prisma";
import Link from "next/link";
import { FileText, UserMinus, Clock, Package, type LucideIcon } from "lucide-react";

type Alert = {
  count: number;
  label: string;
  icon: LucideIcon;
  color: string;
  href: string;
};

export default async function AlertCards() {
  // Las 4 queries se ejecutan en paralelo (rule: async-parallel).
  // "Sin inscribir" usa relation filter para resolver en 1 sola query
  // en vez de traer IDs a memoria y filtrar en JS.
  const [docsPendientes, jugadoresSinInscribir, abonosPendientes, stockBajo] =
    await Promise.all([
      prisma.documentoPendiente.count({
        where: { estado: { not: "CONFIRMADO" } },
      }),
      prisma.socio.count({
        where: {
          activo: true,
          inscripciones: { none: { temporada: { activa: true } } },
        },
      }),
      prisma.abono.count({ where: { estado: "PENDIENTE" } }),
      prisma.productoTalla.count({ where: { stock: { lte: 5 } } }),
    ]);

  const alerts: Alert[] = [
    {
      count: docsPendientes,
      label: "Documentos pendientes",
      icon: FileText,
      color: "text-amber-600 bg-amber-50",
      href: "/documentos",
    },
    {
      count: jugadoresSinInscribir,
      label: "Sin inscribir",
      icon: UserMinus,
      color: "text-blue-600 bg-blue-50",
      href: "/jugadores",
    },
    {
      count: abonosPendientes,
      label: "Pagos por aprobar",
      icon: Clock,
      color: "text-yellow-600 bg-yellow-50",
      href: "/contabilidad",
    },
    {
      count: stockBajo,
      label: "Stock bajo",
      icon: Package,
      color: "text-red-600 bg-red-50",
      href: "/tienda/pedidos",
    },
  ];

  const visibleAlerts = alerts.filter((a) => a.count > 0);

  if (visibleAlerts.length === 0) {
    return (
      <section
        aria-label="Sin alertas pendientes"
        className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 text-center"
      >
        <p className="text-sm text-slate-400 font-medium">Todo al día</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="alerts-heading">
      <h2 id="alerts-heading" className="sr-only">
        Alertas pendientes
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleAlerts.map(({ count, label, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white p-6 rounded-4xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center gap-5 group"
          >
            <div
              className={`p-4 rounded-4xl ${color} shrink-0 group-hover:scale-105 transition-transform`}
            >
              <Icon size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-slate-900">{count}</p>
              <p className="text-xs font-bold text-slate-500 truncate">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
