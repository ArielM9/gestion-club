'use client';

import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { crearDocumentoPendiente, analizarDocumento } from '@/lib/server/actions/documentos';

interface Props {
    onUploadComplete: () => void;
}

export default function UploadZone({ onUploadComplete }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setIsDragging(false);

        const uploadPromises = Array.from(files).map(async (file) => {
            try {
                // 1. Obtener Presigned URL
                const presignedRes = await fetch(`/api/documentos/upload/presigned?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`, {
                    credentials: 'include'
                });
                
                if (!presignedRes.ok) {
                    throw new Error("Error obteniendo presigned URL");
                }
                
                const data = await presignedRes.json();
                const { url, key } = data;

                if (!url) throw new Error("No se pudo obtener la URL de subida");

                // 2. Subir directamente a MinIO
                const uploadRes = await fetch(url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        'Content-Type': file.type,
                    },
                });

                if (!uploadRes.ok) throw new Error("Fallo en la subida directa a MinIO");

                // 3. Registrar en backend usando Server Action
                const crearResult = await crearDocumentoPendiente({
                    filename: file.name,
                    key: key,
                });

                if (!crearResult.success || !crearResult.id) {
                    throw new Error(crearResult.error || "Error al registrar el archivo");
                }

                // 4. Disparar análisis automático (fire & forget)
                analizarDocumento(crearResult.id).catch(err => console.error("Error al iniciar análisis:", err));

                return true;
            } catch (error) {
                console.error("Error subiendo archivo:", file.name, error);
                return false;
            }
        });

        await Promise.all(uploadPromises);

        setIsUploading(false);
        onUploadComplete(); // Refrescamos la tabla de la base de datos
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => {
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
            }}
            className={`
                relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200
                flex flex-col items-center justify-center text-center group
                ${isDragging
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01] shadow-lg'
                    : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-blue-400'
                }
                ${isUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <input
                type="file"
                multiple
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={isUploading}
            />

            <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform
                ${isDragging ? 'bg-blue-500 text-white animate-bounce' : 'bg-blue-100 text-blue-600 group-hover:scale-110'}
            `}>
                {isUploading ? (
                    <Loader2 size={32} className="animate-spin" />
                ) : (
                    <Upload size={32} />
                )}
            </div>

            <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-700">
                    {isUploading ? 'Subiendo archivos...' : 'Arrastra tus PDF aquí'}
                </p>
                <p className="text-sm text-slate-500">
                    O haz clic para explorar tus carpetas
                </p>
            </div>

            {isDragging && (
                <div className="absolute inset-0 pointer-events-none border-4 border-blue-500 rounded-2xl animate-pulse" />
            )}
        </div>
    );
}