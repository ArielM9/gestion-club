import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTemporadasParaExport } from "@/lib/actions/admin/exportar";
import ExportarCliente from "./ExportarCliente";
import { PageContainer } from "@/components/ui/PageContainer";

export default async function ExportarPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role;
  
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  const temporadas = await getTemporadasParaExport();

  return (
    <PageContainer
      title="Exportar Datos"
      subtitle="Descarga los datos del club en formato CSV"
      maxWidth="lg"
    >

      <ExportarCliente temporadas={temporadas} />
    </PageContainer>
  );
}
