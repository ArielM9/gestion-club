import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, Plus, AlertTriangle } from "lucide-react";

export default async function InventarioPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const productos = await prisma.producto.findMany({
    include: {
      tallas: {
        orderBy: { talla: 'asc' }
      }
    },
    orderBy: { categoria: 'asc' }
  });

  const categorias = [...new Set(productos.map(p => p.categoria))] as string[];

  const totalStock = productos.reduce((acc, p) => 
    acc + p.tallas.reduce((t, ta) => t + ta.stock, 0), 0
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Inventario</h1>
          <p className="text-slate-500 font-medium mt-1">
            {productos.length} productos · {totalStock} unidades en stock
          </p>
        </div>
        {session.user.role === "ADMIN" && (
          <Link href="/tienda/inventario/nuevo" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus size={18} /> Nuevo Producto
          </Link>
        )}
      </div>

      {categorias.map(cat => {
        const prods = productos.filter(p => p.categoria === cat);
        const catStock = prods.reduce((acc, p) => acc + p.tallas.reduce((t, ta) => t + ta.stock, 0), 0);
        
        return (
          <div key={cat} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-slate-900">{cat}</h2>
                <p className="text-xs text-slate-500">{prods.length} productos · {catStock} unidades</p>
              </div>
            </div>
            
            <div className="divide-y divide-slate-50">
              {prods.map(producto => {
                const stockTotal = producto.tallas.reduce((t, ta) => t + ta.stock, 0);
                const stockBajo = producto.tallas.some(t => t.stock <= 5);
                
                return (
                  <div key={producto.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stockBajo ? 'bg-red-100' : 'bg-slate-100'}`}>
                      {stockBajo ? (
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-black text-slate-900">{producto.nombre}</h3>
                      <p className="text-xs text-slate-500">{producto.descripcion}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">{stockTotal}</p>
                      <p className="text-[10px] text-slate-400 uppercase">unidades</p>
                    </div>
                    
                    <div className="flex gap-1">
                      {producto.tallas.slice(0, 6).map(talla => (
                        <span 
                          key={talla.id} 
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${talla.stock > 5 ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'}`}
                          title={`${talla.talla}: ${talla.stock} uds`}
                        >
                          {talla.talla.replace('Talla ', 'T').replace('Única', 'Ú')}
                        </span>
                      ))}
                      {producto.tallas.length > 6 && (
                        <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-400">
                          +{producto.tallas.length - 6}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
