"use client";

import { useState } from "react";
import { X, Euro, CreditCard, NotebookPen, Loader2 } from "lucide-react";
import { registrarAbonoAction } from "@/lib/actions/finanzas";
import { toast } from "sonner";

export default function ModalPago({
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
    const [metodo, setMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA" | "COMPENSACION" | "CONDONACION">("EFECTIVO");
    const [motivo, setMotivo] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación de seguridad extra
        if (!motivo.trim() || motivo.trim().length < 5) {
            toast.error("El motivo es obligatorio (mínimo 5 caracteres)");
            return;
        }
        const importe = parseFloat(monto);

        if (isNaN(importe) || importe <= 0) {
            toast.error("Introduce un importe válido mayor que 0");
            return;
        }

        setIsPending(true);

        const res = await registrarAbonoAction({
            socioId,
            monto: importe,
            metodo,
            motivo: motivo.trim() || `Abono vía ${metodo.toLowerCase()}`
        });

        setIsPending(false);

        if (res.success) {
            toast.success("Abono registrado con éxito");
            setMonto("");
            setMotivo("");
            onClose();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Registrar Pago</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Abono a cuenta del socio</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Importe Recibido (€)</label>
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
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-xl text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Método de Pago</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={metodo}
                                onChange={(e) => setMetodo(e.target.value as any)}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none cursor-pointer"
                            >
                                <option value="EFECTIVO">Efectivo</option>
                                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                                <option value="COMPENSACION">Compensación</option>
                                <option value="CONDONACION">Condonación de deuda</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Motivo / Concepto</label>
                        <div className="relative">
                            <NotebookPen className="absolute left-4 top-4 text-slate-400" size={18} />
                            <textarea
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                rows={2}
                                placeholder="Ej: Pago cuota trimestral, Venta material..."
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-600 resize-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-[#1e293b] text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={18} /> : "Finalizar y Registrar"}
                    </button>
                </form>
            </div>
        </div>
    );
}