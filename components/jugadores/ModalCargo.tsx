"use client";

import { useState } from "react";
import { X, Euro, Tag, Loader2, AlertCircle } from "lucide-react";
import { crearCargoAction } from "@/lib/actions/finanzas";
import { toast } from "sonner";

export default function ModalCargo({
    socioId,
    isOpen,
    onClose
}: {
    socioId: string;
    isOpen: boolean;
    onClose: () => void
}) {
    const [isPending, setIsPending] = useState(false);
    const [monto, setMonto] = useState("");
    const [concepto, setConcepto] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const importe = parseFloat(monto);

        if (isNaN(importe) || importe <= 0) {
            toast.error("El importe debe ser mayor que 0");
            return;
        }

        if (!concepto.trim() || concepto.trim().length < 3) {
            toast.error("El concepto es obligatorio");
            return;
        }

        setIsPending(true);
        const res = await crearCargoAction({
            socioId,
            monto: importe,
            concepto: concepto.trim()
        });
        setIsPending(false);

        if (res.success) {
            toast.success("Cargo generado correctamente");
            setMonto("");
            setConcepto("");
            onClose();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-red-50" onClick={(e) => e.stopPropagation()}>

                {/* Header con aviso visual de 'Deuda' */}
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Generar Cargo</h3>
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.15em] mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> Creando deuda al socio
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Importe del Cargo (€)</label>
                        <div className="relative">
                            <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="number"
                                step="0.01"
                                required
                                autoFocus
                                value={monto}
                                onChange={(e) => setMonto(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-400 font-black text-xl text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest flex justify-between">
                            <span>Concepto</span>
                            <span className="text-red-400 text-[8px] font-black">Requerido</span>
                        </label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-4 text-slate-400" size={18} />
                            <textarea
                                required
                                value={concepto}
                                onChange={(e) => setConcepto(e.target.value)}
                                rows={3}
                                placeholder="Ej: Cuota Anual 25/26, Compra de equipación, Licencia federativa..."
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-400 font-medium text-slate-600 resize-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-red-500 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={18} /> : "Generar Deuda"}
                    </button>
                </form>
            </div>
        </div>
    );
}