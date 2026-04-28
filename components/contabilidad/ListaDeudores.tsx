"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { AlertTriangle, UserCircle, ChevronUp, Receipt, CreditCard, Search } from "lucide-react";
import Link from "next/link";
import Pagination from "../jugadores/Pagination";

interface Deudor {
    id: string;
    nombre: string;
    dni: string;
    categoria: string;
    totalCargos: number;
    totalAbonos: number;
    deuda: number;
    detalles?: {
        cargos: { id: string; monto: number; concepto: string; fecha: Date }[];
        abonos: { id: string; monto: number; fecha: Date; motivo?: string | null; metodo?: string }[];
    };
}

export default function ListaDeudores({
    deudores,
    totalPages,
    currentPage
}: {
    deudores?: Deudor[],
    totalPages: number,
    currentPage: number
}) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", "1");
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const toggleRow = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex flex-1 flex-shrink-0">
                    <label htmlFor="search" className="sr-only">Buscar deudores</label>
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        className="peer block w-full rounded-xl border border-slate-200 py-2.5 pl-10 text-sm outline-2 placeholder:text-slate-500 font-medium focus:border-blue-500 transition-all"
                        placeholder="Nombre, apellidos o DNI..."
                        onChange={(e) => handleSearch(e.target.value)}
                        defaultValue={searchParams.get("search")?.toString()}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                    <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" size={16} />
                        Socios con Deuda Pendiente
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Socio</th>
                                <th className="px-8 py-4">Categoría</th>
                                <th className="px-8 py-4">Total Cargos</th>
                                <th className="px-8 py-4">Total Pagado</th>
                                <th className="px-8 py-4 text-right">Pendiente</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(deudores || []).map((d) => (
                                <>
                                    <tr
                                        key={d.id}
                                        onClick={() => toggleRow(d.id)}
                                        className={`cursor-pointer transition-colors ${expandedId === d.id ? "bg-amber-50/50" : "hover:bg-amber-50/30"}`}
                                    >
                                        <td className="px-8 py-4 flex items-center gap-3">
                                            <div className="h-8 w-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                {expandedId === d.id ? <ChevronUp size={18} /> : <UserCircle size={18} />}
                                            </div>
                                            <Link
                                                href={`/jugadores/${d.id}`}
                                                className="text-xs font-black text-slate-700 hover:text-blue-600 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {d.nombre}
                                            </Link>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                                                {d.categoria}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-xs font-medium text-slate-500">{d.totalCargos.toFixed(2)}€</td>
                                        <td className="px-8 py-4 text-xs font-medium text-green-600">{d.totalAbonos.toFixed(2)}€</td>
                                        <td className="px-8 py-4 text-right text-sm font-black text-red-600">
                                            {d.deuda.toFixed(2)}€
                                        </td>
                                    </tr>
                                    {expandedId === d.id && (
                                        <tr className="bg-slate-50/50">
                                            <td colSpan={5} className="px-8 py-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {/* Detalle de Cargos */}
                                                    <div>
                                                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                                            <Receipt size={14} className="text-slate-400" />
                                                            Cargos Pendientes y Realizados
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {d.detalles?.cargos.map((c) => (
                                                                <div key={c.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 text-xs shadow-sm">
                                                                    <div>
                                                                        <p className="font-bold text-slate-700">{c.concepto}</p>
                                                                        <p className="text-[10px] text-slate-400">{new Date(c.fecha).toLocaleDateString()}</p>
                                                                    </div>
                                                                    <span className="font-black text-slate-600">{c.monto.toFixed(2)}€</span>
                                                                </div>
                                                            ))}
                                                            {d.detalles?.cargos.length === 0 && (
                                                                <p className="text-xs text-slate-400 italic">No hay cargos registrados.</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Detalle de Pagos */}
                                                    <div>
                                                        <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                                                            <CreditCard size={14} className="text-green-500" />
                                                            Abonos Recibidos
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {d.detalles?.abonos.map((a) => (
                                                                <div key={a.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 text-xs shadow-sm">
                                                                    <div>
                                                                        <p className="font-bold text-slate-700">{a.motivo || "Cuota / Abono"}</p>
                                                                        <div className="flex gap-2 mt-0.5">
                                                                            <span className="text-[10px] text-slate-400">{new Date(a.fecha).toLocaleDateString()}</span>
                                                                            <span className="text-[10px] font-bold text-blue-500 uppercase">{a.metodo}</span>
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-black text-green-600">-{a.monto.toFixed(2)}€</span>
                                                                </div>
                                                            ))}
                                                            {d.detalles?.abonos.length === 0 && (
                                                                <p className="text-xs text-slate-400 italic">No se han registrado abonos aún.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                    {(deudores || []).length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-medium italic">
                            ¡Increíble! No hay deudas pendientes en el club.
                        </div>
                    )}
                </div>
                <Pagination totalPages={totalPages} currentPage={currentPage} />
            </div>
        </div>
    );
}