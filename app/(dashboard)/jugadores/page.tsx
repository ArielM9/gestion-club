import prisma from "@/lib/prisma";
import SocioTable from "@/components/jugadores/SocioTable";
import SearchJugadores from "@/components/jugadores/SearchJugadores";
import CategoryFilter from "@/components/jugadores/CategoryFilter";
import { PageContainer } from "@/components/ui/PageContainer";
import { Plus } from "lucide-react";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

import { normalizeString } from "@/lib/utils/stringUtils";

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; categoria?: string }>;
}) {
  const { search, page, categoria } = await searchParams;

  const query = search || "";
  const currentPage = Number(page) || 1;
  const categoriaId = categoria || undefined;

  const [todosLosSocios, categorias] = await Promise.all([
    prisma.socio.findMany({
      include: { categoria: true },
      orderBy: { apellidos: "asc" },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } })
  ]);

  const queryNormalizada = normalizeString(query);

  const sociosFiltrados = todosLosSocios.filter(socio => {
    if (categoriaId && socio.categoriaId !== categoriaId) return false;

    if (!query) return true;

    const camposABuscar = [
      socio.nombre,
      socio.apellidos,
      socio.dni,
      socio.mote || ""
    ];

    return camposABuscar.some(campo =>
      normalizeString(campo).includes(queryNormalizada)
    );
  });

  const totalCount = sociosFiltrados.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const sociosPaginados = sociosFiltrados.slice(skip, skip + ITEMS_PER_PAGE);

  return (
    <PageContainer
      title="Socios y Jugadores"
      subtitle="Lista general del club"
      actions={
        <Link
          href="/jugadores/nuevo"
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
        >
          <Plus size={18} /> Nuevo Socio
        </Link>
      }
    >
      <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <SearchJugadores />
        </div>
        <CategoryFilter categorias={categorias} />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-white overflow-hidden">
        <SocioTable
          socios={sociosPaginados}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      </div>
    </PageContainer>
  );
}