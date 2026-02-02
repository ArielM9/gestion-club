// app/(dashboard)/jugadores/page.tsx
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import SocioTable from "@/components/jugadores/SocioTable";
import prisma from "@/lib/prisma";


export default async function JugadoresPage() {
  // Traemos los socios de la base de datos
  const socios = await prisma.socio.findMany({
    orderBy: { apellidos: 'asc' },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Cabecera de la página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Socios y Jugadores</h1>
          <p className="text-sm text-slate-500 font-medium">Gestiona las fichas, estados y datos de contacto.</p>
        </div>
        
        <Link 
          href="/jugadores/nuevo" 
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 w-fit"
        >
          <Plus size={18} /> Nuevo Socio
        </Link>
      </div>

      {/* Barra de Herramientas (Buscador y Filtros) */}
      <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellidos o DNI..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-100 transition-all w-full md:w-auto justify-center">
          <Filter size={16} /> Filtros
        </button>
      </div>

      {/* Tabla de Socios */}
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden">
        <SocioTable socios={socios} />
      </div>
    </div>
  );
}