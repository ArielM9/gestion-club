'use client';

import { useState } from 'react';
import { X, Upload, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { crearDocumentoPendiente, confirmarDocumento } from '@/lib/server/actions/documentos';

interface SubirDocumentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    socioId: string;
    tipoDocumento: string;
    labelDocumento: string;
    temporadaActiva?: string;
}

export default function SubirDocumentoModal({
    isOpen,
    onClose,
    socioId,
    tipoDocumento,
    labelDocumento,
    temporadaActiva
}: SubirDocumentoModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUpload = async (file: File) => {
        if (!file) return;
        
        setIsUploading(true);
        setError(null);

        try {
            // 1. Obtener presigned URL
            const presignedRes = await fetch(`/api/documentos/upload/presigned?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`, {
                credentials: 'include'
            });
            
            if (!presignedRes.ok) throw new Error("Error al obtener URL de subida");
            
            const { url, key } = await presignedRes.json();

            // 2. Subir a MinIO
            const uploadRes = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
            });

            if (!uploadRes.ok) throw new Error("Error al subir archivo");

            // 3. Registrar en DB usando Server Action
            const crearResult = await crearDocumentoPendiente({ filename: file.name, key });
            
            if (!crearResult.success || !crearResult.id) {
                throw new Error(crearResult.error || "Error al registrar documento");
            }

            // 4. Confirmar con socio y tipo usando Server Action
            const tipo = tipoDocumento as 'DNI' | 'DR' | 'DJ' | 'ER' | 'AI' | 'COMPROBANTE_PAGO';
            const confirmarResult = await confirmarDocumento(crearResult.id, {
                socioId,
                tipo,
                temporada: temporadaActiva
            });

            if (!confirmarResult.success) {
                throw new Error(confirmarResult.error || "Error al confirmar documento");
            }

            setUploadComplete(true);
            
            // Cerrar automáticamente después de 2 segundos
            setTimeout(() => {
                onClose();
                setUploadComplete(false);
            }, 2000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al subir documento');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            handleUpload(file);
        } else {
            setError('Por favor, sube un archivo PDF');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Upload size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Subir {labelDocumento}</h3>
                            <p className="text-xs text-slate-500">Solo archivos PDF</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {uploadComplete ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <div className="p-4 bg-green-100 rounded-full">
                                <CheckCircle2 size={48} className="text-green-600" />
                            </div>
                            <p className="text-green-600 font-semibold">¡Documento subido correctamente!</p>
                        </div>
                    ) : isUploading ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 size={48} className="animate-spin text-blue-600" />
                            <p className="text-slate-600 font-medium">Subiendo documento...</p>
                        </div>
                    ) : (
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
                            `}
                        >
                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                id="file-upload"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <FileText size={32} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            Arrastra tu PDF aquí
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            o haz clic para seleccionar
                                        </p>
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
