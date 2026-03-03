import { Suspense } from "react";
import { getTemporadas, getTemporadaActiva } from "@/lib/actions/temporadas";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminTemporadas from "./AdminTemporadas";

export default async function TemporadasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;
  
  // Solo ADMIN y DIRECTIVA pueden acceder
  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA") {
    redirect("/");
  }

  const [temporadas, temporadaActiva, categorias] = await Promise.all([
    getTemporadas(),
    getTemporadaActiva(),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Temporadas</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
          Administra las temporadas del club
        </p>
      </header>

      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />}>
        <AdminTemporadas 
          temporadas={temporadas}
          temporadaActiva={temporadaActiva}
          categorias={categorias}
        />
      </Suspense>
    </div>
  );
}
