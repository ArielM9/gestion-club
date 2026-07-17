"use client";

import Link from "next/link";
import { UserCircle2 } from "lucide-react";

interface JugadorData {
  id: string;
  nombre: string;
  apellidos: string;
  mote?: string | null;
  fotoUrl?: string | null;
  categoria?: { nombre: string } | null;
  fechaNacimiento?: Date | null;
  telefono?: string | null;
  email?: string | null;
}

interface JugadorItemProps {
  jugador: JugadorData;
  showCategoria?: boolean;
  showEdad?: boolean;
  showMote?: boolean;
  showContacto?: boolean;
  variant?: "default" | "compact" | "card";
  temporadaAnno?: number;
}

export function JugadorItem({
  jugador,
  showCategoria = false,
  showEdad = false,
  showMote = false,
  showContacto = false,
  variant = "default",
  temporadaAnno,
}: JugadorItemProps) {
  const getEdad = () => {
    if (!jugador.fechaNacimiento || !temporadaAnno) return null;
    const nac = new Date(jugador.fechaNacimiento);
    return temporadaAnno - nac.getFullYear();
  };

  const nombreCompleto = `${jugador.nombre} ${jugador.apellidos}`;
  const edad = getEdad();

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
          {jugador.fotoUrl ? (
            <img
              src={`/api/socios/foto/serve?key=${encodeURIComponent(jugador.fotoUrl)}`}
              alt={nombreCompleto}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle2 size={18} strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0">
          <Link
            href={`/jugadores/${jugador.id}`}
            className="font-bold text-slate-800 hover:text-blue-600 transition-colors truncate block"
          >
            {nombreCompleto}
          </Link>
          {(showCategoria || showEdad) && (
            <p className="text-xs text-slate-500">
              {showCategoria && jugador.categoria?.nombre}
              {showCategoria && showEdad && edad && " · "}
              {showEdad && edad && `${edad} años`}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Link
        href={`/jugadores/${jugador.id}`}
        className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
          {jugador.fotoUrl ? (
            <img
              src={`/api/socios/foto/serve?key=${encodeURIComponent(jugador.fotoUrl)}`}
              alt={nombreCompleto}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle2 size={24} strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 truncate">
            {nombreCompleto}
          </p>
          <p className="text-xs text-slate-500">
            {showMote && jugador.mote && (
              <span className="italic mr-2">"{jugador.mote}"</span>
            )}
            {showCategoria && jugador.categoria?.nombre}
            {showCategoria && showEdad && edad && " · "}
            {showEdad && edad && `${edad} años`}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0">
        {jugador.fotoUrl ? (
          <img
            src={`/api/socios/foto/serve?key=${encodeURIComponent(jugador.fotoUrl)}`}
            alt={nombreCompleto}
            className="h-full w-full object-cover"
          />
        ) : (
          <UserCircle2 size={24} strokeWidth={1.5} />
        )}
      </div>
      <div className="min-w-0">
        <Link
          href={`/jugadores/${jugador.id}`}
          className="font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors block truncate"
        >
          {nombreCompleto}
        </Link>
        {(showMote || showCategoria || showEdad || showContacto) && (
          <p className="text-xs text-slate-500 truncate">
            {showMote && jugador.mote && (
              <span className="italic mr-1">"{jugador.mote}"</span>
            )}
            {showCategoria && jugador.categoria?.nombre}
            {showCategoria && (showEdad && edad) && " · "}
            {showEdad && edad && `${edad} años`}
            {showContacto && (jugador.telefono || jugador.email) && " · "}
            {showContacto && jugador.telefono && jugador.telefono}
            {showContacto && !jugador.telefono && jugador.email && jugador.email}
          </p>
        )}
      </div>
    </div>
  );
}
