import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Truck, AlertTriangle, Package } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";

export default async function PedidosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const productos = await prisma.producto.findMany({
    where: { activoPedido: true },
    include: {
      tallas: {
        orderBy: { stock: 'asc' }
      }
    },
    orderBy: { categoria: 'asc' }
  });

  const umbralMinimo = 10;
  
  const productosConStockBajo = productos.filter(p => 
    p.tallas.some(t => t.stock <= umbralMinimo)
  );

  const categoriasAgrupadas: Record<string, typeof productos> = {};
  for (const p of productosConStockBajo) {
    if (!categoriasAgrupadas[p.categoria]) {
      categoriasAgrupadas[p.categoria] = [];
    }
    categoriasAgrupadas[p.categoria].push(p);
  }

  const totalUnidadesBajo = productosConStockBajo.reduce((acc, p) => 
    acc + p.tallas.reduce((t, ta) => t + (ta.stock <= umbralMinimo ? ta.stock : 0), 0), 0
  );

  const costeEstimado = productosConStockBajo.reduce((acc, p) => 
    acc + p.tallas.reduce((t, ta) => t + ((ta.stock <= umbralMinimo ? (umbralMinimo - ta.stock) : 0) * (p.precioCosto || 0)), 0), 0
  );

  return (
    <PageContainer
      title="Pedidos al Proveedor"
      subtitle="Organiza los pedidos de reposición"
    >

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Productos con stock bajo</p>
              <p className="text-2xl font-black text-slate-900">{productosConStockBajo.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Unidades bajo mínimo</p>
              <p className="text-2xl font-black text-slate-900">{totalUnidadesBajo}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Coste estimado</p>
              <p className="text-2xl font-black text-slate-900">{costeEstimado.toFixed(2)}€</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Lista de reposición</h2>
          <p className="text-sm text-slate-500 mt-1">
            Productos con stock ≤ {umbralMinimo} unidades. Muestra las tallas que necesitan reposición.
          </p>
        </div>

        {productosConStockBajo.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">¡Todo el inventario está bien!</p>
            <p className="text-sm text-slate-400 mt-1">No hay productos bajo el mínimo</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {Object.entries(categoriasAgrupadas).map(([categoria, prods]) => (
              <div key={categoria}>
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-500 uppercase">{categoria}</p>
                </div>
                {prods.map(producto => (
                  <div key={producto.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-slate-900">{producto.nombre}</h3>
                      <span className="text-xs text-slate-400">
                        Coste: {producto.precioCosto ? `${producto.precioCosto}€` : 'N/D'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {producto.tallas.map(talla => {
                        const necesita = talla.stock <= umbralMinimo;
                        const cantidadPedir = Math.max(0, umbralMinimo * 2 - talla.stock);
                        
                        return (
                          <div 
                            key={talla.id}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                              necesita ? 'bg-red-50 border border-red-200' : 'bg-slate-50'
                            }`}
                          >
                            <span className={`text-sm font-bold ${necesita ? 'text-red-700' : 'text-slate-500'}`}>
                              {talla.talla}
                            </span>
                            <span className="text-xs text-slate-400">→</span>
                            <span className={`text-sm font-black ${necesita ? 'text-red-600' : 'text-slate-700'}`}>
                              {talla.stock} uds
                            </span>
                            {necesita && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                                Pedir {cantidadPedir}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
        <h3 className="font-black text-blue-900 mb-2">Cómo usar esta herramienta</h3>
        <ol className="text-sm text-blue-700 space-y-1 ml-4 list-decimal">
          <li>Revisa los productos marcados en rojo que tienen stock bajo</li>
          <li>Calcula las cantidades a pedir (se sugiere mantener el doble del mínimo)</li>
          <li>Contacta con tu proveedor para realizar el pedido</li>
          <li>Cuando recibas la mercancía, actualiza el stock en Inventario</li>
        </ol>
      </div>
    </PageContainer>
  );
}
