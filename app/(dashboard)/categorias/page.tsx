import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Trophy, Users, Calendar, ChevronRight, AlertCircle } from "lucide-react";

export default async function CategoriasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const temporadaActiva = await prisma.temporada.findFirst({
    where: { activa: true }
  });

  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: "asc" },
    include: {
      equipos: {
        where: { temporadaId: temporadaActiva?.id },
        include: {
          inscripciones: true
        }
      }
    }
  });

  const inscripcionesTemporada = temporadaActiva 
    ? await prisma.inscripcion.findMany({
        where: { temporadaId: temporadaActiva.id },
        select: { equipoId: true, socioId: true, categoriaId: true }
      })
    : [];

  const jugadoresPorCategoria = new Map<string, number>();
  for (const ins of inscripcionesTemporada) {
    if (ins.categoriaId) {
      const current = jugadoresPorCategoria.get(ins.categoriaId) || 0;
      jugadoresPorCategoria.set(ins.categoriaId, current + 1);
    }
  }

  const equiposPorCategoria = new Map<string, Set<string>>();
  for (const ins of inscripcionesTemporada) {
    if (ins.equipoId) {
      if (!equiposPorCategoria.has(ins.equipoId)) {
        equiposPorCategoria.set(ins.equipoId, new Set());
      }
      equiposPorCategoria.get(ins.equipoId)!.add(ins.socioId);
    }
  }

  const categoriasConDatos = categorias.map(cat => {
    const equiposActivos = cat.equipos.filter(e => !e.cerrado);
    let totalFederados = 0;
    for (const eq of equiposActivos) {
      totalFederados += equiposPorCategoria.get(eq.id)?.size || 0;
    }
    const totalInscritos = jugadoresPorCategoria.get(cat.id) || 0;
    return {
      ...cat,
      equiposActivos,
      totalFederados,
      totalInscritos
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Categorías</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
          {temporadaActiva ? temporadaActiva.nombre : "Sin temporada activa"}
        </p>
      </header>

      {!temporadaActiva && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4">
          <AlertCircle className="text-amber-600" size={24} />
          <div>
            <p className="font-bold text-amber-800">No hay temporada activa</p>
            <p className="text-sm text-amber-600">Crea una temporada para gestionar las categorías</p>
          </div>
          <Link href="/admin/temporadas" className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm">
            Ir a Temporadas
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {categoriasConDatos.map((categoria) => (
          <Link
            key={categoria.id}
            href={temporadaActiva ? `/categorias/${categoria.id}` : "#"}
            className={`block bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all ${!temporadaActiva ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{categoria.nombre}</h2>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Users size={12} /> {categoria.totalInscritos} inscritos
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar size={12} /> {categoria.equiposActivos.length} equipos
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={20} className="text-slate-300" />
            </div>
          </Link>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="bg-white rounded-[2rem] p-12 text-center">
          <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-400 font-medium">No hay categorías creadas</p>
        </div>
      )}
    </div>
  );
}
