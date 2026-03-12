"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users, Trophy, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { crearCategoriaAction, actualizarCategoriaAction, eliminarCategoriaAction } from "@/lib/actions/admin/categorias";

interface Categoria {
  id: string;
  nombre: string;
  _count: {
    socios: number;
    equipos: number;
    inscripciones: number;
  };
}

interface AdminCategoriasProps {
  categorias: Categoria[];
}

export default function AdminCategorias({ categorias }: AdminCategoriasProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"crear" | "editar">("crear");
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const handleAbrirCrear = () => {
    setModalMode("crear");
    setCategoriaEditando(null);
    setNombre("");
    setShowModal(true);
  };

  const handleAbrirEditar = (categoria: Categoria) => {
    setModalMode("editar");
    setCategoriaEditando(categoria);
    setNombre(categoria.nombre);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setLoading(true);
    let res;

    if (modalMode === "crear") {
      res = await crearCategoriaAction(nombre);
    } else {
      res = await actualizarCategoriaAction(categoriaEditando!.id, nombre);
    }

    setLoading(false);

    if (res.success) {
      toast.success(modalMode === "crear" ? "Categoría creada" : "Categoría actualizada");
      setShowModal(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleEliminar = async (categoria: Categoria) => {
    if (!confirm(`¿Eliminar categoría "${categoria.nombre}"?`)) return;

    setEliminandoId(categoria.id);
    const res = await eliminarCategoriaAction(categoria.id);
    setEliminandoId(null);

    if (res.success) {
      toast.success("Categoría eliminada");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500">
            {categorias.length} categorías configuradas
          </p>
        </div>
        <button
          onClick={handleAbrirCrear}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"
        >
          <Plus size={18} />
          Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((categoria) => (
          <div
            key={categoria.id}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">{categoria.nombre}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => handleAbrirEditar(categoria)}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleEliminar(categoria)}
                  disabled={eliminandoId === categoria.id}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {eliminandoId === categoria.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-xl p-2">
                <Users size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="text-sm font-bold text-slate-700">{categoria._count.socios}</p>
                <p className="text-[10px] text-slate-400">Socios</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2">
                <Trophy size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="text-sm font-bold text-slate-700">{categoria._count.equipos}</p>
                <p className="text-[10px] text-slate-400">Equipos</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2">
                <FileText size={16} className="mx-auto text-slate-400 mb-1" />
                <p className="text-sm font-bold text-slate-700">{categoria._count.inscripciones}</p>
                <p className="text-[10px] text-slate-400">Inscritos</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl">
          <p className="text-slate-500 font-medium">No hay categorías configuradas</p>
          <p className="text-sm text-slate-400 mt-1">Crea la primera categoría para comenzar</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">
                {modalMode === "crear" ? "Nueva Categoría" : "Editar Categoría"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de la categoría</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: M6, M8, Senior Masculino..."
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">
                Utiliza el formato: M6, M8, M10, M12, M14, M16, M18, Senior Masculino, Senior Femenino
              </p>
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
                  disabled={loading || !nombre.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : modalMode === "crear" ? "Crear" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
