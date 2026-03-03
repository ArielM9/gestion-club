"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, Trophy, PartyPopper, Handshake, MoreHorizontal, Clock, CheckCircle2 } from "lucide-react";
import Pagination from "../jugadores/Pagination";

interface Equipo {
  id: string;
  nombre: string;
  categoria: { id: string; nombre: string };
}

interface Evento {
  id: string;
  tipo: string;
  fecha: Date;
  ubicacion: string;
  titulo: string | null;
  detalles: string | null;
  esLocal: boolean;
  rival: string | null;
  equipo: Equipo | null;
}

const tipoIcons: Record<string, React.ReactNode> = {
  PARTIDO: <Users size={16} />,
  TORNEO: <Trophy size={16} />,
  SOCIAL: <PartyPopper size={16} />,
  REUNION: <Handshake size={16} />,
  OTRO: <MoreHorizontal size={16} />,
};

const tipoLabels: Record<string, string> = {
  PARTIDO: "Partido",
  TORNEO: "Torneo",
  SOCIAL: "Social",
  REUNION: "Reunión",
  OTRO: "Otro",
};

interface EventTableProps {
  eventos: Evento[];
  equipos: Equipo[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  eventosProximos: Evento[];
  eventosPasados: Evento[];
}

export default function EventTable({
  eventos,
  totalPages,
  currentPage,
  totalCount,
  eventosProximos,
  eventosPasados,
}: EventTableProps) {
  return (
    <div className="space-y-8">
      {/* Resumen de próximos eventos */}
      {eventosProximos.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-[2rem] p-6 border border-blue-100">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
            <Clock size={16} className="text-blue-500" />
            Próximos Eventos ({eventosProximos.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventosProximos.slice(0, 6).map((evento) => (
              <Link
                key={evento.id}
                href={`/eventos/${evento.id}`}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase flex items-center gap-1">
                    {tipoIcons[evento.tipo]}
                    {tipoLabels[evento.tipo]}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${evento.esLocal ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                    {evento.esLocal ? "Local" : "Visitante"}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {evento.tipo === "PARTIDO" && evento.rival
                    ? `vs ${evento.rival}`
                    : evento.titulo || tipoLabels[evento.tipo]}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Calendar size={12} />
                  {new Date(evento.fecha).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                  <MapPin size={12} />
                  {evento.ubicacion}
                </div>
                {evento.equipo && (
                  <div className="mt-2 text-[10px] font-medium text-slate-400">
                    {evento.equipo.nombre} • {evento.equipo.categoria.nombre}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de todos los eventos */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">
            Todos los Eventos ({totalCount})
          </h3>
          {eventosPasados.length > 0 && (
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
              {eventosPasados.length} pasados
            </span>
          )}
        </div>

        {eventos.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">No hay eventos que mostrar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Evento</th>
                  <th className="px-6 py-4">Equipo</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {eventos.map((evento) => {
                  const esPasado = new Date(evento.fecha) < new Date();
                  return (
                    <tr
                      key={evento.id}
                      className={`hover:bg-slate-50 transition-colors ${esPasado ? "opacity-60" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {esPasado ? (
                            <CheckCircle2 size={14} className="text-slate-300" />
                          ) : (
                            <Clock size={14} className="text-blue-400" />
                          )}
                          <span className="text-xs font-bold text-slate-700">
                            {new Date(evento.fecha).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(evento.fecha).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase flex items-center gap-1 w-fit">
                          {tipoIcons[evento.tipo]}
                          {tipoLabels[evento.tipo]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-700">
                          {evento.tipo === "PARTIDO" && evento.rival
                            ? `vs ${evento.rival}`
                            : evento.titulo || tipoLabels[evento.tipo]}
                        </span>
                        {evento.tipo === "PARTIDO" && (
                          <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded ${evento.esLocal ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                            {evento.esLocal ? "Local" : "Visitante"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {evento.equipo ? (
                          <span className="text-xs font-medium text-slate-600">
                            {evento.equipo.nombre}
                            <span className="text-[10px] text-slate-400 ml-1">
                              • {evento.equipo.categoria.nombre}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500">{evento.ubicacion}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/eventos/${evento.id}`}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          Ver detalle
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="p-6 border-t border-slate-50">
            <Pagination totalPages={totalPages} currentPage={currentPage} />
          </div>
        )}
      </div>
    </div>
  );
}
