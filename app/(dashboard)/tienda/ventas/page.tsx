import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Plus } from "lucide-react";
import VentasLista from "@/components/tienda/VentasLista";

export default async function VentasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const puedeAprobar = ['ADMIN', 'CONTABILIDAD', 'DIRECTIVA'].includes(userRole);

  const ventas = await prisma.venta.findMany({
    include: {
      socio: true,
      productos: {
        include: { producto: true }
      },
      aprobadoPor: true
    },
    orderBy: { fecha: 'desc' },
    take: 50
  });

  const pendientes = ventas.filter(v => v.estado === 'PENDIENTE' && v.metodo === 'EFECTIVO');
  const aprobadas = ventas.filter(v => v.estado === 'APROBADA');
  const rechazadas = ventas.filter(v => v.estado === 'RECHAZADA');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Ventas</h1>
          <p className="text-slate-500 font-medium mt-1">Registro de ventas y aprobaciones</p>
        </div>
        <Link href="/tienda/ventas/nueva" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2">
          <Plus size={18} /> Nueva Venta
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
          <p className="text-2xl font-black text-slate-900">{ventas.length}</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
          <p className="text-[10px] font-black text-amber-600 uppercase">Pendientes</p>
          <p className="text-2xl font-black text-amber-700">{pendientes.length}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-2xl border border-green-200">
          <p className="text-[10px] font-black text-green-600 uppercase">Aprobadas</p>
          <p className="text-2xl font-black text-green-700">{aprobadas.length}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
          <p className="text-[10px] font-black text-red-600 uppercase">Rechazadas</p>
          <p className="text-2xl font-black text-red-700">{rechazadas.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Historial de Ventas</h2>
        </div>

        {ventas.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No hay ventas registradas</p>
          </div>
        ) : (
          <VentasLista ventas={ventas} puedeAprobar={puedeAprobar} />
        )}
      </div>
    </div>
  );
}
