import { Suspense } from "react";
import { getMovimientosGlobales, getSociosDeudores, getDatosGraficaMensual, getDatosGastosPorCategoria } from "@/lib/actions/contabilidad";
import ContabilidadTabs from "@/components/contabilidad/ContabilidadTabs";
import BotonesAccion from "@/components/contabilidad/BotonesAccion";

export default async function ContabilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; tab?: string }>;
}) {
  const { search, page } = await searchParams;
  const currentPage = Number(page) || 1;
  const query = search || "";

  // Pedimos todos los datos en paralelo para ir rápido
  const [dataGlobal, deudoresData, datosGrafica, datosCategorias] = await Promise.all([
    getMovimientosGlobales(),
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

      <Suspense fallback={<div className="min-h-[600px] flex items-center justify-center text-slate-400 font-bold animate-pulse">Cargando gestión...</div>}>
        <ContabilidadTabs
          resumen={dataGlobal.resumen}
          movimientos={dataGlobal.movimientos}
          deudores={deudoresData.deudores}
          totalPages={deudoresData.totalPages}
          currentPage={currentPage}
          datosGrafica={datosGrafica}
          datosCategorias={datosCategorias}
        />
      </Suspense>
    </div>
  );
}