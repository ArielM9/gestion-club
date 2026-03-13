import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminEquipos from "./AdminEquipos";

export default async function EquiposPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;

  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA") {
    redirect("/");
  }

  const [equipos, categorias, temporadas] = await Promise.all([
    prisma.equipo.findMany({
      include: {
        categoria: true,
        temporada: true,
      },
      orderBy: [{ temporada: { nombre: "desc" } }, { nombre: "asc" }],
    }),
    prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
    }),
    prisma.temporada.findMany({
      orderBy: { fechaInicio: "desc" },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Gestión de Equipos
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
          Administra los equipos del club
        </p>
      </header>

      <Suspense
        fallback={
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
        }
      >
        <AdminEquipos
          equipos={equipos}
          categorias={categorias}
          temporadas={temporadas}
        />
      </Suspense>
    </div>
  );
}
