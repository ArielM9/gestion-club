"use client"; // Asegúrate de si es client o server component según tu estructura

import { Mail, Phone, ChevronRight, UserCircle2 } from "lucide-react";
import Link from "next/link";
import Pagination from "./Pagination";

export default function SocioTable({ socios, totalPages, currentPage }: { socios: any[], totalPages: number, currentPage: number }) {
  return (
    <div className="flex flex-col h-full">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest">
              <th className="px-6 py-4 border-b border-slate-100">Jugador</th>
              <th className="px-6 py-4 border-b border-slate-100">Categoría</th>
              <th className="px-6 py-4 border-b border-slate-100">Contacto</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {socios.map((socio) => {
              const esMenor = socio.nombreTutor && socio.telefonoTutor;

              // Lógica de Interlocutor (quién nos atiende el teléfono)
              const contactoPrincipal = {
                nombre: esMenor
                  ? socio.nombreTutor
                  : (socio.mote ? socio.mote : socio.nombre),
                telefono: esMenor ? socio.telefonoTutor : socio.telefono,
                email: socio.email,
                esTutor: esMenor
              };

              return (
                <tr key={socio.id} className="group hover:bg-blue-50/30 transition-all">
                  {/* JUGADOR: Datos reales de identidad */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-11 w-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shadow-sm group-hover:border-blue-200 transition-colors">
                        {socio.fotoUrl ? (
                          <img src={`/api/socios/foto/serve?key=${encodeURIComponent(socio.fotoUrl)}`} alt={socio.nombre} className="h-full w-full object-cover" />
                        ) : (
                          <UserCircle2 size={24} strokeWidth={1.5} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {socio.nombre} {socio.apellidos}
                          {/* Si es adulto y tiene mote, se lo ponemos al lado del nombre en pequeñito */}
                          {!esMenor && socio.mote && (
                            <span className="ml-2 text-[10px] text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                              "{socio.mote}"
                            </span>
                          )}
                        </p>
                        {/* <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                        ID: {socio.id.slice(-6)}
                      </p> */}
                      </div>
                    </div>
                  </td>

                  {/* CATEGORÍA: Ahora funcionará gracias al include de Prisma */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-sm group-hover:border-blue-200 group-hover:text-blue-600 transition-all">
                      {socio.categoria?.nombre || "Sin categoría"}
                    </span>
                  </td>

                  {/* CONTACTO: Quién es y cómo hablar con ellos */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {
                          esMenor ?
                            (
                              <>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter bg-amber-100 text-amber-700">
                                  Tutor
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {contactoPrincipal.nombre}
                                </span></>
                            ) : null
                        }
                        {/* <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                        contactoPrincipal.esTutor 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {contactoPrincipal.esTutor ? ('Tutor') : 'Personal'}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {contactoPrincipal.nombre}  
                      </span> */}
                      </div>

                      <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Phone size={12} className="text-blue-500/60" />
                          <span className="text-xs font-mono">{contactoPrincipal.telefono || "---"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Mail size={12} />
                          <span className="text-[11px] truncate max-w-[120px]">{contactoPrincipal.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* ACCIÓN */}
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/jugadores/${socio.id}`}
                      className="p-2.5 inline-flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-[#1e293b] hover:text-white transition-all shadow-sm group/btn cursor-pointer "
                    >
                      <span className="text-xs font-bold">Ver Ficha</span>
                      <ChevronRight size={20} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista móvil: cards apiladas, sin scroll horizontal */}
      <div className="md:hidden flex flex-col gap-3">
        {socios.map((socio) => {
          const esMenor = socio.nombreTutor && socio.telefonoTutor;
          return (
            <Link
              key={socio.id}
              href={`/jugadores/${socio.id}`}
              className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors min-h-[44px]"
            >
              <div className="h-11 w-11 shrink-0 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                {socio.fotoUrl ? (
                  <img src={socio.fotoUrl} alt={socio.nombre} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 size={22} strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm truncate">
                  {socio.nombre} {socio.apellidos}
                </p>
                <p className="text-[11px] font-bold text-slate-500 mt-0.5 truncate">
                  {socio.categoria?.nombre || "Sin categoría"}
                  {esMenor && <span className="ml-2 text-amber-600">· Tutor</span>}
                </p>
              </div>
              <ChevronRight size={20} className="text-slate-400 shrink-0" />
            </Link>
          );
        })}
      </div>

      <Pagination totalPages={totalPages} currentPage={currentPage} />
    </div>
  );
}