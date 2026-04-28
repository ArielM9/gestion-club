"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { History, ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SocioData, CargoData, AbonoData } from "@/lib/types/jugador";
import { eliminarCargoAction, eliminarAbonoAction } from "@/lib/actions/socios";
import { eliminarGastoAction } from "@/lib/actions/contabilidad";
import { ModalConfirmarEliminacion } from "@/components/ui/ModalConfirmarEliminacion";

interface MovimientoRow {
  id: string;
  monto: number;
  fecha: Date;
  concepto?: string;
  motivo?: string | null;
  metodo?: string | null;
  estado?: string | null;
  tipoMovimiento?: "cargo" | "abono";
  temporadaId?: string;
}

interface HistorialMovimientosProps {
  socio: SocioData;
  userRole?: string;
}

export default function HistorialMovimientos({ socio, userRole = "COLABORADOR" }: HistorialMovimientosProps) {
  const router = useRouter();
  const canDelete = userRole === "ADMIN" || userRole === "CONTABILIDAD";

  const [itemToDelete, setItemToDelete] = useState<MovimientoRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const movimientos: MovimientoRow[] = [
    ...(socio.cargos || []).map(c => ({ ...c, tipoMovimiento: "cargo" as const })),
    ...(socio.abonos || []).map(a => ({ ...a, tipoMovimiento: "abono" as const, concepto: a.motivo || "Pago recibido" }))
  ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const handleDelete = async (motivo: string) => {
    if (!itemToDelete) return;

    setDeleting(true);
    try {
      let res;
      if (itemToDelete.tipoMovimiento === "cargo") {
        res = await eliminarCargoAction(itemToDelete.id, motivo);
      } else if (itemToDelete.tipoMovimiento === "abono") {
        res = await eliminarAbonoAction(itemToDelete.id, motivo);
      } else {
        res = await eliminarGastoAction(itemToDelete.id, motivo);
      }

      if (res.success) {
        toast.success("Movimiento eliminado correctamente");
        router.refresh();
      } else {
        toast.error(res.error || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error eliminando:", error);
      toast.error("Error al eliminar el movimiento");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
          <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
            <History size={14} /> Historial de Pagos y Cargos
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Concepto / Motivo</th>
                <th className="px-4 py-2">Método / Estado</th>
                <th className="px-4 py-2 text-right">Importe</th>
                {canDelete && <th className="px-4 py-2 text-right w-16"></th>}
              </tr>
            </thead>
            <tbody>
              {movimientos.length > 0 ? (
                movimientos.map((mov) => {
                  const isAbono = mov.tipoMovimiento === "abono";
                  return (
                    <tr key={mov.id} className="group bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 rounded-l-2xl text-xs font-bold text-slate-500">
                        {new Date(mov.fecha).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isAbono ? (
                            <ArrowDownLeft size={14} className="text-green-500" />
                          ) : (
                            <ArrowUpRight size={14} className="text-red-500" />
                          )}
                          <span className="text-xs font-black text-slate-700">
                            {mov.concepto || mov.motivo || "Pago recibido"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-500">
                            {mov.metodo || "CARGO"}
                          </span>
                          {isAbono && mov.estado && (
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${mov.estado === 'APROBADO' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                              {mov.estado}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right text-sm font-black ${isAbono ? "text-green-600" : "text-red-600"}`}>
                        {isAbono ? "+" : "-"}{mov.monto.toFixed(2)}€
                      </td>
                      {canDelete && (
                        <td className="px-4 py-3 rounded-r-2xl text-right">
                          <button
                            onClick={() => setItemToDelete(mov)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar movimiento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : null}
            </tbody>
          </table>
          {movimientos.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-medium text-sm">
              No se han registrado movimientos financieros todavía.
            </div>
          )}
        </div>
      </div>

      <ModalConfirmarEliminacion
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        tipo={itemToDelete?.tipoMovimiento === "abono" ? "abono" : "cargo"}
        monto={itemToDelete?.monto || 0}
        concepto={itemToDelete?.concepto || itemToDelete?.motivo || "Movimiento"}
        fecha={itemToDelete ? new Date(itemToDelete.fecha).toLocaleDateString('es-ES') : undefined}
      />
    </>
  );
}