import prisma from "@/lib/prisma";
import SocioTable from "@/components/jugadores/SocioTable";
import SearchJugadores from "@/components/jugadores/SearchJugadores";
import CategoryFilter from "@/components/jugadores/CategoryFilter"; // Tendrás que crearlo o usar un select
import { Plus } from "lucide-react";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

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

  // 2. Construimos el filtro WHERE
  const where = {
    categoriaId: categoriaId, // Si es undefined, Prisma ignora el filtro
    OR: query ? [
      { nombre: { contains: query, mode: "insensitive" as const } },
      { apellidos: { contains: query, mode: "insensitive" as const } },
      { dni: { contains: query, mode: "insensitive" as const } },
      { mote: { contains: query, mode: "insensitive" as const } },
    ] : undefined,
  };

  // 3. Consultas paralelas: Socios paginados, Total para la cuenta y Categorías para el filtro
  const [socios, totalCount, categorias] = await Promise.all([
    prisma.socio.findMany({
      where,
      include: { categoria: true },
      orderBy: { apellidos: "asc" },
      skip: (currentPage - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.socio.count({ where }),
    prisma.categoria.findMany({ orderBy: { nombre: "asc" } })
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
          socios={socios} 
          totalPages={totalPages} 
          currentPage={currentPage} 
        />
      </div>
    </div>
  );
}