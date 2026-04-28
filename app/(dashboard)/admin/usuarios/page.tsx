import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUsuarios } from "@/lib/actions/admin/usuarios";
import UsuariosTable from "@/components/admin/UsuariosTable";
import ModalCrearUsuario from "@/components/admin/ModalCrearUsuario";
import { PageContainer } from "@/components/ui/PageContainer";

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
    <PageContainer
      title="Usuarios"
      subtitle="Gestiona los usuarios y sus permisos de acceso"
      maxWidth="lg"
      actions={<ModalCrearUsuario />}
    >
      <UsuariosTable usuarios={usuarios} />
    </PageContainer>
  );
}
