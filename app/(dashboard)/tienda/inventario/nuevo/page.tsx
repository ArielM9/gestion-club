"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface Producto {
  id?: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  precioVenta: string;
  precioCosto: string;
  activoVenta: boolean;
  activoPedido: boolean;
  tipo: "ROPA" | "COMPLEMENTO";
  tallas: { talla: string; stock: number }[];
}

const categoriasPredefinidas = [
  "Camisetas", "Sudaderas", "Chubasqueros", "Pantalones", "Calcetines", "Complementos", "Llaveros"
];

const tallasPredefinidas = [
  "Talla 4", "Talla 6", "Talla 8", "Talla 10", "Talla 12", "XS", "S", "M", "L", "XL", "XXL", "Única"
];

export default function NuevoProductoPage() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [producto, setProducto] = useState<Producto>({
    nombre: "",
    categoria: "",
    descripcion: "",
    precioVenta: "",
    precioCosto: "",
    activoVenta: true,
    activoPedido: true,
    tipo: "ROPA",
    tallas: []
  });
  const [nuevaCategoria, setNuevaCategoria] = useState("");

  const addTalla = (talla: string) => {
    if (!producto.tallas.find(t => t.talla === talla)) {
      setProducto({
        ...producto,
        tallas: [...producto.tallas, { talla, stock: 0 }]
      });
    }
  };

  const removeTalla = (talla: string) => {
    setProducto({
      ...producto,
      tallas: producto.tallas.filter(t => t.talla !== talla)
    });
  };

  const updateStock = (talla: string, stock: number) => {
    setProducto({
      ...producto,
      tallas: producto.tallas.map(t => 
        t.talla === talla ? { ...t, stock } : t
      )
    });
  };

  const handleGuardar = async () => {
    if (!producto.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!producto.categoria.trim() && !nuevaCategoria.trim()) {
      toast.error("Selecciona o crea una categoría");
      return;
    }
    if (producto.tallas.length === 0) {
      toast.error("Añade al menos una talla");
      return;
    }

    const categoria = nuevaCategoria.trim() || producto.categoria;
    const precioVenta = parseFloat(producto.precioVenta) || 0;
    const precioCosto = parseFloat(producto.precioCosto) || null;

    setGuardando(true);
    try {
      const res = await fetch('/api/tienda/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...producto,
          categoria,
          precioVenta,
          precioCosto,
          tallas: producto.tallas
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Producto creado correctamente");
        router.push('/tienda/inventario');
      } else {
        toast.error(data.error || "Error al crear producto");
      }
    } catch (error) {
      toast.error("Error al crear producto");
    } finally {
      setGuardando(false);
    }
  };

  const categorias = nuevaCategoria ? [...categoriasPredefinidas, nuevaCategoria] : categoriasPredefinidas;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Nuevo Producto</h1>
          <p className="text-slate-500 font-medium mt-1">Crear producto en el catálogo</p>
        </div>
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          <X size={24} />
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase">Nombre *</label>
            <input
              type="text"
              value={producto.nombre}
              onChange={e => setProducto({ ...producto, nombre: e.target.value })}
              placeholder="Ej: Camiseta entrenamiento"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase">Tipo</label>
            <select
              value={producto.tipo}
              onChange={e => setProducto({ ...producto, tipo: e.target.value as "ROPA" | "COMPLEMENTO" })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium cursor-pointer"
            >
              <option value="ROPA">Ropa</option>
              <option value="COMPLEMENTO">Complemento</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase">Categoría</label>
          <select
            value={producto.categoria}
            onChange={e => setProducto({ ...producto, categoria: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium cursor-pointer"
          >
            <option value="">Seleccionar...</option>
            {categoriasPredefinidas.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="text"
            value={nuevaCategoria}
            onChange={e => setNuevaCategoria(e.target.value)}
            placeholder="O crear nueva categoría..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium mt-2"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase">Descripción</label>
          <textarea
            value={producto.descripcion}
            onChange={e => setProducto({ ...producto, descripcion: e.target.value })}
            placeholder="Descripción opcional del producto..."
            rows={2}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase">Precio venta (€) *</label>
            <input
              type="number"
              step="0.01"
              value={producto.precioVenta}
              onChange={e => setProducto({ ...producto, precioVenta: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase">Precio coste (€)</label>
            <input
              type="number"
              step="0.01"
              value={producto.precioCosto}
              onChange={e => setProducto({ ...producto, precioCosto: e.target.value })}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none font-medium"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={producto.activoVenta}
              onChange={e => setProducto({ ...producto, activoVenta: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Activo para venta</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={producto.activoPedido}
              onChange={e => setProducto({ ...producto, activoPedido: e.target.checked })}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Activo para pedidos</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase">Tallas y Stock inicial</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tallasPredefinidas.map(talla => (
              <button
                key={talla}
                onClick={() => addTalla(talla)}
                disabled={producto.tallas.some(t => t.talla === talla)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  producto.tallas.some(t => t.talla === talla)
                    ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + {talla}
              </button>
            ))}
          </div>
          
          {producto.tallas.length > 0 ? (
            <div className="space-y-2">
              {producto.tallas.map(talla => (
                <div key={talla.talla} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                  <span className="font-bold text-slate-700 w-24">{talla.talla}</span>
                  <input
                    type="number"
                    min="0"
                    value={talla.stock}
                    onChange={e => updateStock(talla.talla, parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-medium"
                    placeholder="0"
                  />
                  <span className="text-xs text-slate-400">unidades</span>
                  <button
                    onClick={() => removeTalla(talla.talla)}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">Selecciona las tallas disponibles</p>
          )}
        </div>

        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {guardando ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <Save size={18} />
              Crear Producto
            </>
          )}
        </button>
      </div>
    </div>
  );
}
