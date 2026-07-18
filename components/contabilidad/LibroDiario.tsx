// components/contabilidad/LibroDiario.tsx
"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock, Search, ChevronLeft, ChevronRight, ChevronDown, Trash2, Check, X, RefreshCw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { eliminarGastoAction, eliminarIngresoExternoAction } from "@/lib/actions/contabilidad";
import { eliminarAbonoAction } from "@/lib/actions/socios";
import { ModalConfirmarEliminacion } from "@/components/ui/ModalConfirmarEliminacion";

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

interface ItemToDelete {
    id: string;
    monto: number;
    concepto: string;
    fecha: Date;
    tipo: "gasto" | "ingreso";
    origen: "gasto" | "abono" | "externo";
}

export default function LibroDiario({
    userRole = "COLABORADOR",
    movimientos,
    totalPages = 1,
    totalItems = 0,
    showApprovalButtons = false,
}: {
    userRole?: string;
    movimientos?: Movimiento[];
    totalPages?: number;
    totalItems?: number;
    showApprovalButtons?: boolean;
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const canDelete = userRole === "ADMIN" || userRole === "CONTABILIDAD";
    const canApprove = userRole === "ADMIN" || userRole === "CONTABILIDAD" || userRole === "DIRECTIVA";

    const currentPage = Number(searchParams.get("page")) || 1;
    const search = searchParams.get("search") || "";
    const filtro = searchParams.get("filtro") || "todos";
    const groupBy = searchParams.get("groupBy") || "";

    const [searchInput, setSearchInput] = useState(search);
    const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [procesando, setProcesando] = useState<string | null>(null);

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

    const handleDelete = async (motivo: string) => {
        if (!itemToDelete) return;

        setDeleting(true);
        try {
            let res;
            if (itemToDelete.origen === "gasto") {
                res = await eliminarGastoAction(itemToDelete.id, motivo);
            } else if (itemToDelete.origen === "abono") {
                res = await eliminarAbonoAction(itemToDelete.id, motivo);
            } else {
                res = await eliminarIngresoExternoAction(itemToDelete.id, motivo);
            }

            if (res?.success) {
                toast.success("Eliminado correctamente");
                router.refresh();
            } else {
                toast.error(res?.error || "Error al eliminar");
            }
        } catch (error) {
            console.error("Error eliminando:", error);
            toast.error("Error al eliminar");
        } finally {
            setDeleting(false);
        }
    };

    const aprobarAbono = async (abonoId: string) => {
        setProcesando(abonoId);
        try {
            const res = await fetch('/api/abonos/aprobar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ abonoId, accion: 'aprobar' }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Abono aprobado');
                router.refresh();
            } else {
                toast.error(data.error || 'Error al aprobar');
            }
        } catch (error) {
            toast.error('Error al aprobar el abono');
        } finally {
            setProcesando(null);
        }
    };

    const rechazarAbono = async (abonoId: string) => {
        if (!confirm('¿Rechazar este pago? Quedará registrado como rechazado.')) return;

        setProcesando(abonoId);
        try {
            const res = await fetch('/api/abonos/aprobar', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ abonoId, accion: 'rechazar' }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success('Abono rechazado');
                router.refresh();
            } else {
                toast.error(data.error || 'Error al rechazar');
            }
        } catch (error) {
            toast.error('Error al rechazar el abono');
        } finally {
            setProcesando(null);
        }
    };

    const handleDeleteClick = (m: Movimiento) => {
        const origen: ItemToDelete["origen"] =
            m.tipo === 'GASTO'
                ? 'gasto'
                : m.esSocio
                    ? 'abono'
                    : 'externo';
        const tipo: ItemToDelete["tipo"] = m.tipo === 'GASTO' ? 'gasto' : 'ingreso';

        setItemToDelete({
            id: m.id,
            monto: m.monto,
            concepto: m.concepto || (m.tipo === 'GASTO' ? 'Gasto' : 'Ingreso'),
            fecha: m.fecha,
            tipo,
            origen,
        });
    };

    const groupedMovimientos = groupBy ? agruparMovimientos(movimientos || [], groupBy) : null;

    function agruparMovimientos(movs: Movimiento[], campo: string) {
        const grupos: Record<string, { items: Movimiento[]; total: number; tipo: string }> = {};

        movs.forEach(m => {
            let clave = "";
            switch (campo) {
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
        <>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                {!showApprovalButtons && (
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
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <tr>
                                <th className="px-8 py-4">Fecha</th>
                                <th className="px-8 py-4">Socio / Entidad</th>
                                <th className="px-8 py-4">Concepto</th>
                                <th className="px-8 py-4">Método</th>
                                <th className="px-8 py-4">Monto</th>
                                <th className="px-8 py-4 text-center">Estado</th>
                                {(canDelete || (showApprovalButtons && canApprove)) && (
                                    <th className="px-8 py-4 text-center w-32">Acciones</th>
                                )}
                            </tr>
                        </thead>

                        {(movimientos || []).length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-bold">
                                        No hay movimientos para mostrar.
                                    </td>
                                </tr>
                            </tbody>
                        ) : groupedMovimientos ? (
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
                                            {(canDelete || (showApprovalButtons && canApprove)) && <td></td>}
                                        </tr>
                                        {data.items.map((m) => (
                                            <FilaMovimiento
                                                key={m.id}
                                                m={m}
                                                canDelete={canDelete}
                                                canApprove={canApprove}
                                                showApprovalButtons={showApprovalButtons}
                                                procesando={procesando}
                                                onDelete={handleDeleteClick}
                                                onAprobar={aprobarAbono}
                                                onRechazar={rechazarAbono}
                                            />
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        ) : (
                            <tbody className="divide-y divide-slate-50">
                                {(movimientos || []).map((m) => (
                                    <FilaMovimiento
                                        key={m.id}
                                        m={m}
                                        canDelete={canDelete}
                                        canApprove={canApprove}
                                        showApprovalButtons={showApprovalButtons}
                                        procesando={procesando}
                                        onDelete={handleDeleteClick}
                                        onAprobar={aprobarAbono}
                                        onRechazar={rechazarAbono}
                                    />
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

            <ModalConfirmarEliminacion
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDelete}
                tipo={itemToDelete?.tipo || "gasto"}
                monto={itemToDelete?.monto || 0}
                concepto={itemToDelete?.concepto || ""}
                fecha={itemToDelete ? new Date(itemToDelete.fecha).toLocaleDateString('es-ES') : undefined}
            />
        </>
    );
}

interface FilaMovimientoProps {
    m: Movimiento;
    canDelete: boolean;
    canApprove: boolean;
    showApprovalButtons: boolean;
    procesando: string | null;
    onDelete: (m: Movimiento) => void;
    onAprobar: (abonoId: string) => void;
    onRechazar: (abonoId: string) => void;
}

function FilaMovimiento({ m, canDelete, canApprove, showApprovalButtons, procesando, onDelete, onAprobar, onRechazar }: FilaMovimientoProps) {
    return (
        <tr className="hover:bg-slate-50/50 transition-colors">
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
                    {m.estado === 'APROBADO' || m.estado === 'APROBADA' ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
                            <CheckCircle2 size={10} /> Aprobado
                        </span>
                    ) : m.estado === 'RECHAZADO' || m.estado === 'RECHAZADA' ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase">
                            <X size={10} /> Rechazado
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase">
                            <Clock size={10} /> Pendiente
                        </span>
                    )}
                </div>
            </td>
            {(canDelete || (showApprovalButtons && canApprove)) && (
                <td className="px-8 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        {showApprovalButtons && canApprove && m.estado === 'PENDIENTE' && (
                            <>
                                <button
                                    onClick={() => onAprobar(m.id)}
                                    disabled={procesando === m.id}
                                    className="p-2 bg-green-100 hover:bg-green-200 rounded-lg text-green-600 transition-colors disabled:opacity-50"
                                    title="Aprobar"
                                >
                                    {procesando === m.id ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                                </button>
                                <button
                                    onClick={() => onRechazar(m.id)}
                                    disabled={procesando === m.id}
                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                                    title="Rechazar"
                                >
                                    <X size={14} />
                                </button>
                            </>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => onDelete(m)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={`Eliminar ${m.tipo === 'GASTO' ? 'gasto' : 'ingreso'}`}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </td>
            )}
        </tr>
    );
}