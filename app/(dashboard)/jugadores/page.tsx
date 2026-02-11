import prisma from "@/lib/prisma";
import SocioTable from "@/components/jugadores/SocioTable";
import SearchJugadores from "@/components/jugadores/SearchJugadores";
import CategoryFilter from "@/components/jugadores/CategoryFilter"; // Tendrás que crearlo o usar un select
import { Plus } from "lucide-react";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

import { normalizeString } from "@/lib/utils/stringUtils";

export default async function JugadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; categoria?: string }>;
}) {
  // 1. Esperamos todos los params
  const { search, page, categoria } = await searchParams;

  const query = search || "";
  const currentPage = Number(page) || 1;
  const categoriaId = categoria || undefined;

  // 2. Traemos datos base (podemos optimizar trayendo solo lo necesario si la tabla crece mucho)
  const [todosLosSocios, categorias] = await Promise.all([
    prisma.socio.findMany({
      include: { categoria: true },
      orderBy: { apellidos: "asc" },
    }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } })
  ]);

  // 3. Filtrado en JS para soportar tildes de forma sencilla
  const queryNormalizada = normalizeString(query);

  const sociosFiltrados = todosLosSocios.filter(socio => {
    // Filtro por categoría
    if (categoriaId && socio.categoriaId !== categoriaId) return false;

    // Filtro por búsqueda
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

  // 4. Paginación manual
  const totalCount = sociosFiltrados.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const sociosPaginados = sociosFiltrados.slice(skip, skip + ITEMS_PER_PAGE);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Socios y Jugadores</h1>
          <p className="text-sm text-slate-500 font-medium">Lista general del club</p>
        </div>
        <Link
          href="/jugadores/nuevo"
          className="flex items-center gap-2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
        >
          <Plus size={18} /> Nuevo Socio
        </Link>
      </div>

      <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1">
          <SearchJugadores />
        </div>
        {/* Pasamos las categorías al filtro */}
        <CategoryFilter categorias={categorias} />
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-white overflow-hidden">
        <SocioTable
          socios={sociosPaginados}
          totalPages={totalPages}
          currentPage={currentPage}
        />
      </div>
    </div>
  );
}