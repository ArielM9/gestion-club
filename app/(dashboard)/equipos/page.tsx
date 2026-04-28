import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminEquipos from "./AdminEquipos";
import { PageContainer } from "@/components/ui/PageContainer";

export default async function EquiposPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;

  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA") {
    redirect("/");
  }

  const [equipos, categorias, temporadas, temporadaActiva] = await Promise.all([
    prisma.equipo.findMany({
      include: {
        categoria: true,
        temporada: true,
        _count: {
          select: { inscripciones: true },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.categoria.findMany({
      orderBy: { nombre: "asc" },
    }),
    prisma.temporada.findMany({
      orderBy: { fechaInicio: "desc" },
    }),
    prisma.temporada.findFirst({
      where: { activa: true },
    }),
  ]);

  const equiposTemporadaActiva = temporadaActiva
    ? equipos.filter((e) => e.temporadaId === temporadaActiva.id)
    : [];

  return (
    <PageContainer
      title="Gestión de Equipos"
      subtitle="Administra los equipos del club"
      maxWidth="lg"
    >
      <Suspense
        fallback={
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
        }
      >
        <AdminEquipos
          equipos={equiposTemporadaActiva}
          categorias={categorias}
          temporadas={temporadas}
          temporadaActiva={temporadaActiva}
        />
      </Suspense>
    </PageContainer>
  );
}
