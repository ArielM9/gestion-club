import { redirect } from "next/navigation";
import { getTemporadas } from "@/lib/actions/temporadas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Calendar, ChevronRight, Lock } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";

export default async function HistoricoPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;
  
  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA" && userRole !== "CONTABILIDAD") {
    redirect("/");
  }

  const temporadas = await getTemporadas();

  return (
    <PageContainer
      title="Histórico de Temporadas"
      subtitle="Consulta información de temporadas anteriores"
      maxWidth="lg"
    >

      <div className="grid gap-4">
        {temporadas.map((temporada) => (
          <Link
            key={temporada.id}
            href={`/historico/${temporada.id}`}
            className="block bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${temporada.activa ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                  <Calendar size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{temporada.nombre}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">
                      {new Date(temporada.fechaInicio).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                      {" - "}
                      {new Date(temporada.fechaFin).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    {temporada.activa && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        ACTIVA
                      </span>
                    )}
                    {!temporada.activa && (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock size={10} /> CERRADA
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-400">Equipos</p>
                  <p className="font-bold text-slate-700">{temporada.equipos.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Inscritos</p>
                  <p className="font-bold text-slate-700">{temporada._count.inscripciones}</p>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {temporadas.length === 0 && (
        <div className="bg-white rounded-[2rem] p-12 text-center">
          <p className="text-slate-400 font-medium">No hay temporadas registradas</p>
        </div>
      )}
    </PageContainer>
  );
}
