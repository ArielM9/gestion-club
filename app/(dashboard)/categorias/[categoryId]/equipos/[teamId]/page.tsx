import { redirect } from "next/navigation";
import { getEquipoById } from "@/lib/actions/temporadas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import EquipoDetalleCliente from "./EquipoDetalleCliente";

interface PageProps {
  params: Promise<{ categoryId: string; teamId: string }>;
}

export default async function EquipoDetallePage({ params }: PageProps) {
  const { teamId } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const equipo = await getEquipoById(teamId);

  if (!equipo) {
    redirect("/categorias");
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <Link href={`/categorias/${equipo.categoriaId}`} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium">
        <ArrowLeft size={18} /> Volver a categoría
      </Link>

      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{equipo.nombre}</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
          {equipo.temporada.nombre} - {equipo.categoria.nombre}
        </p>
      </header>

      <EquipoDetalleCliente equipo={equipo} />
    </div>
  );
}
