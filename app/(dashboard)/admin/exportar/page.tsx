import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getTemporadasParaExport } from "@/lib/actions/admin/exportar";
import ExportarCliente from "./ExportarCliente";

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
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900">Exportar Datos</h1>
        <p className="text-slate-500 font-medium mt-1">
          Descarga los datos del club en formato CSV
        </p>
      </header>

      <ExportarCliente temporadas={temporadas} />
    </div>
  );
}
