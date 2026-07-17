"use client";

import { useRouter } from "next/navigation";
import { X, UserPlus, UserCheck } from "lucide-react";

interface InscripcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRenovar: () => void;
}

export default function InscripcionModal({ isOpen, onClose, onOpenRenovar }: InscripcionModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleNuevoSocio = () => {
    onClose();
    router.push("/jugadores/nuevo");
  };

  const handleRenovar = () => {
    onClose();
    onOpenRenovar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative z-10 w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-slate-900">Inscripción</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              Selecciona una opción
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <button
            onClick={handleNuevoSocio}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserPlus size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="font-black text-slate-900">Nuevo Socio</p>
              <p className="text-xs text-slate-500 mt-0.5">Dar de alta un jugador nuevo en el club</p>
            </div>
          </button>

          <button
            onClick={handleRenovar}
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-slate-100 hover:border-green-200 hover:bg-green-50/50 transition-all text-left group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <UserCheck size={22} className="text-green-600" />
            </div>
            <div>
              <p className="font-black text-slate-900">Renovar</p>
              <p className="text-xs text-slate-500 mt-0.5">Reinscribir un jugador de temporada anterior</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
