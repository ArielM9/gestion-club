"use client";

import { useState, useEffect } from "react";
import { Link2, FileText, User, Calendar, ChevronDown, Check, Loader2, X } from "lucide-react";
import { getComprobantesSinVincular, getCargosSinVincular, vincularComprobanteCargo } from "@/lib/server/actions/documentos";
import { toast } from "sonner";

interface Socio {
    id: string;
    nombre: string;
    apellidos: string;
}

interface Cargo {
    id: string;
    concepto: string;
    monto: number;
    fecha: Date;
    temporada: { nombre: string };
}

interface Comprobante {
    id: string;
    filename: string;
    concepto: string | null;
    createdAt: Date;
    socio: Socio;
    temporada: { nombre: string };
}

export default function VincularComprobantes() {
    const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [cargos, setCargos] = useState<Record<string, Cargo[]>>({});
    const [loadingCargos, setLoadingCargos] = useState<Record<string, boolean>>({});
    const [linkingId, setLinkingId] = useState<string | null>(null);

    const recargarComprobantes = async () => {
        setLoading(true);
        const res = await getComprobantesSinVincular();
        if (res.success && res.data) {
            setComprobantes(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            const res = await getComprobantesSinVincular();
            if (res.success && res.data) {
                setComprobantes(res.data);
            }
            setLoading(false);
        })();
    }, []);

    const toggleExpand = async (comprobanteId: string) => {
        if (expandedId === comprobanteId) {
            setExpandedId(null);
            return;
        }

        setExpandedId(comprobanteId);

        if (!cargos[comprobanteId]) {
            const socioId = comprobantes.find(c => c.id === comprobanteId)?.socio.id;
            if (socioId) {
                setLoadingCargos(prev => ({ ...prev, [comprobanteId]: true }));
                const res = await getCargosSinVincular(socioId);
                if (res.success && res.data) {
                    setCargos(prev => ({ ...prev, [comprobanteId]: res.data }));
                }
                setLoadingCargos(prev => ({ ...prev, [comprobanteId]: false }));
            }
        }
    };

    const handleVincular = async (documentoId: string, cargoId: string) => {
        setLinkingId(documentoId);
        const res = await vincularComprobanteCargo(documentoId, cargoId);
        setLinkingId(null);

        if (res.success) {
            toast.success("Comprobante vinculado correctamente");
            recargarComprobantes();
            setExpandedId(null);
        } else {
            toast.error(res.error || "Error al vincular");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    if (comprobantes.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2 mb-4">
                    <Link2 size={16} />
                    Comprobantes Sin Vincular
                </h3>
                <p className="text-slate-500 text-sm font-medium text-center py-4">
                    No hay comprobantes pendientes de vincular
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                    <Link2 size={16} className="text-amber-500" />
                    Comprobantes Sin Vincular ({comprobantes.length})
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">
                    Vincula cada comprobante al cargo correspondiente
                </p>
            </div>

            <div className="divide-y divide-slate-50">
                {comprobantes.map((comp) => (
                    <div key={comp.id}>
                        <div 
                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => toggleExpand(comp.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <FileText size={18} className="text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {comp.socio.nombre} {comp.socio.apellidos}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                            <Calendar size={10} />
                                            {new Date(comp.createdAt).toLocaleDateString('es-ES')}
                                            {comp.concepto && (
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                                                    {comp.concepto}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <ChevronDown 
                                    size={18} 
                                    className={`text-slate-400 transition-transform ${expandedId === comp.id ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </div>

                        {expandedId === comp.id && (
                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                {loadingCargos[comp.id] ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="animate-spin text-slate-400" size={20} />
                                    </div>
                                ) : cargos[comp.id]?.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-slate-500">
                                            No hay cargos sin vincular para este jugador
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                            Selecciona el cargo:
                                        </p>
                                        {cargos[comp.id]?.map((cargo) => (
                                            <button
                                                key={cargo.id}
                                                onClick={() => handleVincular(comp.id, cargo.id)}
                                                disabled={linkingId === comp.id}
                                                className="w-full p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-between group disabled:opacity-50"
                                            >
                                                <div className="text-left">
                                                    <p className="text-xs font-bold text-slate-700">{cargo.concepto}</p>
                                                    <p className="text-[10px] text-slate-400">
                                                        {cargo.temporada.nombre} • {new Date(cargo.fecha).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-black text-green-600">
                                                    {cargo.monto.toFixed(2)}€
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
