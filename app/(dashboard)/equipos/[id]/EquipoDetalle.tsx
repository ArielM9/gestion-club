"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  Check,
  X,
  Loader2,
  UserPlus,
  Search,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  actualizarEquipoAction,
  agregarJugadorAEquipoAction,
  quitarJugadorDeEquipoAction,
} from "@/lib/actions/equipos";
import { getYearTemporada } from "@/lib/utils/categorias";
import { JugadorItem } from "@/components/ui/JugadorItem";

interface Categoria {
  id: string;
  nombre: string;
}

interface Temporada {
  id: string;
  nombre: string;
  fechaInicio: Date;
}

interface Socio {
  id: string;
  nombre: string;
  apellidos: string;
  mote: string | null;
  dni: string;
  fechaNacimiento: Date | null;
  categoria: Categoria | null;
}

interface Inscripcion {
  id: string;
  socio: Socio;
  federado: boolean;
}

interface Equipo {
  id: string;
  nombre: string;
  federado: boolean;
  categoria: Categoria;
  temporada: Temporada;
  inscripciones: Inscripcion[];
}

interface EquipoDetalleProps {
  equipo: Equipo;
  todosLosSocios: Socio[];
}

export default function EquipoDetalle({ equipo, todosLosSocios }: EquipoDetalleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showBuscar, setShowBuscar] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const anoTemporada = getYearTemporada(new Date(equipo.temporada.fechaInicio));

  const getEdadJugador = (fechaNac: Date | null) => {
    if (!fechaNac) return null;
    const nac = new Date(fechaNac);
    return anoTemporada - nac.getFullYear();
  };

  const esCategoriaSuperior = (categoriaNombre: string | null) => {
    if (!categoriaNombre) return false;
    const orden = [
      "M6", "M8", "M10", "M12", "M14", "M16", "M18",
      "Senior Masculino", "Senior Femenino"
    ];
    const idxEquipo = orden.indexOf(equipo.categoria.nombre);
    const idxJugador = orden.indexOf(categoriaNombre);
    return idxJugador === idxEquipo - 1;
  };

  const esSegundoAno = (categoriaNombre: string | null, fechaNac: Date | null) => {
    if (!categoriaNombre || !fechaNac) return false;
    const match = categoriaNombre.match(/M(\d+)/);
    if (!match) return false;
    const edadMinima = parseInt(match[1]);
    const edad = getEdadJugador(fechaNac);
    return edad === edadMinima + 1;
  };

  const esCategoriaEquipo = (categoriaNombre: string | null) => {
    if (!categoriaNombre) return false;
    return categoriaNombre === equipo.categoria.nombre;
  };

  const jugadoresEnEquipo = equipo.inscripciones.map((i) => i.socio.id);
  const federadosCount = equipo.inscripciones.filter((i) => i.federado).length;

  const puedeAgregar = (socio: Socio) => {
    if (jugadoresEnEquipo.includes(socio.id)) return false;
    if (!socio.categoria) return false;

    const catSocio = socio.categoria.nombre;
    const catEquipo = equipo.categoria.nombre;

    if (catSocio === catEquipo) return true;
    if (esCategoriaSuperior(catSocio) && esSegundoAno(catSocio, socio.fechaNacimiento)) return true;

    return false;
  };

  const filteredSocios = todosLosSocios
    .filter((s) => puedeAgregar(s))
    .filter(
      (s) =>
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.apellidos.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.dni.toLowerCase().includes(busqueda.toLowerCase())
    );

  const handleQuitar = async (socioId: string) => {
    setEliminandoId(socioId);
    const res = await quitarJugadorDeEquipoAction(equipo.id, socioId);
    setEliminandoId(null);

    if (res.success) {
      toast.success("Jugador removido del equipo");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleAgregar = async (socioId: string) => {
    setLoading(true);
    const res = await agregarJugadorAEquipoAction(equipo.id, socioId);
    setLoading(false);

    if (res.success) {
      toast.success("Jugador agregado al equipo");
      setShowBuscar(false);
      setBusqueda("");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/equipos"
          className="p-2 hover:bg-slate-100 rounded-xl"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">
            {equipo.nombre}
          </h1>
          <p className="text-sm text-slate-500">
            {equipo.temporada.nombre} · {equipo.categoria.nombre}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
            <Users size={16} className="text-slate-500" />
            <span className="font-bold">{equipo.inscripciones.length}</span>
            <span className="text-slate-500">jugadores</span>
          </div>
          <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-xl">
            <Check size={16} className="text-green-600" />
            <span className="font-bold text-green-700">{federadosCount}</span>
            <span className="text-green-600">federados</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-slate-900">Jugadores</h2>
          <button
            onClick={() => setShowBuscar(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"
          >
            <UserPlus size={16} />
            Agregar
          </button>
        </div>

        {equipo.inscripciones.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No hay jugadores en este equipo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {equipo.inscripciones.map((inscripcion) => (
              <div
                key={inscripcion.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50"
              >
                <JugadorItem
                  jugador={inscripcion.socio}
                  showCategoria
                  showEdad
                  showMote
                  temporadaAnno={anoTemporada}
                />
                <div className="flex items-center gap-2">
                  {inscripcion.federado && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                      Federado
                    </span>
                  )}
                  <button
                    onClick={() => handleQuitar(inscripcion.socio.id)}
                    disabled={eliminandoId === inscripcion.socio.id}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  >
                    {eliminandoId === inscripcion.socio.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBuscar && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowBuscar(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900">
                Agregar Jugador
              </h3>
              <button
                onClick={() => setShowBuscar(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="p-6">
                <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredSocios.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">
                    No hay jugadores disponibles para agregar
                  </p>
                ) : (
                  filteredSocios.map((socio) => (
                    <button
                      key={socio.id}
                      onClick={() => handleAgregar(socio.id)}
                      disabled={loading}
                      className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-blue-50 transition-colors text-left"
                    >
                      <div>
                        <p className="font-bold text-slate-900">
                          {socio.nombre} {socio.apellidos}
                        </p>
                        <p className="text-xs text-slate-500">
                          {socio.mote && <span className="italic mr-1">"{socio.mote}"</span>}
                          {socio.categoria?.nombre}
                        </p>
                      </div>
                      <Plus size={18} className="text-blue-500" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
