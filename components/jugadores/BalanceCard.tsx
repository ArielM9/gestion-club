"use client";

import { CreditCard, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { SocioData, CargoData, AbonoData } from "@/lib/types/jugador";

interface MovimientoUnificado {
  id: string;
  monto: number;
  fecha: Date;
  concepto?: string;
  motivo?: string | null;
}

interface BalanceCardProps {
  socio: SocioData;
  onOpenPago: () => void;
  onOpenCargo: () => void;
}

export default function BalanceCard({ socio, onOpenPago, onOpenCargo }: BalanceCardProps) {
  const totalCargos = socio.cargos?.reduce((acc: number, c: CargoData) => acc + c.monto, 0) || 0;
  const totalAbonos = socio.abonos?.reduce((acc: number, a: AbonoData) => acc + a.monto, 0) || 0;
  const balanceTotal = totalAbonos - totalCargos;

  const ultimosMovimientos: MovimientoUnificado[] = [...(socio.cargos || []), ...(socio.abonos || [])]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 3);

  return (
    <div className="bg-slate-800 text-white p-8 rounded-[2rem] shadow-xl border border-slate-800 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
            Balance de Cuenta
          </h2>
          <p className={`text-4xl font-black mt-2 tracking-tight ${balanceTotal < 0 ? "text-red-400" : "text-green-400"}`}>
            {balanceTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
          </p>
        </div>
        <CreditCard className="text-slate-700" size={32} />
      </div>
      <div className="flex flex-col gap-2 pt-4">
        <button onClick={onOpenPago} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase py-3 rounded-xl transition-all">
          Registrar Pago
        </button>
        <button onClick={onOpenCargo} className="w-full bg-slate-500 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase py-3 rounded-xl transition-all">
          Generar Cargo
        </button>
      </div>
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          Últimos movimientos
        </p>
        <div className="space-y-3">
          {ultimosMovimientos.length > 0 ? (
            ultimosMovimientos.map((mov) => {
              const isAbono = !mov.concepto;
              return (
                <div
                  key={mov.id}
                  className="flex justify-between text-[11px] font-medium items-center"
                >
                  <span className="text-slate-400 truncate max-w-[140px]">
                    {isAbono ? (mov.motivo || "Abono recibido") : mov.concepto}
                  </span>
                  <span className={isAbono ? "text-green-400" : "text-red-400 font-bold"}>
                    {isAbono ? "+" : "-"}{mov.monto}€
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-[10px] text-slate-600 italic text-center">Sin movimientos</p>
          )}
        </div>
      </div>
    </div>
  );
}
