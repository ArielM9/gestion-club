import { CreditCard, UserPlus, FileText, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { getActividadReciente, type ActividadItem } from "@/lib/data-fetching";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<ActividadItem["tipo"], { icon: LucideIcon; color: string }> = {
  pago: {
    icon: CreditCard,
    color: "bg-emerald-50 text-emerald-600",
  },
  inscripcion: {
    icon: UserPlus,
    color: "bg-blue-50 text-blue-600",
  },
  documento: {
    icon: FileText,
    color: "bg-violet-50 text-violet-600",
  },
};

const TIPO_LABELS: Record<ActividadItem["tipo"], string> = {
  pago: "Pago",
  inscripcion: "Inscripción",
  documento: "Documento",
};

export default async function ActivityFeed() {
  const items = await getActividadReciente();

  return (
    <section
      aria-labelledby="activity-heading"
      className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 md:p-8 h-full"
    >
      <header className="mb-5">
        <h2
          id="activity-heading"
          className="text-lg md:text-xl font-black text-slate-900"
        >
          Actividad Reciente
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Últimos movimientos del club
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ActivityRow({ item }: { item: ActividadItem }) {
  const { icon: Icon, color } = ICON_MAP[item.tipo];
  const relative = formatDistanceToNow(item.fecha, {
    addSuffix: true,
    locale: es,
  });

  return (
    <li>
      <Link
        href={item.href}
        className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors"
      >
        <div
          className={`shrink-0 p-2.5 rounded-xl ${color}`}
          aria-hidden="true"
        >
          <Icon size={18} strokeWidth={2.25} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 truncate">
            {item.descripcion}
          </p>
          <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
              {TIPO_LABELS[item.tipo]}
            </span>
            <span aria-hidden="true">·</span>
            <span>{relative}</span>
          </p>
        </div>
      </Link>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="p-4 rounded-2xl bg-slate-50 text-slate-300 mb-3" aria-hidden="true">
        <Inbox size={28} strokeWidth={2} />
      </div>
      <p className="text-sm font-bold text-slate-500">
        Aún no hay actividad reciente
      </p>
      <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
        Los pagos, inscripciones y documentos que se registren aparecerán aquí.
      </p>
    </div>
  );
}
