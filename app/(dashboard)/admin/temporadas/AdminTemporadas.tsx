"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Users, Lock, DollarSign, AlertTriangle, X, Check, FileText, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { crearTemporadaAction, actualizarPreciosTemporadaAction, cerrarTemporadaAction } from "@/lib/actions/temporadas";

interface Categoria {
  id: string;
  nombre: string;
}

interface Precio {
  id: string;
  categoriaId: string;
  categoria: Categoria;
  costeCuota: number | null;
  costeFicha: number | null;
  incluyeRopa: boolean;
}

interface Equipo {
  id: string;
  nombre: string;
  categoriaId: string;
  categoria: Categoria;
  federado: boolean;
  cerrado: boolean;
}

interface Temporada {
  id: string;
  nombre: string;
  fechaInicio: Date;
  fechaFin: Date;
  activa: boolean;
  fechaCierre: Date | null;
  balanceGenerado: boolean;
  precios: Precio[];
  equipos: Equipo[];
  _count: {
    inscripciones: number;
    documentos: number;
  };
}

interface AdminTemporadasProps {
  temporadas: Temporada[];
  temporadaActiva: Temporada | null;
  categorias: Categoria[];
}

export default function AdminTemporadas({ temporadas, temporadaActiva, categorias }: AdminTemporadasProps) {
  const router = useRouter();
  const [showCrear, setShowCrear] = useState(false);
  const [showCerrar, setShowCerrar] = useState(false);
  const [cerrarStep, setCerrarStep] = useState<1 | 2>(1);
  const [showPrecios, setShowPrecios] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Formulario crear temporada
  const [formData, setFormData] = useState({
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
  });

  // Formulario precios
  const [preciosForm, setPreciosForm] = useState<{ categoriaId: string; nombre: string; costeCuota: string; costeFicha: string; incluyeRopa: boolean }[]>([]);
  const [preciosOriginales, setPreciosOriginales] = useState<{ categoriaId: string; costeCuota: string; costeFicha: string }[]>([]);

  const handleCrearTemporada = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await crearTemporadaAction(formData);
    
    setLoading(false);
    if (res.success) {
      toast.success("Temporada creada correctamente");
      setShowCrear(false);
      setFormData({ nombre: "", fechaInicio: "", fechaFin: "" });
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleGuardarPrecios = async () => {
    setLoading(true);
    const precios = preciosForm.map(p => ({
      categoriaId: p.categoriaId,
      costeCuota: p.costeCuota ? parseFloat(p.costeCuota) : null,
      costeFicha: p.costeFicha ? parseFloat(p.costeFicha) : null,
      incluyeRopa: p.incluyeRopa,
    }));
    
    const res = await actualizarPreciosTemporadaAction(temporadaActiva!.id, precios);
    setLoading(false);
    
    if (res.success) {
      toast.success(res.message || "Precios actualizados");
      setShowPrecios(false);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const handleCerrarTemporada = async () => {
    if (confirmText.toUpperCase() !== "CERRAR") {
      toast.error("Escribe CERRAR para confirmar");
      return;
    }

    setLoading(true);
    
    const res = await cerrarTemporadaAction(temporadaActiva!.id);
    
    setLoading(false);
    if (res.success) {
      toast.success(res.message);
      setShowCerrar(false);
      setConfirmText("");
      setCerrarStep(1);
      router.refresh();
    } else {
      toast.error(res.error);
    }
  };

  const initPreciosForm = () => {
    const preciosBase = temporadaActiva?.precios.map(p => ({
      categoriaId: p.categoriaId,
      nombre: p.categoria.nombre,
      costeCuota: p.costeCuota?.toString() || "",
      costeFicha: p.costeFicha?.toString() || "",
      incluyeRopa: p.incluyeRopa,
    })) || [];

    // Guardar precios originales para detectar cambios
    const originales = preciosBase.map(p => ({
      categoriaId: p.categoriaId,
      costeCuota: p.costeCuota,
      costeFicha: p.costeFicha,
    }));
    setPreciosOriginales(originales);

    // Agregar todas las categorías que no tienen precio aún
    const nombresExistentes = preciosBase.map(p => p.nombre);
    const categoriasSinPrecio = categorias.filter(c => !nombresExistentes.includes(c.nombre));
    
    const extras = categoriasSinPrecio.map(c => ({
      categoriaId: c.id,
      nombre: c.nombre,
      costeCuota: "",
      costeFicha: "",
      incluyeRopa: false,
    }));

    setPreciosForm([...preciosBase, ...extras]);
    setShowPrecios(true);
  };

  const hayPreciosCompletos = preciosForm.every(p => p.costeCuota !== "" && p.costeFicha !== "");
  const hayEquipos = temporadaActiva?.equipos && temporadaActiva.equipos.length > 0;

  // Detectar si hubo cambios en los precios
  const detectCambiosPrecios = () => {
    for (const p of preciosForm) {
      const original = preciosOriginales.find(o => o.categoriaId === p.categoriaId);
      if (!original) return true; // Nueva categoría
      
      const originalCuota = original.costeCuota || "";
      const originalFicha = original.costeFicha || "";
      
      if (originalCuota !== p.costeCuota || originalFicha !== p.costeFicha) {
        return true;
      }
    }
    return false;
  };
  
  const hayCambiosPrecios = detectCambiosPrecios();

  return (
    <div className="space-y-8">
      {/* Temporada Activa */}
      {temporadaActiva ? (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-blue-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Temporada Activa</h2>
              <p className="text-sm font-bold text-blue-600">{temporadaActiva.nombre}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase">Inicio</p>
              <p className="font-bold text-slate-700">{new Date(temporadaActiva.fechaInicio).toLocaleDateString("es-ES")}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase">Fin</p>
              <p className="font-bold text-slate-700">{new Date(temporadaActiva.fechaFin).toLocaleDateString("es-ES")}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase">Equipos</p>
              <p className="font-bold text-slate-700">{temporadaActiva.equipos.length}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <p className="text-[10px] font-black text-slate-400 uppercase">Inscritos</p>
              <p className="font-bold text-slate-700">{temporadaActiva._count.inscripciones}</p>
            </div>
          </div>

          {/* Estado de precios */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-700">Precios por Categoría</h3>
                {temporadaActiva.precios.some(p => p.costeCuota === null || p.costeFicha === null) && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">
                    Pendiente
                  </span>
                )}
              </div>
              <button onClick={initPreciosForm} className="text-blue-600 text-sm font-bold hover:underline">
                {temporadaActiva.precios.some(p => p.costeCuota !== null && p.costeFicha !== null) ? "Editar" : "Configurar"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {temporadaActiva.precios.map(p => {
                const tienePrecios = p.costeCuota !== null && p.costeFicha !== null;
                return (
                  <div 
                    key={p.id} 
                    className={`p-2 rounded-lg text-center ${tienePrecios ? "bg-green-50" : "bg-amber-50 border border-amber-200"}`}
                  >
                    <p className="text-xs font-black text-slate-600">{p.categoria.nombre}</p>
                    <div className="mt-1 space-y-0.5">
                      <p className={`text-xs font-bold ${p.costeCuota !== null ? "text-green-600" : "text-amber-500"}`}>
                        Cuota: {p.costeCuota !== null ? `${p.costeCuota}€` : "—"}
                      </p>
                      <p className={`text-xs font-bold ${p.costeFicha !== null ? "text-blue-600" : "text-amber-500"}`}>
                        Ficha: {p.costeFicha !== null ? `${p.costeFicha}€` : "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => { initPreciosForm(); }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
            >
              <DollarSign size={18} /> Configurar Precios
            </button>
            
            <a 
              href="/admin/categorias"
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800"
            >
              <ExternalLink size={18} /> Ver Equipos
            </a>
            
            <button 
              onClick={() => setShowCerrar(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700"
            >
              <Lock size={18} /> Cerrar Temporada
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="text-center py-8">
            <p className="text-slate-500 font-medium mb-4">No hay temporada activa</p>
            <button 
              onClick={() => setShowCrear(true)}
              className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 mx-auto"
            >
              <Plus size={18} /> Crear Nueva Temporada
            </button>
          </div>
        </div>
      )}

      {/* Historial de temporadas */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">Historial de Temporadas</h3>
        
        {temporadas.filter(t => !t.activa).length === 0 ? (
          <p className="text-slate-400 text-center py-4">No hay temporadas cerradas</p>
        ) : (
          <div className="space-y-3">
            {temporadas.filter(t => !t.activa).map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-black text-slate-700">{t.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {t.fechaCierre ? `Cerrada: ${new Date(t.fechaCierre).toLocaleDateString("es-ES")}` : "Cerrada"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a 
                    href={`/historico/${t.id}`}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Ver
                  </a>
                  {t.balanceGenerado && (
                    <button className="px-4 py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200">
                      <FileText size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Temporada */}
      {showCrear && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCrear(false)}>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-xl font-black text-slate-900">Nueva Temporada</h3>
            </div>
            <form onSubmit={handleCrearTemporada} className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="2025/2026"
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fecha Inicio</label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fecha Fin (opcional)</label>
                <input
                  type="date"
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowCrear(false)} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Creando..." : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Precios */}
      {showPrecios && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowPrecios(false)}>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Precios por Categoría</h3>
              <button onClick={() => setShowPrecios(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              {preciosForm.map((p, i) => (
                <div key={p.categoriaId} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                  <div className="flex-1">
                    <p className="font-black text-slate-700">{p.nombre}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Cuota Club</label>
                    <input
                      type="number"
                      value={p.costeCuota}
                      onChange={(e) => {
                        const updated = [...preciosForm];
                        updated[i].costeCuota = e.target.value;
                        setPreciosForm(updated);
                      }}
                      placeholder="0.00"
                      className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase">Ficha Fed.</label>
                    <input
                      type="number"
                      value={p.costeFicha}
                      onChange={(e) => {
                        const updated = [...preciosForm];
                        updated[i].costeFicha = e.target.value;
                        setPreciosForm(updated);
                      }}
                      placeholder="0.00"
                      className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <label className="flex flex-col items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.incluyeRopa}
                      onChange={(e) => {
                        const updated = [...preciosForm];
                        updated[i].incluyeRopa = e.target.checked;
                        setPreciosForm(updated);
                      }}
                      className="h-5 w-5 rounded"
                    />
                    <span className="text-[8px] font-black text-slate-400 uppercase">Ropa</span>
                  </label>
                </div>
              ))}
              <p className="text-xs text-slate-500">Deja los campos vacíos si no están definidos aún</p>
            </div>
            <div className="p-8 border-t border-slate-50 flex gap-4">
              <button onClick={() => setShowPrecios(false)} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50">
                Cancelar
              </button>
              <button 
                onClick={handleGuardarPrecios} 
                disabled={loading} 
                className={`flex-1 py-3 rounded-2xl font-bold text-white disabled:opacity-50 ${
                  hayCambiosPrecios ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Guardando..." : hayCambiosPrecios ? "Guardar y actualizar cargos" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Temporada - Paso 1 */}
      {showCerrar && cerrarStep === 1 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowCerrar(false); setCerrarStep(1); }}>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-red-50 bg-red-50/30">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-600" />
                <h3 className="text-xl font-black text-slate-900">Cerrar Temporada</h3>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-slate-600 font-medium">
                Va a cerrar la temporada <strong>{temporadaActiva?.nombre}</strong>. 
              </p>
              <ul className="text-sm text-slate-500 space-y-2">
                <li>• Se generará un PDF con el balance</li>
                <li>• Las deudas pendientes se transferirán a la nueva temporada</li>
                <li>• Los equipos quedan marcados como cerrados</li>
                <li>• No podrá deshacer esta acción</li>
              </ul>
              <div className="flex gap-4 pt-4">
                <button onClick={() => { setShowCerrar(false); setCerrarStep(1); }} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50">
                  Cancelar
                </button>
                <button onClick={() => setCerrarStep(2)} className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700">
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar Temporada - Paso 2 (Confirmación) */}
      {showCerrar && cerrarStep === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => { setShowCerrar(false); setCerrarStep(1); setConfirmText(""); }}>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-8 border-b border-red-50 bg-red-50/30">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-600" />
                <h3 className="text-xl font-black text-slate-900">Confirmar Cierre</h3>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-slate-600 font-medium">
                Escribe <strong>CERRAR</strong> para confirmar el cierre de la temporada.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CERRAR"
                className="w-full px-5 py-3 bg-slate-50 border-2 border-red-200 rounded-2xl text-center font-black text-lg uppercase"
              />
              <div className="flex gap-4 pt-4">
                <button onClick={() => { setShowCerrar(false); setCerrarStep(1); setConfirmText(""); }} className="flex-1 py-3 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50">
                  Cancelar
                </button>
                <button 
                  onClick={handleCerrarTemporada} 
                  disabled={loading || confirmText.length !== 6} 
                  className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? "Cerrando..." : "Cerrar Temporada"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
