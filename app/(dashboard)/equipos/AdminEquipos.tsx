"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Users, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import {
  crearEquipoAction,
  actualizarEquipoAction,
  eliminarEquipoAction,
} from "@/lib/actions/equipos";
import { TableActions } from "@/components/ui/TableActions";

interface Categoria {
  id: string;
  nombre: string;
}

interface Temporada {
  id: string;
  nombre: string;
}

interface TemporadaActiva extends Temporada {
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
}

interface Equipo {
  id: string;
  nombre: string;
  categoria: Categoria;
  temporada: Temporada;
  _count?: {
    inscripciones: number;
  };
}

interface AdminEquiposProps {
  equipos: Equipo[];
  categorias: Categoria[];
  temporadas: Temporada[];
  temporadaActiva: TemporadaActiva | null;
}

export default function AdminEquipos({
  equipos,
  categorias,
  temporadas,
  temporadaActiva,
}: AdminEquiposProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Equipo | null>(null);
  const [loading, setLoading] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    categoriaId: "",
    temporadaId: "",
  });

  const handleAbrirCrear = () => {
    setEditando(null);
    setFormData({
      nombre: "",
      categoriaId: "",
      temporadaId: temporadas[0]?.id || "",
    });
    setShowModal(true);
  };

  const handleAbrirEditar = (equipo: Equipo) => {
    setEditando(equipo);
    setFormData({
      nombre: equipo.nombre,
      categoriaId: equipo.categoria.id,
      temporadaId: equipo.temporada.id,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.categoriaId || !formData.temporadaId) return;

    setLoading(true);
    let res;

    if (editando) {
      res = await actualizarEquipoAction(editando.id, {
        nombre: formData.nombre,
        categoriaId: formData.categoriaId,
      });
    } else {
      res = await crearEquipoAction(formData);
    }

    setLoading(false);

    if (res.success) {
      toast.success(editando ? "Equipo actualizado" : "Equipo creado");
      setShowModal(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleEliminar = async (equipo: Equipo) => {
    if (!confirm(`¿Eliminar equipo "${equipo.nombre}"?`)) return;

    setEliminando(equipo.id);
    const res = await eliminarEquipoAction(equipo.id);
    setEliminando(null);

    if (res.success) {
      toast.success("Equipo eliminado");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const temporadasAgrupadas = temporadas.map((t) => ({
    ...t,
    equipos: equipos.filter((e) => e.temporada.id === t.id),
  }));

  const tieneSoloTemporadaActiva = temporadaActiva && temporadas.length === 1;

  return (
    <div className="space-y-8">
      {!temporadaActiva && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <p className="text-amber-800 font-bold">No hay temporada activa</p>
          <p className="text-amber-600 text-sm mt-1">
            Crea una temporada en Administración para gestionar equipos.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleAbrirCrear}
          disabled={!temporadaActiva}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          Nuevo Equipo
        </button>
      </div>

      {tieneSoloTemporadaActiva && (
        <>
          {equipos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <p className="text-slate-500 font-medium">
                No hay equipos en esta temporada
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Crea el primer equipo para comenzar
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-6 py-4 text-left">Equipo</th>
                    <th className="px-6 py-4 text-left">Categoría</th>
                    <th className="px-6 py-4 text-right">Jugadores</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {equipos.map((equipo) => (
                    <tr key={equipo.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/equipos/${equipo.id}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors"
                        >
                          {equipo.nombre}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                          {equipo.categoria.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-700">
                          {equipo._count?.inscripciones || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <TableActions
                          viewUrl={`/equipos/${equipo.id}`}
                          onEdit={() => handleAbrirEditar(equipo)}
                          onDelete={() => handleEliminar(equipo)}
                          isDeleting={eliminando === equipo.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!tieneSoloTemporadaActiva && temporadaActiva && (
        temporadasAgrupadas.map((t) => (
        <div key={t.id} className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trophy size={20} className="text-amber-500" />
            {t.nombre}
          </h2>

          {t.equipos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl">
              <p className="text-slate-500 font-medium">
                No hay equipos en esta temporada
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-6 py-4 text-left">Equipo</th>
                    <th className="px-6 py-4 text-left">Categoría</th>
                    <th className="px-6 py-4 text-right">Jugadores</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {t.equipos.map((equipo) => (
                    <tr key={equipo.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/equipos/${equipo.id}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors"
                        >
                          {equipo.nombre}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                          {equipo.categoria.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-slate-700">
                          {equipo._count?.inscripciones || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <TableActions
                          viewUrl={`/equipos/${equipo.id}`}
                          onEdit={() => handleAbrirEditar(equipo)}
                          onDelete={() => handleEliminar(equipo)}
                          isDeleting={eliminando === equipo.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        ))
      )}

      {equipos.length === 0 && temporadas.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <p className="text-slate-500 font-medium">
            No hay temporadas disponibles
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Crea una temporada primero
          </p>
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">
                {editando ? "Editar Equipo" : "Nuevo Equipo"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  Nombre del equipo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Ej: Senior Masculino, M18, M16..."
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  Categoría
                </label>
                <select
                  value={formData.categoriaId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoriaId: e.target.value })
                  }
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
                  Temporada
                </label>
                <select
                  value={formData.temporadaId}
                  onChange={(e) =>
                    setFormData({ ...formData, temporadaId: e.target.value })
                  }
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!editando}
                >
                  <option value="">Seleccionar...</option>
                  {temporadas.map((temp) => (
                    <option key={temp.id} value={temp.id}>
                      {temp.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.nombre || !formData.categoriaId || !formData.temporadaId}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : editando ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
