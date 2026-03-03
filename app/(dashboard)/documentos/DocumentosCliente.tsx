"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Upload, AlertCircle, FileText, Filter, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import SocioSelector, { Socio } from '@/components/documentos/SocioSelector';
import DocumentViewerModal from '@/components/documentos/DocumentViewerModal';
import { getDocumentosPendientes, confirmarDocumento, buscarDocumentos } from '@/lib/server/actions/documentos';

interface DocumentoPendiente {
    id: string;
    filename: string;
    estado: string;
    createdAt: Date;
    tipoDetectado?: string | null;
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

interface DocumentoBusqueda {
    id: string;
    filename: string;
    tipo: string;
    storagePath: string;
    socio: {
        id: string;
        nombre: string;
        apellidos: string;
        dni: string;
    };
    temporada: {
        id: string;
        nombre: string;
    };
}

interface DocumentosClienteProps {
    pendientesIniciales: DocumentoPendiente[];
}

export default function DocumentosCliente({ pendientesIniciales }: DocumentosClienteProps) {
    const [pendientes, setPendientes] = useState<DocumentoPendiente[]>(pendientesIniciales);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [resultados, setResultados] = useState<DocumentoBusqueda[]>([]);
    const [searching, setSearching] = useState(false);
    const [documentoSeleccionado, setDocumentoSeleccionado] = useState<DocumentoBusqueda | null>(null);

    const fetchPendientes = useCallback(async () => {
        setLoading(true);
        try {
            const result = await getDocumentosPendientes();
            if (result.success && result.data) {
                setPendientes(result.data);
            }
        } catch (err) {
            console.error("Error fetching pendientes:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const buscarDocumentosFn = useCallback(async (query: string) => {
        if (query.length < 2) {
            setResultados([]);
            return;
        }
        setSearching(true);
        try {
            const result = await buscarDocumentos(query);
            if (result.success && result.data) {
                setResultados(result.data);
            }
        } catch (err) {
            console.error("Error buscando documentos:", err);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery) {
                buscarDocumentosFn(searchQuery);
            } else {
                setResultados([]);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery, buscarDocumentosFn]);

    const handleConfirmar = async (id: string, socio: Socio) => {
        try {
            const doc = pendientes.find(p => p.id === id);
            const result = await confirmarDocumento(id, {
                socioId: socio.id,
                tipo: doc?.tipoDetectado as 'DNI' | 'DR' | 'DJ' | 'ER' | 'AI' | 'COMPROBANTE_PAGO' | undefined,
                temporada: doc?.temporadaDetectada || undefined
            });

            if (result.success) {
                fetchPendientes();
                toast.success("Documento confirmado correctamente");
            } else {
                toast.error(result.error || "Error al confirmar el documento");
            }
        } catch (err) {
            console.error("Error confirmando:", err);
            toast.error("Error de conexión");
        }
    };

    const countPendientes = pendientes.length;
    const documentosQueRequierenAtencion = pendientes.filter(p => 
        p.estado === 'SUBIDO' || p.estado === 'ANALIZANDO' || p.estado === 'MATCH_AUTOMATICO' || p.estado === 'REQUIERE_REVISION'
    );
    const necesitanAtencion = documentosQueRequierenAtencion.length > 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestión de Documentos</h1>
                    <p className="text-slate-500 text-sm">Organiza, busca y asigna archivos digitales de los socios.</p>
                </div>
                <Link
                    href="/documentos/subir"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-semibold transition-all shadow-sm shadow-blue-200 active:scale-95"
                >
                    <Upload size={18} />
                    Subir nuevos archivos
                </Link>
            </div>

            {necesitanAtencion && (
            <section className="bg-white border border-slate-200 rounded-3xl p-1 shadow-sm overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${documentosQueRequierenAtencion.length > 0 ? 'bg-amber-100/80 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                            <AlertCircle size={22} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Archivos por vincular</h2>
                            <p className="text-xs text-slate-500">
                                {loading ? 'Cargando...' : `Hay ${documentosQueRequierenAtencion.length} documentos que requieren atención.`}
                            </p>
                        </div>
                    </div>
                    {documentosQueRequierenAtencion.length > 0 && (
                        <button
                            onClick={fetchPendientes}
                            className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Actualizar"
                        >
                            <Loader2 size={16} className={loading ? 'animate-spin text-blue-500' : ''} />
                        </button>
                    )}
                </div>

                <div className="divide-y divide-slate-100">
                    {loading && pendientes.length === 0 ? (
                        <div className="p-12 flex items-center justify-center text-slate-400 gap-3">
                            <Loader2 size={18} className="animate-spin text-blue-500" />
                            <span className="text-sm font-medium italic text-center">Buscando en la bandeja de entrada...</span>
                        </div>
                    ) : (
                        documentosQueRequierenAtencion.map((doc) => (
                            <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 group-hover:text-slate-900 truncate">
                                            {doc.filename}
                                        </p>
                                        <div className="flex flex-col mt-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${doc.estado === 'MATCH_AUTOMATICO' ? 'bg-green-100 text-green-700' :
                                                        doc.estado === 'ANALIZANDO' ? 'bg-blue-100 text-blue-700' :
                                                            doc.estado === 'CONFIRMADO' ? 'bg-indigo-100 text-indigo-700' :
                                                                'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {doc.estado}
                                                </span>
                                                <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wider">
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {doc.error && (
                                                <p className="text-[10px] text-red-500 mt-1 font-medium bg-red-50 px-2 py-0.5 rounded-lg border border-red-100 inline-block self-start">
                                                    Error: {doc.error}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {doc.estado === 'ANALIZANDO' ? (
                                        <div className="flex items-center gap-2 px-4 py-2 text-blue-500">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Analizando...</span>
                                        </div>
                                    ) : doc.estado === 'CONFIRMADO' ? (
                                        <div className="flex items-center gap-2 px-4 py-2 text-indigo-500 italic">
                                            <Loader2 size={16} className="animate-spin" />
                                            <span className="text-xs font-medium">Moviendo archivo...</span>
                                        </div>
                                    ) : (
                                        <div className="w-full sm:w-auto">
                                            <SocioSelector
                                                initialSocio={doc.socio ? {
                                                    id: doc.socio.id,
                                                    nombre: `${doc.socio.nombre} ${doc.socio.apellidos}`,
                                                    dni: doc.socio.dni
                                                } : null}
                                                onConfirm={(socio) => handleConfirmar(doc.id, socio)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
            )}

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Explorador de Archivos</h2>
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                        <Filter size={14} />
                        Filtros Avanzados
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por socio, DNI, temporada o nombre de archivo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all text-sm"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searching ? (
                        <div className="col-span-full py-12 flex items-center justify-center text-slate-400 gap-3">
                            <Loader2 size={18} className="animate-spin text-blue-500" />
                            <span className="text-sm font-medium italic">Buscando...</span>
                        </div>
                    ) : searchQuery && resultados.length === 0 ? (
                        <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl py-12 flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
                            <FileText size={32} strokeWidth={1} className="text-slate-300 mb-3" />
                            <p className="text-sm font-medium">Sin resultados</p>
                            <p className="text-xs text-slate-400 mt-1">No se encontraron documentos para &quot;{searchQuery}&quot;</p>
                        </div>
                    ) : resultados.length > 0 ? (
                        resultados.map((doc) => (
                            <div 
                                key={doc.id} 
                                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                                onClick={() => setDocumentoSeleccionado(doc)}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 group-hover:bg-blue-100 transition-colors">
                                        <FileText size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-slate-700 truncate flex items-center gap-2">
                                            {doc.filename}
                                            <Eye size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {doc.socio?.nombre} {doc.socio?.apellidos}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                {doc.temporada?.nombre}
                                            </span>
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                                {doc.tipo}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl py-20 flex flex-col items-center justify-center bg-slate-50/50 text-slate-400">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <FileText size={40} strokeWidth={1} />
                            </div>
                            <p className="text-sm font-medium">Buscador global</p>
                            <p className="text-xs text-slate-400 mt-1 text-center max-w-xs">Introduce un término de búsqueda para localizar documentos ya procesados en el sistema</p>
                        </div>
                    )}
                </div>
            </section>

            <DocumentViewerModal
                isOpen={documentoSeleccionado !== null}
                onClose={() => setDocumentoSeleccionado(null)}
                storagePath={documentoSeleccionado?.storagePath || ''}
                filename={documentoSeleccionado?.filename || ''}
            />
        </div>
    );
}
