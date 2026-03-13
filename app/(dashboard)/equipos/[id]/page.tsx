import { Suspense } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EquipoDetalle from "./EquipoDetalle";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EquipoPage({ params }: Props) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;

  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA") {
    redirect("/");
  }

  const equipo = await prisma.equipo.findUnique({
    where: { id },
    include: {
      categoria: true,
      temporada: true,
      inscripciones: {
        include: {
          socio: {
            include: {
              categoria: true,
            },
          },
        },
      },
    },
  });

  if (!equipo) {
    notFound();
  }

  const todosLosSocios = await prisma.socio.findMany({
    where: { activo: true },
    include: { categoria: true },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Suspense
        fallback={
          <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
        }
      >
        <EquipoDetalle
          equipo={equipo}
          todosLosSocios={todosLosSocios}
        />
      </Suspense>
    </div>
  );
}
