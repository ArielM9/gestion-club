// components/contabilidad/LibroDiario.tsx
import { FileText, CheckCircle2, Clock } from "lucide-react";

export default function LibroDiario({ movimientos }: { movimientos: any[] }) {
    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Libro Diario de Movimientos</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                    {movimientos.length} movimientos
                </span>
            </div>
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
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {movimientos.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-4 text-xs font-bold text-slate-500">
                                    {new Date(m.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                </td>
                                <td className="px-8 py-4 text-xs font-black text-slate-700">{m.entidad}</td>
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
                </table>
            </div>
        </div>
    );
}