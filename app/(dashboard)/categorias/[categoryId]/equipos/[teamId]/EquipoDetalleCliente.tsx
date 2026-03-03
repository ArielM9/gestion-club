"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Check, Loader2, UserMinus, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { togglearInscripcionAction, getJugadoresParaEquipoAction } from "@/lib/actions/temporadas";

interface SocioData {
  id: string;
  nombre: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: Date | null;
}

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
  inscribed: boolean;
  equipoId: string | null;
  esAno2: boolean;
}

interface Equipo {
  id: string;
  nombre: string;
  federado: boolean;
  temporadaId: string;
  categoriaId: string;
  categoria: { nombre: string };
  temporada: { nombre: string };
  inscripciones: {
    id: string;
    socioId: string;
    federado: boolean;
    socio: SocioData;
  }[];
}

interface EquipoDetalleClienteProps {
  equipo: Equipo;
}

export default function EquipoDetalleCliente({ equipo }: EquipoDetalleClienteProps) {
  const [jugadores, setJugadores] = useState(equipo.inscripciones);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [jugadoresModal, setJugadoresModal] = useState<JugadorData[]>([]);
  const [cambios, setCambios] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const federados = jugadores.filter(j => j.federado);

  const handleQuitarDelEquipo = async (socioId: string) => {
    setActionLoading(socioId);
    const result = await togglearInscripcionAction(equipo.id, socioId, false);
    setActionLoading(null);

    if (result.success) {
      toast.success("Jugador eliminado del equipo");
      setJugadores(prev => prev.filter(j => j.socioId !== socioId));
    } else {
      toast.error(result.error || "Error al actualizar");
    }
  };

  const abrirModal = async () => {
    setLoadingModal(true);
    setShowModal(true);
    const result = await getJugadoresParaEquipoAction(equipo.categoriaId, equipo.temporadaId);
    setLoadingModal(false);

    if (result.success && result.data) {
      setJugadoresModal(result.data);
      const cambiosIniciales: Record<string, boolean> = {};
      result.data.forEach(j => {
        cambiosIniciales[j.socio.id] = j.federado;
      });
      setCambios(cambiosIniciales);
    }
  };

  const toggleCambio = (socioId: string) => {
    setCambios(prev => ({
      ...prev,
      [socioId]: !prev[socioId]
    }));
  };

  const guardarCambios = async () => {
    setSaving(true);
    let errores = 0;

    for (const jugador of jugadoresModal) {
      const nuevoEstado = cambios[jugador.socio.id];
      const estadoActual = jugador.federado;

      if (nuevoEstado !== estadoActual) {
        const result = await togglearInscripcionAction(equipo.id, jugador.socio.id, nuevoEstado);
        if (!result.success) {
          errores++;
        }
      }
    }

    setSaving(false);
    setShowModal(false);

    if (errores === 0) {
      toast.success("Cambios guardados");
      window.location.reload();
    } else {
      toast.error(`Hubo ${errores} errores al guardar`);
    }
  };

  const jugadoresAno1 = jugadoresModal.filter(j => !j.esAno2);
  const jugadoresAno2 = jugadoresModal.filter(j => j.esAno2);
  const hayCategoriaAnterior = jugadoresAno2.length > 0;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Jugadores del Equipo
            </h2>
            <p className="text-sm text-slate-500">
              {federados.length} jugadores federados
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {equipo.federado ? (
                <span className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <Check size={16} /> Equipo Federado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  No Federado
                </span>
              )}
            </div>
            <button
              onClick={abrirModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
            >
              <Plus size={16} />
              Agregar Jugadores
            </button>
          </div>
        </div>

        {federados.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-400">No hay jugadores federados en este equipo</p>
            <button
              onClick={abrirModal}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
            >
              Agregar Jugadores
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {federados.map((jugador) => (
              <div 
                key={jugador.id} 
                className="flex items-center justify-between p-4 rounded-2xl bg-green-50 border border-green-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-green-500 text-white">
                    {jugador.socio.nombre[0]}{jugador.socio.apellidos[0]}
                  </div>
                  <div>
                    <Link href={`/jugadores/${jugador.socio.id}`} className="font-bold text-slate-700 hover:text-blue-600">
                      {jugador.socio.nombre} {jugador.socio.apellidos}
                    </Link>
                    <p className="text-xs text-slate-400">
                      {jugador.socio.dni}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-lg">
                    <Check size={14} /> Federado
                  </span>
                  <button
                    onClick={() => handleQuitarDelEquipo(jugador.socio.id)}
                    disabled={actionLoading === jugador.socio.id}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Quitar del equipo"
                  >
                    {actionLoading === jugador.socio.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <UserMinus size={18} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar Jugadores */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-[2rem] shadow-2xl p-6 overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Agregar Jugadores</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            {loadingModal ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-6 mb-4">
                  {/* Año 1 */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">
                      Jugadores de {equipo.categoria.nombre} (año 1)
                    </h4>
                    <div className="space-y-2">
                      {jugadoresAno1.map(jugador => (
                        <div 
                          key={jugador.socio.id}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            cambios[jugador.socio.id]
                              ? "bg-green-50 border-green-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              cambios[jugador.socio.id]
                                ? "bg-green-500 text-white"
                                : "bg-slate-200 text-slate-500"
                            }`}>
                              {jugador.socio.nombre[0]}{jugador.socio.apellidos[0]}
                            </div>
                            <div>
                              <Link href={`/jugadores/${jugador.socio.id}`} className="font-bold text-slate-700 hover:text-blue-600 text-sm">
                                {jugador.socio.nombre} {jugador.socio.apellidos}
                              </Link>
                              <p className="text-xs text-slate-400">
                                {jugador.socio.dni} {jugador.socio.edad && `• ${jugador.socio.edad} años`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCambio(jugador.socio.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                              cambios[jugador.socio.id]
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {cambios[jugador.socio.id] ? <Check size={14} /> : null}
                            {cambios[jugador.socio.id] ? "Federado" : "No fed."}
                          </button>
                        </div>
                      ))}
                      {jugadoresAno1.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-2">No hay jugadores en esta categoría</p>
                      )}
                    </div>
                  </div>

                  {/* Año 2 */}
                  {hayCategoriaAnterior && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-2">
                        Jugadores de año 2 (promoción)
                      </h4>
                      <div className="space-y-2">
                        {jugadoresAno2.map(jugador => (
                          <div 
                            key={jugador.socio.id}
                            className={`flex items-center justify-between p-3 rounded-xl border ${
                              cambios[jugador.socio.id]
                                ? "bg-green-50 border-green-200"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                cambios[jugador.socio.id]
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-200 text-slate-500"
                              }`}>
                                {jugador.socio.nombre[0]}{jugador.socio.apellidos[0]}
                              </div>
                              <div>
                                <Link href={`/jugadores/${jugador.socio.id}`} className="font-bold text-slate-700 hover:text-blue-600 text-sm">
                                  {jugador.socio.nombre} {jugador.socio.apellidos}
                                </Link>
                                <p className="text-xs text-slate-400">
                                  {jugador.socio.dni} {jugador.socio.edad && `• ${jugador.socio.edad} años`}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleCambio(jugador.socio.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${
                                cambios[jugador.socio.id]
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-200 text-slate-500"
                              }`}
                            >
                              {cambios[jugador.socio.id] ? <Check size={14} /> : null}
                              {cambios[jugador.socio.id] ? "Federado" : "No fed."}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 border border-slate-200"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={guardarCambios}
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : null}
                    Guardar Cambios
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
