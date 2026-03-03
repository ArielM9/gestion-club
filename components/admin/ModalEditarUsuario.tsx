"use client";

import { useState } from "react";
import { X, Loader2, Pencil } from "lucide-react";
import { actualizarUsuario } from "@/lib/actions/admin/usuarios";
import { toast } from "sonner";

interface Usuario {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  status: string;
}

const ROLES = [
  { value: "COLABORADOR", label: "Colaborador", description: "Acceso básico" },
  { value: "CONTABILIDAD", label: "Contabilidad", description: "Gestión económica" },
  { value: "ADMIN", label: "Administrador", description: "Acceso total" },
];

interface ModalEditarUsuarioProps {
  usuario: Usuario;
  onClose: () => void;
  onUpdated: () => void;
}

export default function ModalEditarUsuario({ usuario, onClose, onUpdated }: ModalEditarUsuarioProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: usuario.email,
    name: usuario.name || "",
    username: usuario.username || "",
    role: usuario.role,
    status: usuario.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await actualizarUsuario(usuario.id, {
      email: formData.email,
      name: formData.name || undefined,
      username: formData.username || undefined,
      role: formData.role as "ADMIN" | "CONTABILIDAD" | "COLABORADOR",
      status: formData.status as "ACTIVE" | "PENDING" | "DISABLED",
    });

    setLoading(false);

    if (res.success) {
      toast.success("Usuario actualizado correctamente");
      onUpdated();
      onClose();
    } else {
      toast.error(res.error || "Error al actualizar usuario");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900">Editar Usuario</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Editando: <span className="font-bold text-slate-700">{usuario.email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="juan@club.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Juan García"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="jgarcia"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Rol *
            </label>
            <div className="space-y-2">
              {ROLES.map((rol) => (
                <label
                  key={rol.value}
                  className={`block p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.role === rol.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="role"
                      value={rol.value}
                      checked={formData.role === rol.value}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{rol.label}</p>
                      <p className="text-xs text-slate-400">{rol.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
              Estado *
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all cursor-pointer"
            >
              <option value="ACTIVE">Activo</option>
              <option value="PENDING">Pendiente</option>
              <option value="DISABLED">Deshabilitado</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1e293b] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
