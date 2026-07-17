'use client';

import { useState, useRef } from 'react';
import { X, Upload, Loader2, Image as ImageIcon, CheckCircle2, Camera } from 'lucide-react';
import { toast } from 'sonner';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_MB = 2;

interface SubirFotoModalProps {
    isOpen: boolean;
    onClose: () => void;
    socioId?: string;
    onPhotoUploaded: (url: string) => void;
}

export default function SubirFotoModal({
    isOpen,
    onClose,
    socioId,
    onPhotoUploaded,
}: SubirFotoModalProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadComplete, setUploadComplete] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const resetState = () => {
        setPreviewUrl(null);
        setError(null);
        setUploadComplete(false);
        setIsUploading(false);
        setIsDragging(false);
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Solo se permiten archivos JPG o PNG';
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            return `La imagen no debe superar ${MAX_SIZE_MB}MB`;
        }
        return null;
    };

    const handleUpload = async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError(null);
        setIsUploading(true);

        // Mostrar preview local mientras sube
        const localPreview = URL.createObjectURL(file);
        setPreviewUrl(localPreview);

        try {
            // 1. Obtener presigned URL
            const scope = socioId ? 'permanent' : 'temp';
            const params = new URLSearchParams({
                contentType: file.type,
                scope,
            });
            if (socioId) params.set('socioId', socioId);

            const presignedRes = await fetch(
                `/api/socios/foto/presigned?${params.toString()}`,
                { credentials: 'include' }
            );

            if (!presignedRes.ok) {
                throw new Error('Error al obtener URL de subida');
            }

            const { url, displayUrl } = await presignedRes.json();

            // 2. Subir archivo a MinIO
            const uploadRes = await fetch(url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            });

            if (!uploadRes.ok) {
                throw new Error('Error al subir la imagen');
            }

            setUploadComplete(true);
            toast.success('Foto subida correctamente');
            onPhotoUploaded(displayUrl);

            // Cerrar modal automáticamente después de un breve delay
            setTimeout(() => {
                handleClose();
            }, 1200);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al subir la foto';
            setError(message);
            toast.error(message);
            setIsUploading(false);
            setPreviewUrl(null);
        }
    };

    const handleFileSelect = (file: File | undefined | null) => {
        if (!file) return;
        handleUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFileSelect(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Camera size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900">Subir Foto del Jugador</h3>
                            <p className="text-xs text-slate-500">JPG o PNG. Máx {MAX_SIZE_MB}MB.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
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
                            <p className="text-green-600 font-semibold">¡Foto subida correctamente!</p>
                        </div>
                    ) : isUploading ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            {previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="h-40 w-40 object-cover rounded-2xl border-4 border-slate-100"
                                />
                            ) : (
                                <Loader2 size={48} className="animate-spin text-blue-600" />
                            )}
                            <p className="text-slate-600 font-medium">Subiendo foto...</p>
                        </div>
                    ) : (
                        <>
                            <div
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => inputRef.current?.click()}
                                className={`
                                    border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}
                                `}
                            >
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    className="hidden"
                                    onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <ImageIcon size={32} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            Arrastra tu imagen aquí
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            o haz clic para seleccionar
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                                        JPG, PNG · Máx {MAX_SIZE_MB}MB
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="w-full mt-4 flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
                            >
                                <Upload size={16} />
                                Seleccionar archivo
                            </button>
                        </>
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
