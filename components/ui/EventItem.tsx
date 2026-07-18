import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trophy, Users2, CalendarDays, ChevronRight } from "lucide-react";
import { Clock, MapPin } from "lucide-react";

interface EventItemProps {
  tipo: string;
  fecha: Date;
  ubicacion: string;
  titulo?: string | null;
  rival?: string | null;
  esLocal: boolean;
  equipoNombre?: string;
  categoriaNombre?: string;
}

export default function EventItem({
  tipo, fecha, ubicacion, titulo, rival, esLocal, equipoNombre = 'Victorianos', categoriaNombre
}: EventItemProps) {

  // date-fns format() exige un Date real. Tras la serialización RSC y la
  // rehidratación en cliente la fecha puede llegar como string; normalizamos
  // para que format() no lance "Invalid time value" y la UI no quede en blanco.
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);

  const Icono = tipo === "PARTIDO" ? Trophy : (tipo === "SOCIAL" ? Users2 : CalendarDays);

  const nombreDisplay = tipo === "PARTIDO"
    ? esLocal
      ? `Victorianos ${categoriaNombre} vs ${rival}`
      : `${rival} vs Victorianos ${categoriaNombre}`
    : titulo;

  return (
    <div className="group flex items-center gap-8 py-6 px-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all">
      {/* Columna 1: Fecha vertical */}
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-2xl font-black text-slate-700 leading-none">{format(fechaObj, "dd")}</span>
        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">{format(fechaObj, "MMM", { locale: es })}</span>
      </div>

      {/* Columna 2: Icono suave */}
      <div className="p-3 bg-slate-100/80 text-slate-500 rounded-2xl group-hover:bg-white group-hover:shadow-sm transition-all">
        <Icono size={20} />
      </div>

      {/* Columna 3: Información principal */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-slate-800 text-base">{nombreDisplay}</h3>
          {tipo === "PARTIDO" && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${esLocal ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
              {esLocal ? 'Local' : 'Visitante'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Clock size={13} className="text-blue-500/70" /> {format(fechaObj, "HH:mm")}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <MapPin size={13} className="text-red-500/70" /> {ubicacion}
          </div>
        </div>
      </div>

      {/* Columna 4: Badge de Categoría */}
      <div className="text-[10px] font-black uppercase tracking-tighter px-3 py-1 bg-slate-100 text-slate-500 rounded-lg">
        {categoriaNombre || "Club"}
      </div>

      {/* Columna 5: Chevron affordance */}
      <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all shrink-0" />
    </div>
  );
}

