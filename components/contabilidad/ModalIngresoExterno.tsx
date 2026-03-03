"use client";

import { useState } from "react";
import { X, Euro, Building2, FileText, Loader2 } from "lucide-react";
import { crearIngresoExternoAction } from "@/lib/actions/contabilidad";
import { toast } from "sonner";

export default function ModalIngresoExterno({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ monto: "", fuente: "", concepto: "" });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await crearIngresoExternoAction({
            monto: parseFloat(formData.monto),
            fuente: formData.fuente,
            concepto: formData.concepto
        });

        setLoading(false);
        if (res.success) {
            toast.success("Ingreso externo registrado");
            setFormData({ monto: "", fuente: "", concepto: "" });
            onClose();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-green-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Ingreso Externo</h3>
                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">Entrada de capital (No socios)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Importe Recibido (€)</label>
                        <div className="relative">
                            <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="number" step="0.01" required autoFocus
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-400 font-black text-xl text-slate-700"
                                value={formData.monto}
                                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fuente del Ingreso</label>
                        <div className="relative">
                            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                required placeholder="Ej: Ayuntamiento, Patrocinador X..."
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-400 font-bold text-slate-700"
                                value={formData.fuente}
                                onChange={(e) => setFormData({ ...formData, fuente: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Concepto Detallado</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                            <textarea
                                required rows={2}
                                placeholder="Ej: Patrocinio camisetas, Subvención deportes 2026..."
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-400 font-medium text-slate-600 resize-none"
                                value={formData.concepto}
                                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-green-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Registrar Ingreso"}
                    </button>
                </form>
            </div>
        </div>
    );
}