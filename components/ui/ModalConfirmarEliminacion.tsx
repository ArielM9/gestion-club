"use client";

import { useState } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface ModalConfirmarEliminacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  tipo: "cargo" | "abono" | "gasto" | "ingreso";
  monto: number;
  concepto: string;
  fecha?: string;
}

export function ModalConfirmarEliminacion({
  isOpen,
  onClose,
  onConfirm,
  tipo,
  monto,
  concepto,
  fecha,
}: ModalConfirmarEliminacionProps) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const tipoLabel = {
    cargo: "Cargo",
    abono: "Abono",
    gasto: "Gasto",
    ingreso: "Ingreso",
  };

  const handleConfirm = async () => {
    if (!motivo.trim()) return;
    
    setLoading(true);
    try {
      await onConfirm(motivo);
      setMotivo("");
      onClose();
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMotivo("");
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-red-50 bg-red-50/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Eliminar {tipoLabel[tipo]}
              </h3>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                Acción irreversible
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase">Tipo</span>
              <span className="text-sm font-bold text-slate-700">{tipoLabel[tipo]}</span>
            </div>
            {fecha && (
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase">Fecha</span>
                <span className="text-sm font-bold text-slate-700">{fecha}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase">Concepto</span>
              <span className="text-sm font-bold text-slate-700 truncate max-w-[200px]" title={concepto}>
                {concepto}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase">Importe</span>
              <span className="text-lg font-black text-red-600">
                {tipo === "abono" || tipo === "ingreso" ? "+" : "-"}{monto.toFixed(2)}€
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">
              Motivo de eliminación *
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Error al registrar, Cargo duplicado, etc."
              className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-red-300 focus:outline-none text-sm font-medium"
              rows={3}
              required
            />
            <p className="text-[10px] text-slate-400 ml-2">
              Este motivo quedará registrado para futuras referencias
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleClose}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!motivo.trim() || loading}
              className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}