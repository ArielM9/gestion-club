"use client";

import Link from "next/link";
import { Plus, UserCheck } from "lucide-react";
import { useState } from "react";
import RenovarSocioModal from "./RenovarSocioModal";

export default function JugadoresPageActions() {
  const [showRenovar, setShowRenovar] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <Link
          href="/jugadores/nuevo"
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
        >
          <Plus size={18} /> Nuevo Socio
        </Link>
        <button
          type="button"
          onClick={() => setShowRenovar(true)}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all"
        >
          <UserCheck size={18} /> Renovar
        </button>
      </div>
      <RenovarSocioModal
        isOpen={showRenovar}
        onClose={() => setShowRenovar(false)}
      />
    </>
  );
}
