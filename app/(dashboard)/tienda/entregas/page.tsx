import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { JugadorItem } from "@/components/ui/JugadorItem";
import { normalizeString } from "@/lib/utils/stringUtils";
import SearchEntregas from "@/components/tienda/SearchEntregas";
import Pagination from "@/components/jugadores/Pagination";

const ITEMS_PER_PAGE = 10;

export default async function EntregasPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { search, page } = await searchParams;
  const query = search || "";
  const currentPage = Number(page) || 1;

  const temporadaActiva = await prisma.temporada.findFirst({
    where: { activa: true }
  });

  if (!temporadaActiva) {
    return (
      <PageContainer title="Entregas a Jugadores">
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No hay temporada activa</p>
        </div>
      </PageContainer>
    );
  }

  const inscripciones = await prisma.inscripcion.findMany({
    where: { temporadaId: temporadaActiva.id },
    include: {
      socio: true,
      categoria: true
    },
    orderBy: { socio: { nombre: 'asc' } }
  });

  const queryNormalizada = normalizeString(query);

  const inscripcionesFiltradas = inscripciones.filter(inscripcion => {
    if (!query) return true;

    const camposABuscar = [
      inscripcion.socio.nombre,
      inscripcion.socio.apellidos,
      inscripcion.socio.dni,
      inscripcion.socio.mote || ""
    ];

    return camposABuscar.some(campo =>
      normalizeString(campo).includes(queryNormalizada)
    );
  });

  const totalCount = inscripcionesFiltradas.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const inscripcionesPaginadas = inscripcionesFiltradas.slice(skip, skip + ITEMS_PER_PAGE);

  const subtitle = query
    ? `Mostrando ${totalCount} de ${inscripciones.length} jugadores inscritos en ${temporadaActiva.nombre}`
    : `${totalCount} jugadores inscritos en ${temporadaActiva.nombre}`;

  return (
    <PageContainer
      title="Entregas a Jugadores"
      subtitle={subtitle}
    >
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-black text-slate-900">Jugadores por Categoría</h2>
          <div className="md:max-w-md md:flex-1">
            <SearchEntregas />
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {inscripcionesPaginadas.map(inscripcion => (
            <div key={inscripcion.id} className="p-6 hover:bg-slate-50 transition-colors">
              <JugadorItem
                jugador={{
                  ...inscripcion.socio,
                  categoria: { nombre: inscripcion.categoria.nombre }
                }}
                showCategoria
              />
            </div>
          ))}
          {inscripcionesPaginadas.length === 0 && (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-bold">No se encontraron jugadores</p>
              {query && (
                <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination totalPages={totalPages} currentPage={currentPage} />
        )}
      </div>
    </PageContainer>
  );
}
