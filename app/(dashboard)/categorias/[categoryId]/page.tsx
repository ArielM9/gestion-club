import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { getYearTemporada, getCategoriaPorAnoNacimiento } from "@/lib/utils/categorias";
import Link from "next/link";
import { ArrowLeft, Trophy, Users, AlertCircle } from "lucide-react";
import CategoriaCliente from "./CategoriaCliente";

interface PageProps {
  params: Promise<{ categoryId: string }>;
}

export default async function CategoriaDetallePage({ params }: PageProps) {
  const { categoryId } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const temporadaActiva = await prisma.temporada.findFirst({
    where: { activa: true }
  });

  const categoria = await prisma.categoria.findUnique({
    where: { id: categoryId },
    include: {
      equipos: {
        where: { temporadaId: temporadaActiva?.id },
        orderBy: { nombre: "asc" },
        include: {
          _count: {
            select: { inscripciones: true }
          }
        }
      }
    }
  });

  if (!categoria) {
    redirect("/categorias");
  }

  const equiposConJugadores = categoria.equipos.map(eq => ({
    id: eq.id,
    nombre: eq.nombre,
    federado: eq.federado,
    cerrado: eq.cerrado,
    jugadoresCount: eq._count.inscripciones
  }));

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <Link href="/categorias" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium">
        <ArrowLeft size={18} /> Volver a categorías
      </Link>

      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{categoria.nombre}</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
          {temporadaActiva ? temporadaActiva.nombre : "Sin temporada activa"}
        </p>
      </header>

      {temporadaActiva ? (
        <CategoriaCliente 
          categoria={categoria}
          temporadaActiva={temporadaActiva}
          equipos={equiposConJugadores}
        />
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-800 font-bold">No hay temporada activa</p>
        </div>
      )}
    </div>
  );
}
