// components/contabilidad/LibroDiario.tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock, Search, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";

interface Movimiento {
    id: string;
    fecha: Date;
    entidad: string;
    socioId: string | null;
    concepto: string | null;
    monto: number;
    tipo: string;
    metodo: string;
    estado: string;
    esSocio: boolean;
}

export default function LibroDiario({ 
    movimientos, 
    totalPages = 1, 
    totalItems = 0 
}: { 
    movimientos?: Movimiento[];
    totalPages?: number;
    totalItems?: number;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const currentPage = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const filtro = searchParams.get("filtro") || "todos";
    const groupBy = searchParams.get("groupBy") || "";

    const [searchInput, setSearchInput] = useState(search);

    const updateParams = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        updateParams({ search: searchInput, page: "1" });
    };

    const handlePageChange = (newPage: number) => {
        updateParams({ page: String(newPage) });
    };

    const groupedMovimientos = groupBy ? agruparMovimientos(movimientos || [], groupBy) : null;

    function agruparMovimientos(movs: Movimiento[], campo: string) {
        const grupos: Record<string, { items: Movimiento[]; total: number; tipo: string }> = {};
        
        movs.forEach(m => {
            let clave = "";
            switch(campo) {
                case "metodo":
                    clave = m.metodo;
                    break;
                case "tipo":
                    clave = m.tipo;
                    break;
                case "estado":
                    clave = m.estado;
                    break;
                default:
                    clave = m.entidad;
            }
            
            if (!grupos[clave]) {
                grupos[clave] = { items: [], total: 0, tipo: m.tipo };
            }
            grupos[clave].items.push(m);
            grupos[clave].total += m.monto;
        });
        
        return grupos;
    }

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Buscar por entidad o concepto..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">
                        Buscar
                    </button>
                </form>

                <div className="flex gap-2 items-center">
                    <select
                        value={filtro}
                        onChange={(e) => updateParams({ filtro: e.target.value, page: "1" })}
                        className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos">Todos</option>
                        <option value="ingresos">Ingresos</option>
                        <option value="gastos">Gastos</option>
                    </select>

                    <select
                        value={groupBy}
                        onChange={(e) => updateParams({ groupBy: e.target.value })}
                        className="px-4 py-2 bg-blue-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Sin agrupar</option>
                        <option value="entidad">Agrupar por Entidad</option>
                        <option value="metodo">Agrupar por Método</option>
                        <option value="tipo">Agrupar por Tipo</option>
                        <option value="estado">Agrupar por Estado</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr>
                            <th className="px-8 py-4 cursor-pointer hover:text-blue-500" onClick={() => updateParams({ groupBy: groupBy === "fecha" ? "" : "fecha" })}>
                                <div className="flex items-center gap-1">Fecha {groupBy === "fecha" && <ChevronDown size={12} />}</div>
                            </th>
                            <th className="px-8 py-4 cursor-pointer hover:text-blue-500" onClick={() => updateParams({ groupBy: groupBy === "entidad" ? "" : "entidad" })}>
                                <div className="flex items-center gap-1">Socio / Entidad {groupBy === "entidad" && <ChevronDown size={12} />}</div>
                            </th>
                            <th className="px-8 py-4">Concepto</th>
                            <th className="px-8 py-4 cursor-pointer hover:text-blue-500" onClick={() => updateParams({ groupBy: groupBy === "metodo" ? "" : "metodo" })}>
                                <div className="flex items-center gap-1">Método {groupBy === "metodo" && <ChevronDown size={12} />}</div>
                            </th>
                            <th className="px-8 py-4">Monto</th>
                            <th className="px-8 py-4 text-center cursor-pointer hover:text-blue-500" onClick={() => updateParams({ groupBy: groupBy === "estado" ? "" : "estado" })}>
                                <div className="flex items-center gap-1 justify-center">Estado {groupBy === "estado" && <ChevronDown size={12} />}</div>
                            </th>
                        </tr>
                    </thead>
                    
                    {groupedMovimientos ? (
                        <tbody className="divide-y divide-slate-100">
                            {Object.entries(groupedMovimientos).map(([clave, data]) => (
                                <>{/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <tr key={`group-${clave}`} className="bg-blue-50/50 hover:bg-blue-50">
                                        <td colSpan={4} className="px-8 py-3 text-xs font-black text-blue-700 uppercase">
                                            {clave} ({data.items.length} items)
                                        </td>
                                        <td className="px-8 py-3 text-xs font-black text-blue-700">
                                            {data.tipo === 'INGRESO' ? '+' : '-'}{data.total.toFixed(2)}€
                                        </td>
                                        <td></td>
                                    </tr>
                                    {data.items.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-4 text-xs font-bold text-slate-500">
                                                {new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                            </td>
                                            <td className="px-8 py-4 text-xs font-black text-slate-700">
                                                {m.esSocio && m.socioId ? (
                                                    <Link href={`/jugadores/${m.socioId}`} className="text-blue-600 hover:underline">
                                                        {m.entidad}
                                                    </Link>
                                                ) : (
                                                    m.entidad
                                                )}
                                            </td>
                                            <td className="px-8 py-4 text-xs text-slate-500 font-medium">{m.concepto}</td>
                                            <td className="px-8 py-4">
                                                <span className="text-[9px] font-black bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-500 uppercase">
                                                    {m.metodo}
                                                </span>
                                            </td>
                                            <td className={`px-8 py-4 text-xs font-black ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                                                {m.tipo === 'INGRESO' ? '+' : '-'}{m.monto.toFixed(2)}€
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex justify-center">
                                                    {m.estado === 'APROBADO' ? (
                                                        <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
                                                            <CheckCircle2 size={10} /> Aprobado
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">
                                                            <Clock size={10} /> Pendiente
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    ) : (
                        <tbody className="divide-y divide-slate-50">
                            {(movimientos || []).map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 text-xs font-bold text-slate-500">
                                        {new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                    </td>
                                    <td className="px-8 py-4 text-xs font-black text-slate-700">
                                        {m.esSocio && m.socioId ? (
                                            <Link href={`/jugadores/${m.socioId}`} className="text-blue-600 hover:underline">
                                                {m.entidad}
                                            </Link>
                                        ) : (
                                            m.entidad
                                        )}
                                    </td>
                                    <td className="px-8 py-4 text-xs text-slate-500 font-medium">{m.concepto}</td>
                                    <td className="px-8 py-4">
                                        <span className="text-[9px] font-black bg-white border border-slate-200 px-2 py-1 rounded-lg text-slate-500 uppercase">
                                            {m.metodo}
                                        </span>
                                    </td>
                                    <td className={`px-8 py-4 text-xs font-black ${m.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                                        {m.tipo === 'INGRESO' ? '+' : '-'}{m.monto.toFixed(2)}€
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex justify-center">
                                            {m.estado === 'APROBADO' ? (
                                                <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
                                                    <CheckCircle2 size={10} /> Aprobado
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">
                                                    <Clock size={10} /> Pendiente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    )}
                </table>
            </div>

            {totalPages > 1 && !groupBy && (
                <div className="p-6 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                        Mostrando {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalItems)} de {totalItems} movimientos
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-4 py-2 text-sm font-bold text-slate-600">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
