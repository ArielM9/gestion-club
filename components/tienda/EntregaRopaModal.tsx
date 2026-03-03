"use client";

import { useState } from "react";
import { Package, X, Check } from "lucide-react";
import type { ProductoConStock } from "@/lib/types/tienda";

interface EntregaRopaModalProps {
  isOpen: boolean;
  onClose: () => void;
  socioId: string;
  tallaJugador?: string | null;
}

export default function EntregaRopaModal({
  isOpen,
  onClose,
  socioId,
  tallaJugador
}: EntregaRopaModalProps) {
  const [productos, setProductos] = useState<ProductoConStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState<{productoId: string; producto: string; talla: string; cantidad: number}[]>([]);
  const [guardando, setGuardando] = useState(false);

  if (!isOpen) return null;

  const fetchProductos = async () => {
    if (productos.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tienda/productos?activoVenta=true');
      const data = await res.json();
      setProductos(data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProducto = (producto: ProductoConStock, talla: string) => {
    const existente = seleccionados.find(s => s.productoId === producto.id && s.talla === talla);
    if (existente) {
      setSeleccionados(seleccionados.filter(s => s !== existente));
    } else {
      setSeleccionados([...seleccionados, {
        productoId: producto.id,
        producto: producto.nombre,
        talla,
        cantidad: 1
      }]);
    }
  };

  const isSeleccionado = (productoId: string, talla: string) => {
    return seleccionados.some(s => s.productoId === productoId && s.talla === talla);
  };

  const handleEntregar = async () => {
    if (seleccionados.length === 0) return;
    
    setGuardando(true);
    try {
      const res = await fetch('/api/tienda/entregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId,
          productos: seleccionados
        })
      });
      
      if (res.ok) {
        alert('Entrega registrada correctamente');
        setSeleccionados([]);
        onClose();
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al registrar entrega');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar entrega');
    } finally {
      setGuardando(false);
    }
  };

  const productosConTallas = productos.filter(p => p.tallas && p.tallas.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900">Entregar Ropa</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">
              Selecciona los productos a entregar
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="text-center py-8">
              <span className="animate-spin">⏳</span>
              <p className="text-slate-500 mt-2">Cargando productos...</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                Talla del jugador: <span className="font-black text-slate-700">{tallaJugador || 'No definida'}</span>
              </p>
              
              {productosConTallas.map(producto => (
                <div key={producto.id} className="mb-6">
                  <h4 className="font-black text-slate-900 mb-2">{producto.nombre}</h4>
                  <div className="flex flex-wrap gap-2">
                    {producto.tallas.map((talla: any) => {
                      const selected = isSeleccionado(producto.id, talla.talla);
                      const disabled = talla.stock <= 0;
                      
                      return (
                        <button
                          key={talla.talla}
                          onClick={() => !disabled && toggleProducto(producto, talla.talla)}
                          disabled={disabled}
                          className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2
                            ${disabled 
                              ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                              : selected 
                                ? 'bg-green-600 text-white' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                          {selected && <Check size={14} />}
                          {talla.talla} ({talla.stock})
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="p-8 border-t border-slate-50">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate-500">
              {seleccionados.length} producto(s) seleccionado(s)
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleEntregar}
              disabled={seleccionados.length === 0 || guardando}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {guardando ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <Package size={16} />
                  Confirmar Entrega
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
