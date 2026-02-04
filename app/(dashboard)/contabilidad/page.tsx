import { getMovimientosGlobales } from "@/lib/actions/contabilidad";
import CardKpi from "@/components/contabilidad/CardKpi";
import LibroDiario from "@/components/contabilidad/LibroDiario";

export default async function ContabilidadPage() {
  const { movimientos, resumen } = await getMovimientosGlobales();

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardKpi title="Saldo Total en Cuenta" value={resumen?.saldoTotal || 0} type="balance" />
        <CardKpi title="Ingresos Totales" value={resumen?.ingresosTotales || 0} trend="+12%" type="income" />
        <CardKpi title="Gastos Totales" value={resumen?.gastosTotales || 0} trend="-3%" type="expense" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
        {/* Aquí irán los Recharts en el siguiente paso */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 font-bold italic">Gráfica Mensual</div>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 font-bold italic">Desglose Categorías</div>
      </div>

      <LibroDiario movimientos={movimientos} />
    </div>
  );
}