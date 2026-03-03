'use client';

import { useEffect, useState } from 'react';
import { X, Download, Loader2, FileText } from 'lucide-react';

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    storagePath: string;
    filename: string;
}

export default function DocumentViewerModal({ isOpen, onClose, storagePath, filename }: DocumentViewerModalProps) {
    const [loading, setLoading] = useState(true);
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !storagePath) return;

        const loadUrl = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const res = await fetch(`/api/documentos/view?key=${encodeURIComponent(storagePath)}`, {
                    credentials: 'include'
                });
                const data = await res.json();
                
                if (data.url) {
                    setUrl(data.url);
                } else {
                    setError(data.error || 'Error al cargar el documento');
                }
            } catch (err) {
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        };
        
        loadUrl();
    }, [isOpen, storagePath]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative z-10 w-full max-w-4xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">{filename}</h3>
                            <p className="text-xs text-slate-500">Documento almacenado</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {url && (
                            <a
                                href={url}
                                download={filename}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <Download size={16} />
                                Descargar
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-blue-600" />
                                <p className="text-sm text-slate-500">Cargando documento...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3 text-center px-4">
                                <FileText size={48} className="text-slate-300" />
                                <p className="text-red-500 font-medium">{error}</p>
                                <p className="text-xs text-slate-400">El documento no pudo ser cargado</p>
                            </div>
                        </div>
                    ) : url ? (
                        <iframe
                            src={url}
                            className="w-full h-full border-0"
                            title={filename}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
