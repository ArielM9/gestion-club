import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { JugadorItem } from "@/components/ui/JugadorItem";

export default async function EntregasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const temporadaActiva = await prisma.temporada.findFirst({
    where: { activa: true }
  });

  if (!temporadaActiva) {
    return (
      <PageContainer title="Entregas a Jugadores">
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No hay temporada activa</p>
        </div>
      </PageContainer>
    );
  }

  const inscripciones = await prisma.inscripcion.findMany({
    where: { temporadaId: temporadaActiva.id },
    include: {
      socio: true,
      categoria: true
    },
    orderBy: { socio: { nombre: 'asc' } }
  });

  return (
    <PageContainer
      title="Entregas a Jugadores"
      subtitle={`${inscripciones.length} jugadores inscritos en ${temporadaActiva.nombre}`}
    >
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Jugadores por Categoría</h2>
        </div>

        <div className="divide-y divide-slate-50">
          {inscripciones.map(inscripcion => (
            <div key={inscripcion.id} className="p-6 hover:bg-slate-50 transition-colors">
              <JugadorItem
                jugador={{
                  ...inscripcion.socio,
                  categoria: { nombre: inscripcion.categoria.nombre }
                }}
                showCategoria
              />
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
