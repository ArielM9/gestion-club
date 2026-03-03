// components/dashboard/StatCards.tsx
import { Users, CreditCard, Calendar, Package } from "lucide-react";
import { getResumenStats } from "@/lib/data-fetching";
import StatCard from "@/components/ui/StatCard";

export default async function StatCards() {
  const stats = await getResumenStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        titulo="Socios Activos" 
        valor={stats.totalSocios} 
        icon={Users} 
        color="text-blue-600 bg-blue-50" 
        href="/jugadores"
      />
      <StatCard 
        titulo="Pagos Pendientes" 
        valor={stats.pagosPendientes} 
        icon={CreditCard} 
        color="text-red-600 bg-red-50" 
        href="/contabilidad?tab=deudores"
      />
      <StatCard 
        titulo="Próximo Evento" 
        valor={stats.proximoEvento} 
        icon={Calendar} 
        color="text-amber-600 bg-amber-50" 
        href="/eventos"
      />
      <StatCard 
        titulo="Stock Tienda" 
        valor={stats.stockBajo} 
        icon={Package} 
        color="text-emerald-600 bg-emerald-50" 
      />
    </div>
  );
}