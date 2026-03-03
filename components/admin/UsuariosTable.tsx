"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, UserCog, RefreshCcw, ToggleLeft, ToggleRight, Pencil } from "lucide-react";
import { toggleUsuarioStatus, resetPassword } from "@/lib/actions/admin/usuarios";
import { toast } from "sonner";
import ModalEditarUsuario from "./ModalEditarUsuario";

interface Usuario {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  role: string;
  status: string;
  mustChangePassword: boolean;
  createdAt: Date;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  CONTABILIDAD: "Contabilidad",
  COLABORADOR: "Colaborador",
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-50 text-green-600",
  PENDING: "bg-amber-50 text-amber-600",
  DISABLED: "bg-red-50 text-red-600",
};

export default function UsuariosTable({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [editandoUsuario, setEditandoUsuario] = useState<Usuario | null>(null);

  const handleToggleStatus = async (id: string) => {
    setLoadingAction(id);
    const res = await toggleUsuarioStatus(id);
    setLoadingAction(null);

    if (res.success) {
      toast.success(res.nuevoEstado === "ACTIVE" ? "Usuario activado" : "Usuario desactivado");
      router.refresh();
    } else {
      toast.error(res.error || "Error al cambiar estado");
    }
  };

  const handleResetPassword = async (id: string) => {
    setLoadingAction(id);
    const res = await resetPassword(id);
    setLoadingAction(null);

    if (res.success && res.tempPassword) {
      toast.success(`Contraseña reseteada: ${res.tempPassword}`);
    } else {
      toast.error(res.error || "Error al resetear contraseña");
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 border border-slate-100 shadow-sm text-center">
        <UserCog size={48} className="mx-auto text-slate-200 mb-4" />
        <p className="text-slate-500 font-medium">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Rol</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acceso</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {usuario.name || usuario.username || "Sin nombre"}
                      </p>
                      {usuario.username && (
                        <p className="text-xs text-slate-400">@{usuario.username}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{usuario.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">
                      {roleLabels[usuario.role] || usuario.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${statusColors[usuario.status] || statusColors.PENDING}`}>
                      {usuario.status === "ACTIVE" ? "Activo" : usuario.status === "DISABLED" ? "Deshabilitado" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {usuario.mustChangePassword ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                        Debe cambiar contraseña
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Normal</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={() => setExpandedId(expandedId === usuario.id ? null : usuario.id)}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                        <MoreHorizontal size={18} className="text-slate-400" />
                      </button>

                      {expandedId === usuario.id && (
                        <div className="absolute w-80 right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-10 min-w-[180px]">
                          <button
                            onClick={() => {
                              setExpandedId(null);
                              setEditandoUsuario(usuario);
                            }}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Pencil size={16} />
                            Editar usuario
                          </button>
                          <button
                            onClick={() => handleToggleStatus(usuario.id)}
                            disabled={loadingAction === usuario.id}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                          >
                            {usuario.status === "ACTIVE" ? (
                              <>
                                <ToggleLeft size={16} />
                                Desactivar usuario
                              </>
                            ) : (
                              <>
                                <ToggleRight size={16} />
                                Activar usuario
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleResetPassword(usuario.id)}
                            disabled={loadingAction === usuario.id}
                            className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                          >
                            <RefreshCcw size={16} />
                            Resetear contraseña
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editandoUsuario && (
        <ModalEditarUsuario
          usuario={editandoUsuario}
          onClose={() => setEditandoUsuario(null)}
          onUpdated={() => router.refresh()}
        />
      )}
    </>
  );
}
