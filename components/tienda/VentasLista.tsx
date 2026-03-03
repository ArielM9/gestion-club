"use client";

import { useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Venta {
  id: string;
  tipo: string;
  estado: string;
  metodo: string | null;
  total: number;
  fecha: Date;
  socio: { id: string; nombre: string; apellidos: string } | null;
  productos: { cantidad: number; producto: { nombre: string } }[];
}

interface VentasListaProps {
  ventas: Venta[];
  puedeAprobar: boolean;
}

export default function VentasLista({ ventas: initialVentas, puedeAprobar }: VentasListaProps) {
  const [ventas, setVentas] = useState(initialVentas);
  const [procesando, setProcesando] = useState<string | null>(null);

  const pendientes = ventas.filter(v => v.estado === 'PENDIENTE' && v.metodo === 'EFECTIVO');

  const aprobarVenta = async (ventaId: string) => {
    setProcesando(ventaId);
    try {
      const res = await fetch('/api/tienda/ventas/aprobar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventaId, accion: 'aprobar' })
      });
      const data = await res.json();
      
      if (res.ok) {
        setVentas(ventas.map(v => v.id === ventaId ? { ...v, estado: 'APROBADA' } : v));
        toast.success('Venta aprobada');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al aprobar');
    } finally {
      setProcesando(null);
    }
  };

  const rechazarVenta = async (ventaId: string) => {
    if (!confirm('¿Rechazar esta venta? Se restaurará el stock.')) return;
    
    setProcesando(ventaId);
    try {
      const res = await fetch('/api/tienda/ventas/aprobar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ventaId, accion: 'rechazar' })
      });
      const data = await res.json();
      
      if (res.ok) {
        setVentas(ventas.map(v => v.id === ventaId ? { ...v, estado: 'RECHAZADA' } : v));
        toast.success('Venta rechazada');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error('Error al rechazar');
    } finally {
      setProcesando(null);
    }
  };

  const getBadge = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">Pendiente</span>;
      case 'APROBADA':
        return <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase">Aprobada</span>;
      case 'RECHAZADA':
        return <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">Rechazada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="divide-y divide-slate-50">
      {ventas.map(venta => (
        <div key={venta.id} className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-black text-slate-900">
                {venta.socio ? `${venta.socio.nombre} ${venta.socio.apellidos}` : 'Venta anónima'}
              </p>
              {getBadge(venta.estado)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(venta.fecha).toLocaleDateString('es-ES', { 
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            <div className="flex gap-2 mt-2">
              {venta.productos.map((vp, i) => (
                <span key={i} className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-600">
                  {vp.cantidad}x {vp.producto.nombre}
                </span>
              ))}
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-black text-slate-900">{venta.total.toFixed(2)}€</p>
            <p className="text-[10px] text-slate-400 uppercase">{venta.metodo || 'Sin método'}</p>
          </div>

          {puedeAprobar && venta.estado === 'PENDIENTE' && venta.metodo === 'EFECTIVO' && (
            <div className="flex gap-2">
              <button
                onClick={() => aprobarVenta(venta.id)}
                disabled={procesando === venta.id}
                className="p-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-600 transition-colors disabled:opacity-50"
                title="Aprobar"
              >
                {procesando === venta.id ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
              </button>
              <button
                onClick={() => rechazarVenta(venta.id)}
                disabled={procesando === venta.id}
                className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                title="Rechazar"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
