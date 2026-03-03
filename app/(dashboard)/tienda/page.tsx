import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, ShoppingCart, Users, Truck, TrendingUp, ArrowRight } from "lucide-react";

export default async function TiendaPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role;

  const [productos, ventasRecientes, productosStockBajo] = await Promise.all([
    prisma.producto.count(),
    prisma.venta.count({
      where: { fecha: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }),
    prisma.productoTalla.count({
      where: { stock: { lte: 5 } }
    }),
  ]);

  const totalStock = await prisma.productoTalla.aggregate({
    _sum: { stock: true }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Tienda e Inventario</h1>
        <p className="text-slate-500 font-medium mt-1">Gestión de productos, ventas y entregas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Productos</p>
              <p className="text-2xl font-black text-slate-900">{productos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ventas (7 días)</p>
              <p className="text-2xl font-black text-slate-900">{ventasRecientes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stock Total</p>
              <p className="text-2xl font-black text-slate-900">{totalStock._sum.stock || 0}</p>
            </div>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-[2rem] border shadow-sm ${productosStockBajo > 0 ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${productosStockBajo > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <Truck className={`w-6 h-6 ${productosStockBajo > 0 ? 'text-red-600' : 'text-slate-600'}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Stock Bajo</p>
              <p className={`text-2xl font-black ${productosStockBajo > 0 ? 'text-red-600' : 'text-slate-900'}`}>{productosStockBajo}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/tienda/inventario" className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Package className="w-7 h-7 text-blue-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Inventario</h3>
          <p className="text-sm text-slate-500 mt-1">Gestiona productos y stock por tallas</p>
          <ArrowRight className="w-5 h-5 text-slate-300 mt-4 group-hover:translate-x-2 transition-transform" />
        </Link>

        <Link href="/tienda/ventas" className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-7 h-7 text-green-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Ventas</h3>
          <p className="text-sm text-slate-500 mt-1">Registra ventas directas y ver pendientes</p>
          <ArrowRight className="w-5 h-5 text-slate-300 mt-4 group-hover:translate-x-2 transition-transform" />
        </Link>

        <Link href="/tienda/entregas" className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7 text-purple-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Entregas</h3>
          <p className="text-sm text-slate-500 mt-1">Entrega ropa a jugadores registrados</p>
          <ArrowRight className="w-5 h-5 text-slate-300 mt-4 group-hover:translate-x-2 transition-transform" />
        </Link>

        <Link href="/tienda/pedidos" className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Truck className="w-7 h-7 text-amber-600" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Pedidos</h3>
          <p className="text-sm text-slate-500 mt-1">Herramienta para pedidos al proveedor</p>
          <ArrowRight className="w-5 h-5 text-slate-300 mt-4 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>

      {userRole === "ADMIN" && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-4">Herramientas de Administración</h3>
          <div className="flex gap-4">
            <Link href="/tienda/inventario/nuevo" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
              + Nuevo Producto
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
