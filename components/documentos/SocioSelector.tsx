import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, User, Check, RotateCcw, Loader2 } from 'lucide-react';
import { buscarSocios } from '@/lib/server/actions/socios';

export interface Socio {
    id: string;
    nombre: string;
    dni: string;
    subText?: string | null;
}

interface Props {
    onConfirm: (socio: Socio) => void;
    initialSocio?: Socio | null;
}

export default function SocioSelector({ onConfirm, initialSocio = null }: Props) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [tempSocio, setTempSocio] = useState<Socio | null>(initialSocio);
    const [socios, setSocios] = useState<Socio[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

    useEffect(() => {
        if (query.length < 2) {
            setSocios([]);
            return;
        }

        const handler = setTimeout(async () => {
            setLoading(true);
            try {
                const result = await buscarSocios(query);
                if (result.success && result.data) {
                    setSocios(result.data);
                }
            } catch (err) {
                console.error("Error buscando socios:", err);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [query]);

    if (tempSocio) {
        return (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 flex flex-col">
                    <span className="text-xs font-bold text-blue-700 uppercase leading-tight">Confirmar asignación:</span>
                    <span className="text-sm font-medium text-slate-900 leading-tight">
                        {tempSocio.nombre} <span className="text-xs text-slate-500 font-normal">({tempSocio.dni})</span>
                    </span>
                </div>
                <button
                    onClick={() => onConfirm(tempSocio)}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm shrink-0"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={() => { setTempSocio(null); setQuery(''); }}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors shrink-0"
                >
                    <RotateCcw size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-xs overflow-visible">
            <div className="relative overflow-visible">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 overflow-visible" size={14} />
                <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Escribe nombre o DNI..."
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => {
                        setIsOpen(true);
                        if (inputRef.current) {
                            const rect = inputRef.current.getBoundingClientRect();
                            setDropdownPosition({ top: rect.bottom + window.scrollY, left: rect.left, width: rect.width });
                        }
                    }}
                />
            </div>

            {isOpen && query.length > 1 && dropdownPosition && typeof window !== 'undefined' && createPortal(
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <ul 
                        className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-2xl max-h-60 overflow-auto divide-y divide-slate-50"
                        style={{ 
                            top: dropdownPosition.top, 
                            left: dropdownPosition.left, 
                            width: dropdownPosition.width 
                        }}
                    >
                        {loading ? (
                            <li className="p-4 flex items-center justify-center gap-2 text-slate-400">
                                <Loader2 size={16} className="animate-spin text-blue-500" />
                                <span className="text-xs">Buscando socios...</span>
                            </li>
                        ) : socios.length > 0 ? (
                            socios.map((socio) => (
                                <li
                                    key={socio.id}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-3 transition-colors text-left"
                                    onClick={() => {
                                        setTempSocio(socio);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                                        <User size={12} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-slate-800 truncate">{socio.nombre}</span>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-mono italic">DNI: {socio.dni}</span>
                                            {socio.subText && (
                                                <span className="text-[9px] text-blue-600 font-medium">({socio.subText})</span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="p-4 text-xs text-slate-400 italic text-center">No hay coincidencias</li>
                        )}
                    </ul>
                </>,
                document.body
            )}
        </div>
    );
}