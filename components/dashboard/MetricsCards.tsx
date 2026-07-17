import { Users, AlertTriangle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { getDashboardMetrics } from "@/lib/data-fetching";

export default async function MetricsCards() {
  const metrics = await getDashboardMetrics();

  const deudaFormateada = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(metrics.deudaTotal);

  return (
    <section aria-labelledby="metrics-heading">
      <h2 id="metrics-heading" className="sr-only">
        Métricas clave
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          titulo="Socios Activos"
          valor={metrics.totalSocios}
          icon={Users}
          color="text-blue-600 bg-blue-50"
          href="/jugadores"
        />
        <StatCard
          titulo={
            metrics.sociosConDeuda > 0
              ? `Deuda Total (${metrics.sociosConDeuda})`
              : "Deuda Total"
          }
          valor={deudaFormateada}
          icon={AlertTriangle}
          color="text-red-600 bg-red-50"
          href="/contabilidad?tab=deudores"
        />
      </div>
    </section>
  );
}
