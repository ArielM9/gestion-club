import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import FichaEvento from "../../../../components/eventos/FichaEvento";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventoPage({ params }: PageProps) {
  const { id } = await params;

  const evento = await prisma.evento.findUnique({
    where: { id },
    include: {
      equipo: {
        include: { categoria: true },
      },
    },
  });

  const equipos = await prisma.equipo.findMany({
    include: {
      categoria: true,
      temporada: true,
    },
    orderBy: { nombre: "asc" },
  });

  if (!evento) notFound();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <FichaEvento evento={evento} equipos={equipos} />
    </div>
  );
}
