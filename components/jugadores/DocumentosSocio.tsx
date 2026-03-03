'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { FileText, Upload, CheckCircle2, AlertCircle, X } from 'lucide-react';
import DocumentViewerModal from '@/components/documentos/DocumentViewerModal';
import SubirDocumentoModal from '@/components/jugadores/SubirDocumentoModal';

interface Documento {
    id: string;
    filename: string;
    tipo: string;
    storagePath: string;
    createdAt?: string;
    temporada?: {
        nombre: string;
    };
}

interface Props {
    documentos: Documento[];
    socioId: string;
    fechaNacimiento?: string | null;
    nacionalidad?: string | null;
    temporadaActiva?: string;
    documentoInicial?: string;
}

const TIPOS_DOCUMENTOS = {
    FICHA: { label: 'Ficha', requerido: true, paraExtranjero: false, paraMenor: false },
    DR: { label: 'Declaración Responsable', requerido: true, paraExtranjero: false, paraMenor: false },
    DJ: { label: 'Declaración Jurada', requerido: false, paraExtranjero: true, paraMenor: false },
    ER: { label: 'Exoneración Responsabilidad', requerido: false, paraExtranjero: false, paraMenor: false },
    AI: { label: 'Autorización Imagen', requerido: false, paraExtranjero: false, paraMenor: true },
};

function calcularEdad(fechaNacimiento: string): number | null {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    return edad;
}

function esExtranjero(nacionalidad: string | null | undefined): boolean {
    if (!nacionalidad) return false;
    return nacionalidad.toLowerCase() !== 'española' && nacionalidad.toLowerCase() !== 'español';
}

export default function DocumentosSocio({
    documentos,
    socioId,
    fechaNacimiento,
    nacionalidad,
    temporadaActiva,
    documentoInicial
}: Props) {
    const [documentoVer, setDocumentoVer] = useState<Documento | null>(null);
    const [documentoSubir, setDocumentoSubir] = useState<{ tipo: string; label: string } | null>(null);

    const getDocumentoPorTipo = (tipo: string) => {
        return documentos.find(d => d.tipo === tipo);
    };

    const initialProcessed = useRef(false);
    useEffect(() => {
        if (documentoInicial && !initialProcessed.current) {
            initialProcessed.current = true;
            const handler = async () => {
                const doc = getDocumentoPorTipo(documentoInicial);
                if (doc) {
                    setDocumentoVer(doc);
                } else {
                    const label = TIPOS_DOCUMENTOS[documentoInicial as keyof typeof TIPOS_DOCUMENTOS]?.label || documentoInicial;
                    setDocumentoSubir({ tipo: documentoInicial, label });
                }
            };
            handler();
        }
    }, [documentoInicial]);

    const esMenor = useMemo(() => {
        const edad = calcularEdad(fechaNacimiento || '');
        return edad !== null && edad < 18;
    }, [fechaNacimiento]);

    const esExtranjeroSocio = useMemo(() => {
        return esExtranjero(nacionalidad);
    }, [nacionalidad]);

    const documentosRequeridos = useMemo(() => {
        return Object.entries(TIPOS_DOCUMENTOS).map(([tipo, config]) => {
            let requerido = config.requerido;
            
            if (tipo === 'DJ' && esExtranjeroSocio) requerido = true;
            if (tipo === 'AI' && esMenor) requerido = true;
            
            return { tipo, ...config, requerido };
        });
    }, [esMenor, esExtranjeroSocio]);

    return (
        <>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <FileText size={14} /> Documentación
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {documentosRequeridos.map((doc) => {
                        const docSubido = getDocumentoPorTipo(doc.tipo);
                        const puedeSubir = doc.requerido || docSubido;
                        
                        if (!puedeSubir && !docSubido) return null;

                        return (
                            <div
                                key={doc.tipo}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    docSubido 
                                        ? 'bg-green-50 border-green-200 hover:border-green-300 cursor-pointer' 
                                        : doc.requerido
                                            ? 'bg-red-50 border-red-200 hover:border-red-300 cursor-pointer'
                                            : 'bg-amber-50 border-amber-200 hover:border-amber-300 cursor-pointer'
                                }`}
                                onClick={() => docSubido ? setDocumentoVer(docSubido) : setDocumentoSubir({ tipo: doc.tipo, label: doc.label })}
                            >
                                <div className="flex items-center gap-3">
                                    {docSubido ? (
                                        <CheckCircle2 size={18} className="text-green-600" />
                                    ) : (
                                        <AlertCircle size={18} className={doc.requerido ? 'text-red-500' : 'text-amber-500'} />
                                    )}
                                    <div>
                                        <p className={`text-sm font-bold ${docSubido ? 'text-green-800' : doc.requerido ? 'text-red-800' : 'text-amber-800'}`}>
                                            {doc.label}
                                        </p>
                                        {docSubido && docSubido.temporada && (
                                            <p className="text-[10px] text-green-600">{docSubido.temporada.nombre}</p>
                                        )}
                                        {!docSubido && doc.requerido && (
                                            <p className="text-[10px] text-red-500">Pendiente</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {docSubido ? (
                                        <span className="text-xs text-green-600 font-medium">Ver</span>
                                    ) : (
                                        <Upload size={16} className={doc.requerido ? 'text-red-500' : 'text-amber-500'} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal para ver documento */}
            {documentoVer && (
                <DocumentViewerModal
                    isOpen={true}
                    onClose={() => setDocumentoVer(null)}
                    storagePath={documentoVer.storagePath}
                    filename={documentoVer.filename}
                />
            )}

            {/* Modal para subir documento */}
            {documentoSubir && (
                <SubirDocumentoModal
                    isOpen={true}
                    onClose={() => setDocumentoSubir(null)}
                    socioId={socioId}
                    tipoDocumento={documentoSubir.tipo}
                    labelDocumento={documentoSubir.label}
                    temporadaActiva={temporadaActiva}
                />
            )}
        </>
    );
}
