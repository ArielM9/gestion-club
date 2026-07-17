import prisma from "@/lib/prisma";
import SocioTable from "@/components/jugadores/SocioTable";
import SearchJugadores from "@/components/jugadores/SearchJugadores";
import CategoryFilter from "@/components/jugadores/CategoryFilter";
import JugadoresPageActions from "@/components/jugadores/JugadoresPageActions";
import { PageContainer } from "@/components/ui/PageContainer";
import { Users } from "lucide-react";
import { getSociosInscritosEnTemporadaActiva } from "@/lib/actions/socios";

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

  const [todosLosSocios, categorias, temporadaActiva] = await Promise.all([
    getSociosInscritosEnTemporadaActiva(),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } }),
    prisma.temporada.findFirst({ where: { activa: true } }),
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
      actions={<JugadoresPageActions />}
    >
      <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <SearchJugadores />
        </div>
        <CategoryFilter categorias={categorias} />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-white overflow-hidden">
        {todosLosSocios.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="font-bold">No hay jugadores inscritos</p>
            <p className="text-sm mt-1">
              {temporadaActiva
                ? "Inscribe jugadores desde su ficha de perfil"
                : "Crea una temporada activa primero"}
            </p>
          </div>
        ) : (
          <SocioTable
            socios={sociosPaginados}
            totalPages={totalPages}
            currentPage={currentPage}
          />
        )}
      </div>
    </PageContainer>
  );
}