"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { crearUsuario } from "@/lib/actions/admin/usuarios";
import { toast } from "sonner";

const ROLES = [
  { value: "COLABORADOR", label: "Colaborador", description: "Acceso básico" },
  { value: "CONTABILIDAD", label: "Contabilidad", description: "Gestión económica" },
  { value: "ADMIN", label: "Administrador", description: "Acceso total" },
];

export default function ModalCrearUsuario() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    role: "COLABORADOR",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await crearUsuario({
      name: formData.name || undefined,
      email: formData.email,
      username: formData.username || undefined,
      role: formData.role as "ADMIN" | "CONTABILIDAD" | "COLABORADOR",
    });

    setLoading(false);

    if (res.success && res.tempPassword) {
      setTempPassword(res.tempPassword);
      toast.success("Usuario creado correctamente");
    } else {
      toast.error(res.error || "Error al crear usuario");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setTempPassword(null);
    setFormData({ name: "", email: "", username: "", role: "COLABORADOR" });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
      >
        <Plus size={18} /> Nuevo Usuario
      </button>
    );
  }

  if (tempPassword) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-black text-slate-900 mb-4">Usuario Creado</h3>
          <p className="text-slate-500 font-medium mb-4">
            El usuario ha sido creado. Comparte esta contraseña temporal:
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-3xl font-black text-amber-600 text-center tracking-widest">
              {tempPassword}
            </p>
            <p className="text-xs text-amber-700 text-center mt-2">
              El usuario deberá cambiar esta contraseña al iniciar sesión
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full bg-[#1e293b] text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-slate-900">Nuevo Usuario</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-xl">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
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
                  Creando...
                </>
              ) : (
                "Crear Usuario"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
