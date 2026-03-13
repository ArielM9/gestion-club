"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users, Trophy, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  crearEquipoAction,
  actualizarEquipoAction,
  eliminarEquipoAction,
} from "@/lib/actions/equipos";

interface Categoria {
  id: string;
  nombre: string;
}

interface Temporada {
  id: string;
  nombre: string;
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
}

export default function AdminEquipos({
  equipos,
  categorias,
  temporadas,
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">
            {equipos.length} equipos configurados
          </p>
        </div>
        <button
          onClick={handleAbrirCrear}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"
        >
          <Plus size={18} />
          Nuevo Equipo
        </button>
      </div>

      {temporadasAgrupadas.map((t) => (
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
              <p className="text-sm text-slate-400 mt-1">
                Crea el primer equipo para comenzar
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {t.equipos.map((equipo) => (
                <div
                  key={equipo.id}
                  className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-900">
                      {equipo.nombre}
                    </h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAbrirEditar(equipo)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminar(equipo)}
                        disabled={eliminando === equipo.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {eliminando === equipo.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-slate-500">
                      Categoría:{" "}
                      <span className="font-bold text-slate-700">
                        {equipo.categoria.nombre}
                      </span>
                    </p>
                  </div>

                  <Link
                    href={`/equipos/${equipo.id}`}
                    className="block w-full text-center py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Ver Equipo
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

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
