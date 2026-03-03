"use client";

import { useState, useEffect, use } from "react";
import { X, Plus, Trash2, Search, ShoppingCart, User } from "lucide-react";
import { toast } from "sonner";

interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  tallas: { talla: string; stock: number }[];
}

interface Socio {
  id: string;
  nombre: string;
  apellidos: string;
}

interface CarritoItem {
  productoId: string;
  producto: string;
  talla: string;
  cantidad: number;
  precio: number;
}

export default function NuevaVentaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busquedaSociosLoading, setBusquedaSociosLoading] = useState(false);
  
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [busquedaSocio, setBusquedaSocio] = useState("");
  const [mostrarSocios, setMostrarSocios] = useState(false);
  
  const [metodo, setMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA" | "TARJETA">("EFECTIVO");
  const [tipoVenta, setTipoVenta] = useState<"DIRECTA" | "PLAZOS" | "FIADO">("DIRECTA");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/tienda/productos').then(r => r.json()).catch(() => [])
    ]).then(([prods]) => {
      setProductos(prods);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (busquedaSocio.length < 2) {
      setSocios([]);
      return;
    }

    setBusquedaSociosLoading(true);
    const timeout = setTimeout(() => {
      fetch(`/api/socios/search?q=${encodeURIComponent(busquedaSocio)}`)
        .then(r => r.json())
        .then(data => {
          setSocios(data);
          setBusquedaSociosLoading(false);
        })
        .catch(() => {
          setSocios([]);
          setBusquedaSociosLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeout);
  }, [busquedaSocio]);

  const addProducto = (producto: Producto, talla: string) => {
    const existente = carrito.find(c => c.productoId === producto.id && c.talla === talla);
    if (existente) {
      setCarrito(carrito.map(c => 
        c === existente ? { ...c, cantidad: c.cantidad + 1 } : c
      ));
    } else {
      setCarrito([...carrito, {
        productoId: producto.id,
        producto: producto.nombre,
        talla,
        cantidad: 1,
        precio: producto.precioVenta
      }]);
    }
  };

  const removeProducto = (productoId: string, talla: string) => {
    setCarrito(carrito.filter(c => !(c.productoId === productoId && c.talla === talla)));
  };

  const updateCantidad = (productoId: string, talla: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeProducto(productoId, talla);
    } else {
      setCarrito(carrito.map(c => 
        c.productoId === productoId && c.talla === talla ? { ...c, cantidad } : c
      ));
    }
  };

  const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const filteredSocios = socios;

  const handleGuardar = async () => {
    if (carrito.length === 0) {
      toast.error("Añade productos al carrito");
      return;
    }

    if ((tipoVenta === 'PLAZOS' || tipoVenta === 'FIADO') && !socioSeleccionado) {
      toast.error("Selecciona un jugador para venta a plazos o fiado");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch('/api/tienda/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId: socioSeleccionado?.id,
          tipo: tipoVenta,
          metodo: tipoVenta === 'DIRECTA' ? metodo : 'COMPENSACION',
          productos: carrito
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        toast.success("Venta registrada correctamente");
        setCarrito([]);
        setSocioSeleccionado(null);
        setBusquedaSocio("");
      } else {
        toast.error(data.error || "Error al registrar venta");
      }
    } catch (error) {
      toast.error("Error al registrar venta");
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="animate-spin text-4xl">⏳</span>
      </div>
    );
  }

  const categorias = [...new Set(productos.map(p => p.categoria))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Nueva Venta</h1>
        <p className="text-slate-500 font-medium mt-1">Registrar venta directa en tienda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selección de productos */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-4">Productos</h2>
          
          {categorias.map(cat => {
            const prods = productos.filter(p => p.categoria === cat);
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-2">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {prods.map(producto => (
                    <div key={producto.id} className="relative group">
                      <button
                        onClick={() => {
                          const primeraTalla = producto.tallas[0]?.talla;
                          if (primeraTalla) addProducto(producto, primeraTalla);
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-blue-50 rounded-xl text-sm font-bold text-slate-700 transition-colors"
                      >
                        {producto.nombre} - {producto.precioVenta}€
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Carrito y cliente */}
        <div className="space-y-6">
          {/* Selector de socio */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-4">Cliente (opcional)</h2>
            
            {socioSeleccionado ? (
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-slate-900">
                    {socioSeleccionado.nombre} {socioSeleccionado.apellidos}
                  </span>
                </div>
                <button 
                  onClick={() => setSocioSeleccionado(null)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={busquedaSocio}
                  onChange={e => { setBusquedaSocio(e.target.value); setMostrarSocios(true); }}
                  onFocus={() => setMostrarSocios(true)}
                  placeholder="Buscar jugador..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
                {mostrarSocios && busquedaSocio && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-lg z-10">
                    {busquedaSociosLoading ? (
                      <p className="p-4 text-sm text-slate-400 text-center">Buscando...</p>
                    ) : filteredSocios.length === 0 ? (
                      <p className="p-4 text-sm text-slate-500">No se encontraron jugadores</p>
                    ) : (
                      filteredSocios.slice(0, 10).map(socio => (
                        <button
                          key={socio.id}
                          onClick={() => { setSocioSeleccionado(socio); setMostrarSocios(false); setBusquedaSocio(""); }}
                          className="w-full text-left p-3 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <User size={16} className="text-slate-400" />
                          <span className="font-medium">{socio.nombre} {socio.apellidos}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Carrito */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-slate-900">Carrito</h2>
              <span className="text-sm text-slate-500">{carrito.length} productos</span>
            </div>

            {carrito.length === 0 ? (
              <p className="text-center py-8 text-slate-400">Carrito vacío</p>
            ) : (
              <div className="space-y-3">
                {carrito.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{item.producto}</p>
                      <p className="text-xs text-slate-500">{item.talla} · {item.precio}€</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateCantidad(item.productoId, item.talla, item.cantidad - 1)}
                        className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{item.cantidad}</span>
                      <button 
                        onClick={() => updateCantidad(item.productoId, item.talla, item.cantidad + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold"
                      >
                        +
                      </button>
                      <button 
                        onClick={() => removeProducto(item.productoId, item.talla)}
                        className="ml-2 text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-slate-500">Total</span>
                <span className="text-2xl font-black text-slate-900">{total.toFixed(2)}€</span>
              </div>

              <div className="space-y-2 mb-4">
                <label className="text-xs font-bold text-slate-400 uppercase">Tipo de venta</label>
                <div className="flex gap-2">
                  {(['DIRECTA', 'PLAZOS', 'FIADO'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTipoVenta(t)}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                        tipoVenta === t 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t === 'DIRECTA' ? 'Directa' : t === 'PLAZOS' ? 'A plazos' : 'Fiado'}
                    </button>
                  ))}
                </div>
                {tipoVenta !== 'DIRECTA' && !socioSeleccionado && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Selecciona un jugador</p>
                )}
              </div>

              {tipoVenta === 'DIRECTA' && (
                <div className="space-y-2 mb-4">
                  <label className="text-xs font-bold text-slate-400 uppercase">Método de pago</label>
                  <div className="flex gap-2">
                    {(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setMetodo(m)}
                        className={`flex-1 py-2 rounded-xl font-bold text-sm transition-colors ${
                          metodo === m 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {m === 'EFECTIVO' ? 'Efectivo' : m === 'TARJETA' ? 'Tarjeta' : 'Transferencia'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleGuardar}
                disabled={carrito.length === 0 || guardando}
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-wider hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {guardando ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Registrar Venta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
