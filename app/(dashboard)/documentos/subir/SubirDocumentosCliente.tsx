"use client";

import { useState, useEffect } from 'react';
import { X, FileText, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import SocioSelector, { Socio } from '@/components/documentos/SocioSelector';
import UploadZone from '@/components/documentos/UploadZone';
import { getDocumentosPendientes, confirmarDocumento } from '@/lib/server/actions/documentos';

interface DocumentoPendiente {
    id: string;
    filename: string;
    estado: string;
    createdAt: Date;
    tempPath: string;
    tipoDetectado?: string | null;
    nombreDetectado?: string | null;
    temporadaDetectada?: string | null;
    socioId?: string | null;
    error?: string | null;
    socio?: {
        id: string;
        nombre: string;
        apellidos: string;
        dni: string;
    } | null;
}

interface SubirDocumentosClienteProps {
    archivosIniciales: DocumentoPendiente[];
}

export default function SubirDocumentosCliente({ archivosIniciales }: SubirDocumentosClienteProps) {
    const [archivos, setArchivos] = useState<DocumentoPendiente[]>(archivosIniciales);
    const [loading, setLoading] = useState(false);

    const fetchPendientes = async () => {
        try {
            const result = await getDocumentosPendientes();
            if (result.success && result.data) {
                setArchivos(result.data);
            }
        } catch (error) {
            console.error("Error cargando pendientes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(fetchPendientes, 5000);
        return () => clearInterval(interval);
    }, []);

    const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

    const handleConfirmarSocio = async (archivoId: string, socio: Socio) => {
        setConfirmandoId(archivoId);
        try {
            const doc = archivos.find(a => a.id === archivoId);
            const result = await confirmarDocumento(archivoId, {
                socioId: socio.id,
                tipo: doc?.tipoDetectado as 'DNI' | 'DR' | 'DJ' | 'ER' | 'AI' | 'COMPROBANTE_PAGO' | undefined,
                temporada: doc?.temporadaDetectada || undefined
            });

            if (result.success) {
                await fetchPendientes();
                toast.success("Documento confirmado correctamente");
            } else {
                toast.error(result.error || "Error al confirmar el documento");
            }
        } catch (err) {
            console.error("Error confirmando:", err);
            toast.error("Error de conexión");
        } finally {
            setConfirmandoId(null);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/documentos" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Subir Documentos</h1>
                    <p className="text-slate-500 text-sm italic">Procesa y asigna archivos a la base de datos de socios.</p>
                </div>
            </div>

            <UploadZone onUploadComplete={fetchPendientes} />

            <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest text-balance italic">
                    Cola de procesamiento (Sincronizada con DB)
                </h2>

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Archivo</th>
                                <th className="px-6 py-2">Estado / Asignación</th>
                                <th className="px-6 py-3 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && archivos.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        <Loader2 className="animate-spin mx-auto mb-2" />
                                        Conectando con la base de datos...
                                    </td>
                                </tr>
                            ) : archivos.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                        No hay documentos pendientes de procesar.
                                    </td>
                                </tr>
                            ) : (
                                archivos.map((doc) => (
                                    <tr key={doc.id} className={`${doc.estado === 'REQUIERE_REVISION' ? 'bg-amber-50/40' : 'bg-white'} transition-colors`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className={doc.estado === 'CONFIRMADO' ? 'text-blue-500' : 'text-slate-400'} size={18} />
                                                <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]" title={doc.filename}>
                                                    {doc.filename}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-2">
                                            {(doc.estado === 'SUBIDO' || doc.estado === 'ANALIZANDO') && (
                                                <div className="flex items-center gap-2 text-blue-600">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span className="text-sm font-semibold italic">Procesando en servidor...</span>
                                                </div>
                                            )}

                                            {doc.estado === 'CONFIRMADO' && (
                                                <div className="flex items-center gap-2 text-emerald-600 animate-in fade-in duration-300">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-sm font-semibold uppercase tracking-tight italic">List para archivar</span>
                                                </div>
                                            )}

                                            {doc.estado === 'REQUIERE_REVISION' && (
                                                <div className="flex flex-col gap-1 py-1">
                                                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                                                        <AlertCircle size={14} />
                                                        <span className="text-xs font-bold uppercase tracking-tighter">Socio no reconocido</span>
                                                    </div>
                                                    <SocioSelector onConfirm={(s) => handleConfirmarSocio(doc.id, s)} />
                                                </div>
                                            )}

                                            {doc.estado === 'MATCH_AUTOMATICO' && (
                                                <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                                                    <CheckCircle2 size={16} />
                                                    <span className="italic">Sugerido: {doc.socio?.nombre || "Socio detectado"}</span>
                                                    <button 
                                                        onClick={() => doc.socio && handleConfirmarSocio(doc.id, { id: doc.socio.id, nombre: `${doc.socio.nombre} ${doc.socio.apellidos}`, dni: doc.socio.dni })}
                                                        disabled={confirmandoId === doc.id}
                                                        className="ml-2 text-[10px] bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded uppercase disabled:opacity-50"
                                                    >
                                                        {confirmandoId === doc.id ? '...' : 'Confirmar'}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                                <X size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
