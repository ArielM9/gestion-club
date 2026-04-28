import prisma from "@/lib/prisma";
import EventTable from "@/components/eventos/EventTable";
import SearchEventos from "@/components/eventos/SearchEventos";
import TipoFilter from "@/components/eventos/TipoFilter";
import { PageContainer } from "@/components/ui/PageContainer";
import { Plus } from "lucide-react";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

import { normalizeString } from "@/lib/utils/stringUtils";

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; tipo?: string }>;
}) {
  const { search, page, tipo } = await searchParams;

  const query = search || "";
  const currentPage = Number(page) || 1;
  const tipoFilter = tipo || undefined;

  const [todosLosEventos, equipos] = await Promise.all([
    prisma.evento.findMany({
      include: { equipo: { include: { categoria: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.equipo.findMany({
      include: { categoria: true, temporada: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const queryNormalizada = normalizeString(query);

  const eventosFiltrados = todosLosEventos.filter((evento) => {
    if (tipoFilter && evento.tipo !== tipoFilter) return false;

    if (!query) return true;

    const camposABuscar = [
      evento.ubicacion,
      evento.titulo || "",
      evento.rival || "",
      evento.equipo?.nombre || "",
    ];

    return camposABuscar.some((campo) =>
      normalizeString(campo).includes(queryNormalizada)
    );
  });

  const eventosProximos = eventosFiltrados.filter(
    (e) => new Date(e.fecha) >= new Date()
  );
  const eventosPasados = eventosFiltrados.filter(
    (e) => new Date(e.fecha) < new Date()
  );

  const totalCount = eventosFiltrados.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const eventosPaginados = eventosFiltrados.slice(skip, skip + ITEMS_PER_PAGE);

  return (
    <PageContainer
      title="Eventos"
      subtitle="Partidos, torneos, reuniones y eventos del club"
      actions={
        <Link
          href="/eventos/nuevo"
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
        >
          <Plus size={18} /> Nuevo Evento
        </Link>
      }
    >
      <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <SearchEventos />
        </div>
        <div className="w-full md:w-auto">
          <TipoFilter />
        </div>
      </div>

      <EventTable
        eventos={eventosPaginados}
        equipos={equipos}
        totalPages={totalPages}
        currentPage={currentPage}
        totalCount={totalCount}
        eventosProximos={eventosProximos}
        eventosPasados={eventosPasados}
      />
    </PageContainer>
  );
}
