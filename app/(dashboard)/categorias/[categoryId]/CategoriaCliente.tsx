"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Check, X, Loader2, Plus, Trophy } from "lucide-react";
import { toast } from "sonner";
import { 
  getJugadoresPorCategoriaAction, 
  crearEquipoAction,
  getEquiposPorCategoria 
} from "@/lib/actions/temporadas";

interface JugadorData {
  socio: {
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    sexo: string | null;
    fechaNacimiento: Date | null;
    edad: number | null;
  };
  inscripcionId: string | null;
  federado: boolean;
  inscrito: boolean;
  equipoId: string | null;
}

interface EquipoData {
  id: string;
  nombre: string;
  federado: boolean;
  cerrado: boolean;
}

interface CategoriaInfo {
  id: string;
  nombre: string;
}

interface EquipoData {
  id: string;
  nombre: string;
  federado: boolean;
  cerrado: boolean;
  jugadoresCount?: number;
}

interface TemporadaInfo {
  id: string;
  nombre: string;
}

interface CategoriaClienteProps {
  categoria: CategoriaInfo;
  temporadaActiva: TemporadaInfo;
  equipos?: EquipoData[];
}

export default function CategoriaCliente({ categoria, temporadaActiva, equipos: equiposFromProps }: CategoriaClienteProps) {
  const [jugadores, setJugadores] = useState<JugadorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCrearEquipo, setShowCrearEquipo] = useState(false);
  const [equipos, setEquipos] = useState<EquipoData[]>(equiposFromProps || []);

  useEffect(() => {
    cargarDatos();
  }, [categoria.id]);

  const cargarDatos = async () => {
    setLoading(true);
    const [jugadoresResult, equiposResult] = await Promise.all([
      getJugadoresPorCategoriaAction(categoria.id, temporadaActiva.id),
      getEquiposPorCategoria(categoria.id, temporadaActiva.id)
    ]);
    
    if (jugadoresResult.success && jugadoresResult.data) {
      setJugadores(jugadoresResult.data);
    }
    if (equiposResult) {
      setEquipos(equiposResult.map(eq => ({
        id: eq.id,
        nombre: eq.nombre,
        federado: eq.federado,
        cerrado: eq.cerrado
      })));
    }
    setLoading(false);
  };

  const handleCrearEquipo = async () => {
    setActionLoading("crear");
    const result = await crearEquipoAction(temporadaActiva.id, categoria.id, categoria.nombre, false);
    setActionLoading(null);
    setShowCrearEquipo(false);
    
    if (result.success) {
      toast.success("Equipo creado");
      cargarDatos();
    } else {
      toast.error(result.error);
    }
  };

  const federadosCount = jugadores.filter(j => j.inscrito && j.federado).length;
  const inscritosCount = jugadores.filter(j => j.inscrito).length;

  return (
    <div className="space-y-8">
      {/* Equipos */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900">Equipos</h2>
          <button
            onClick={() => setShowCrearEquipo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
          >
            <Plus size={16} />
            Crear Equipo
          </button>
        </div>

        {equipos.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No hay equipos creados</p>
        ) : (
          <div className="space-y-2">
            {equipos.map(eq => (
              <div key={eq.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Trophy size={18} className="text-slate-400" />
                  <div>
                    <p className="font-bold text-slate-700">{eq.nombre}</p>
                    <p className="text-xs text-slate-500">
                      {eq.federado ? "Federado" : "No federado"} • {eq.jugadoresCount || 0} jugadores
                    </p>
                  </div>
                </div>
                <Link 
                  href={`/categorias/${categoria.id}/equipos/${eq.id}`}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold"
                >
                  Gestionar
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Jugadores de la Categoría */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Jugadores de la Categoría</h2>
            <p className="text-sm text-slate-500">
              {inscritosCount} inscritos • {federadosCount} federados
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : jugadores.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400">No hay jugadores en edad para esta categoría</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jugadores.map((jugador) => (
              <div 
                key={jugador.socio.id} 
                className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                  jugador.inscrito && jugador.federado 
                    ? "bg-green-50 border border-green-100" 
                    : "bg-slate-50 border border-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    jugador.inscrito && jugador.federado 
                      ? "bg-green-500 text-white" 
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {jugador.socio.nombre?.[0]}{jugador.socio.apellidos?.[0]}
                  </div>
                  <div>
                    <Link href={`/jugadores/${jugador.socio.id}`} className="font-bold text-slate-700 hover:text-blue-600">
                      {jugador.socio.nombre} {jugador.socio.apellidos}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {jugador.socio.dni} {jugador.socio.edad && `• ${jugador.socio.edad} años`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {jugador.inscrito ? (
                    jugador.federado ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                        <Check size={14} /> Federado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-lg">
                        <X size={14} /> No federado
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">No inscrito</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Equipo */}
      {showCrearEquipo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCrearEquipo(false)}>
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900 mb-4">Crear Equipo</h3>
            <p className="text-slate-600 mb-6">
              ¿Crear equipo "{categoria.nombre}" para la temporada {temporadaActiva.nombre}?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowCrearEquipo(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 border border-slate-200"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCrearEquipo}
                disabled={actionLoading === "crear"}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === "crear" ? <Loader2 size={20} className="animate-spin mx-auto" /> : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
