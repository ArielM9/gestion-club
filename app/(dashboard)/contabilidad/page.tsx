import { Suspense } from "react";
import { getMovimientosGlobales, getSociosDeudores, getDatosGraficaMensual, getDatosGastosPorCategoria } from "@/lib/actions/contabilidad";
import ContabilidadTabs from "@/components/contabilidad/ContabilidadTabs";
import BotonesAccion from "@/components/contabilidad/BotonesAccion";

export default async function ContabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; tab?: string; filtro?: string }>;
}) {
  const { search, page, filtro } = await searchParams;
  const currentPage = Number(page) || 1;
  const query = search || "";
  const tipoFiltro = filtro || "todos";

  const [dataGlobal, deudoresData, datosGrafica, datosCategorias] = await Promise.all([
    getMovimientosGlobales(query, currentPage, tipoFiltro),
    getSociosDeudores(query, currentPage, 10),
    getDatosGraficaMensual(),
    getDatosGastosPorCategoria()
  ]);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión Financiera</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Temporada 2025/2026</p>
        </div>

        <BotonesAccion />
      </header>

      {!dataGlobal.resumen ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-amber-800 font-bold text-lg">No hay temporada activa</p>
          <p className="text-amber-600 text-sm mt-2">Crea una temporada en <a href="/admin/temporadas" className="underline hover:text-amber-700">Administración de Temporadas</a> para ver los datos financieros.</p>
        </div>
      ) : (
        <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center text-slate-400 font-bold animate-pulse">Cargando gestión...</div>}>
          <ContabilidadTabs
            resumen={dataGlobal.resumen}
            movimientos={dataGlobal.movimientos}
            deudores={deudoresData.deudores}
            totalPages={deudoresData.totalPages}
            currentPage={currentPage}
            datosGrafica={datosGrafica}
            datosCategorias={datosCategorias}
            movimientosTotalPages={dataGlobal.totalPages}
            movimientosTotalItems={dataGlobal.totalItems}
          />
        </Suspense>
      )}
    </div>
  );
}