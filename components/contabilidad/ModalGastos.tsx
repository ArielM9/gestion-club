"use client";

import { useState } from "react";
import { X, Euro, Tag, FileText, Loader2, CreditCard } from "lucide-react";
import { crearGastoAction } from "@/lib/actions/contabilidad";
import { toast } from "sonner";

const CATEGORIAS_GASTO = ["Material Deportivo", "Arbitrajes", "Instalaciones", "Transporte", "Otros"];

export default function ModalGasto({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        monto: "",
        categoria: "Material Deportivo",
        concepto: "",
        metodo: "EFECTIVO" as any
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await crearGastoAction({
            monto: parseFloat(formData.monto),
            categoria: formData.categoria,
            concepto: formData.concepto,
            metodo: formData.metodo
        });

        setLoading(false);
        if (res.success) {
            toast.success("Gasto registrado y restado de caja");
            onClose();
        } else {
            toast.error(res.error);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

                <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-red-50/30">
                    <div>
                        <h3 className="text-xl font-black text-slate-900">Registrar Gasto</h3>
                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">Auditado por el Club</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {/* MONTO */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Importe (€)</label>
                        <div className="relative">
                            <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="number" step="0.01" required
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-400 font-black text-xl"
                                value={formData.monto}
                                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* MÉTODO DE PAGO (Auditoría de caja vs banco) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Flujo de Caja / Banco</label>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-400 font-bold appearance-none"
                                value={formData.metodo}
                                onChange={(e) => setFormData({ ...formData, metodo: e.target.value })}
                            >
                                <option value="EFECTIVO">Efectivo (Caja Física)</option>
                                <option value="TRANSFERENCIA">Transferencia (Banco)</option>
                                <option value="TARJETA">Tarjeta (Banco)</option>
                            </select>
                        </div>
                    </div>

                    {/* CATEGORÍA */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Categoría</label>
                        <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-400 font-bold appearance-none"
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                            >
                                {CATEGORIAS_GASTO.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* DETALLE */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Detalle Específico</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                            <textarea
                                required rows={2}
                                className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-400 font-medium"
                                value={formData.concepto}
                                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit" disabled={loading}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : "Finalizar y Registrar Gasto"}
                    </button>
                </form>
            </div>
        </div>
    );
}