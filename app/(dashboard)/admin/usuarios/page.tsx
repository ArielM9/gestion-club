import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUsuarios } from "@/lib/actions/admin/usuarios";
import UsuariosTable from "@/components/admin/UsuariosTable";
import { Plus } from "lucide-react";
import Link from "next/link";
import ModalCrearUsuario from "@/components/admin/ModalCrearUsuario";

export default async function AdminUsuariosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const result = await getUsuarios();
  const usuarios = result.success ? result.data : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Usuarios</h1>
          <p className="text-sm text-slate-500 font-medium">
            Gestiona los usuarios y sus permisos de acceso
          </p>
        </div>
        <ModalCrearUsuario />
      </div>

      <UsuariosTable usuarios={usuarios} />
    </div>
  );
}
