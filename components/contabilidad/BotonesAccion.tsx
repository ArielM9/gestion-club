// components/contabilidad/BotonesAccion.tsx
"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import ModalGastos from "@/components/contabilidad/ModalGastos";
import ModalIngresoExterno from "@/components/contabilidad/ModalIngresoExterno";

export default function BotonesAccion() {
    const [showGasto, setShowGasto] = useState(false);
    const [showIngreso, setShowIngreso] = useState(false);

    return (
        <div className="flex gap-3">
            <button
                onClick={() => setShowGasto(true)}
                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
            >
                <Minus size={14} className="text-red-500" /> Registrar Gasto
            </button>

            <button
                onClick={() => setShowIngreso(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
                <Plus size={14} /> Nuevo Ingreso
            </button>

            <ModalGastos isOpen={showGasto} onClose={() => setShowGasto(false)} />
            <ModalIngresoExterno isOpen={showIngreso} onClose={() => setShowIngreso(false)} />
        </div>
    );
}