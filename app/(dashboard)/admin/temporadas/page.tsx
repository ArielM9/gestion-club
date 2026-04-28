import { Suspense } from "react";
import { getTemporadas, getTemporadaActiva } from "@/lib/actions/temporadas";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminTemporadas from "./AdminTemporadas";
import { PageContainer } from "@/components/ui/PageContainer";

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
    <PageContainer
      title="Temporadas"
      subtitle="Gestiona las temporadas y precios"
      maxWidth="lg"
    >
      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />}>
        <AdminTemporadas 
          temporadas={temporadas}
          temporadaActiva={temporadaActiva}
          categorias={categorias}
        />
      </Suspense>
    </PageContainer>
  );
}
