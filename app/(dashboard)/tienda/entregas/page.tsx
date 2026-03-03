import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Package, ArrowRight } from "lucide-react";

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
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">No hay temporada activa</p>
      </div>
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Entregas a Jugadores</h1>
          <p className="text-slate-500 font-medium mt-1">
            {inscripciones.length} jugadores inscritos en {temporadaActiva.nombre}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Jugadores por Categoría</h2>
        </div>

        <div className="divide-y divide-slate-50">
          {inscripciones.map(inscripcion => (
            <div key={inscripcion.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <p className="font-black text-slate-900">
                  {inscripcion.socio.nombre} {inscripcion.socio.apellidos}
                </p>
                <p className="text-xs text-slate-500">
                  {inscripcion.categoria.nombre} · {inscripcion.socio.tallaRopa || 'Sin talla'}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Link 
                  href={`/jugadores/${inscripcion.socio.id}`}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  Ver Ficha
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
