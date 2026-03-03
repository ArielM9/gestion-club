"use client";

import { useState, useEffect } from "react";
import { X, User, Building2, Shirt, Euro, CreditCard, NotebookPen, Loader2, ArrowLeft } from "lucide-react";
import SocioSelector from "@/components/documentos/SocioSelector";
import { registrarAbonoAction } from "@/lib/actions/finanzas";
import { crearIngresoExternoAction } from "@/lib/actions/contabilidad";
import { toast } from "sonner";

type Step = "SELECT" | "SOCIO_SELECT" | "SOCIO_FORM" | "EXTERNO_FORM" | "TIENDA_FORM";

export default function ModalGlobalIngresos({
    isOpen,
    onClose,
    userRole
}: {
    isOpen: boolean;
    onClose: () => void;
    userRole: string;
}) {
    const [step, setStep] = useState<Step>("SELECT");
    const [loading, setLoading] = useState(false);
    const [selectedSocio, setSelectedSocio] = useState<{ id: string; nombre: string; dni: string } | null>(null);

    // Form states
    const [monto, setMonto] = useState("");
    const [metodo, setMetodo] = useState<"EFECTIVO" | "TRANSFERENCIA" | "COMPENSACION" | "CONDONACION">("EFECTIVO");
    const [motivo, setMotivo] = useState("");
    const [fuente, setFuente] = useState("");

    useEffect(() => {
        if (isOpen) {
            setStep("SELECT");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const resetForm = () => {
        setMonto("");
        setMetodo("EFECTIVO");
        setMotivo("");
        setFuente("");
        setSelectedSocio(null);
    };

    const handleSocioSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSocio) return;
        setLoading(true);
        const res = await registrarAbonoAction({
            socioId: selectedSocio.id,
            monto: parseFloat(monto),
            metodo,
            motivo: motivo || (step === "TIENDA_FORM" ? "Venta de Ropa" : "Pago de Cuota")
        });
        setLoading(false);
        if (res.success) {
            toast.success("Pago registrado correctamente");
            resetForm();
            onClose();
        } else {
            toast.error(res.error);
        }
    };

    const handleExternoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const res = await crearIngresoExternoAction({
            monto: parseFloat(monto),
            fuente: fuente,
            concepto: motivo
        });
        setLoading(false);
        if (res.success) {
            toast.success("Ingreso externo registrado");
            resetForm();
            onClose();
        } else {
            toast.error(res.error);
        }
    };

    const renderHeader = (title: string, subtitle: string, colorClass: string) => (
        <div className={`p-8 border-b border-slate-50 flex justify-between items-center ${colorClass}`}>
            <div className="flex items-center gap-4">
                {step !== "SELECT" && (
                    <button onClick={() => setStep("SELECT")} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm">
                        <ArrowLeft size={18} />
                    </button>
                )}
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">{subtitle}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm">
                <X size={20} />
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>

                {step === "SELECT" && (
                    <>
                        {renderHeader("Registrar Ingreso", "Selecciona el tipo de entrada", "bg-slate-50/50")}
                        <div className="p-8 grid gap-4">
                            <button
                                onClick={() => setStep("SOCIO_SELECT")}
                                className="flex items-center gap-4 p-5 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-3xl transition-all group"
                            >
                                <div className="p-3 bg-blue-600 text-white rounded-2xl group-hover:scale-110 transition-transform">
                                    <User size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-slate-900">Pago de Socio</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cuotas, multas, reserva</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { setStep("TIENDA_FORM"); setMotivo("Venta de Ropa"); }}
                                className="flex items-center gap-4 p-5 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-3xl transition-all group"
                            >
                                <div className="p-3 bg-amber-500 text-white rounded-2xl group-hover:scale-110 transition-transform">
                                    <Shirt size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-slate-900">Venta de Ropa</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pack entrenamiento, equipación</p>
                                </div>
                            </button>

                            {(userRole === "ADMIN" || userRole === "CONTABILIDAD") && (
                                <button
                                    onClick={() => setStep("EXTERNO_FORM")}
                                    className="flex items-center gap-4 p-5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 rounded-3xl transition-all group"
                                >
                                    <div className="p-3 bg-emerald-600 text-white rounded-2xl group-hover:scale-110 transition-transform">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-slate-900">Ingreso Externo</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Patrocinios, subvenciones</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    </>
                )}

                {step === "SOCIO_SELECT" && (
                    <>
                        {renderHeader("Buscar Socio", "Identificación del pagador", "bg-blue-50/30")}
                        <div className="p-8 space-y-6">
                            <p className="text-xs text-slate-500 font-medium px-2">Busca al socio que realiza el pago:</p>
                            <SocioSelector
                                onConfirm={(socio: { id: string; nombre: string; dni: string }) => {
                                    setSelectedSocio(socio);
                                    setStep("SOCIO_FORM");
                                }}
                            />
                            <div className="h-20" /> {/* Espaciador */}
                        </div>
                    </>
                )}

                {(step === "SOCIO_FORM" || step === "TIENDA_FORM") && (
                    <>
                        {renderHeader(
                            step === "TIENDA_FORM" ? "Venta de Ropa" : "Detalles del Pago",
                            selectedSocio ? `Asignar a: ${selectedSocio.nombre}` : "Registro general",
                            step === "TIENDA_FORM" ? "bg-amber-50/30" : "bg-blue-50/30"
                        )}
                        <form onSubmit={handleSocioSubmit} className="p-8 space-y-5">
                            {!selectedSocio && step === "TIENDA_FORM" && (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-amber-700">Opcional: puedes asignar esta venta a un socio para llevar control personal.</span>
                                    <button
                                        type="button"
                                        onClick={() => setStep("SOCIO_SELECT")}
                                        className="text-[10px] font-black text-amber-900 underline uppercase"
                                    >
                                        Vincular
                                    </button>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Importe (€)</label>
                                <div className="relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number" step="0.01" required autoFocus
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-black text-xl text-slate-700"
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Método</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <select
                                        value={metodo}
                                        onChange={(e) => setMetodo(e.target.value as "EFECTIVO" | "TRANSFERENCIA" | "COMPENSACION" | "CONDONACION")}
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 appearance-none cursor-pointer"
                                    >
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="TARJETA">Tarjeta</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Concepto</label>
                                <div className="relative">
                                    <NotebookPen className="absolute left-4 top-4 text-slate-400" size={18} />
                                    <textarea
                                        required rows={2}
                                        placeholder="Ej: Pago cuota primer trimestre..."
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-600 resize-none"
                                        value={motivo}
                                        onChange={(e) => setMotivo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-blue-600 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirmar e Instalar"}
                            </button>
                        </form>
                    </>
                )}

                {step === "EXTERNO_FORM" && (
                    <>
                        {renderHeader("Ingreso Externo", "Administración del club", "bg-emerald-50/30")}
                        <form onSubmit={handleExternoSubmit} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Importe Recibido (€)</label>
                                <div className="relative">
                                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="number" step="0.01" required autoFocus
                                        className="w-full pl-12 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-400 font-black text-xl text-slate-700"
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fuente</label>
                                <input
                                    required placeholder="Ayuntamiento, Patrocinador, etc."
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-400 font-bold text-slate-700"
                                    value={fuente}
                                    onChange={(e) => setFuente(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Concepto</label>
                                <textarea
                                    required rows={2}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-400 font-medium text-slate-600 resize-none"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : "Registrar Ingreso"}
                            </button>
                        </form>
                    </>
                )}

            </div>
        </div>
    );
}
