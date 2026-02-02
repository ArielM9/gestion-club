import { Suspense } from "react";
import EventList from "@/components/dashboard/EventList";
import StatCards from "@/components/dashboard/SatCards";
import QuickActions from "@/components/dashboard/QuickActions";

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-slate-500">Resumen de actividad del club</p>
      </div>

      

      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />}>
        <StatCards />
      </Suspense> 

      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />}>
        <QuickActions />
      </Suspense>
      <div className="mt-15">
      {/* Aquí es donde la magia ocurre */}
      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl " />}>
        <EventList />
      </Suspense>
      </div>
  
      
     
    </div>
  );
}