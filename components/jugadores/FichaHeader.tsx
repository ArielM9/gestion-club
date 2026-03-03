import { Pencil, Save, X, UserPlus } from "lucide-react";
import type { SocioData } from "@/lib/types/jugador";

interface Props {
  socio: SocioData;
  formData: SocioData;
  isEditing: boolean;
  tieneInscripcionActiva: boolean;
  inscribiendo: boolean;
  temporadaActiva?: string;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onInscribir: () => void;
}

export function FichaHeader({
  socio,
  formData,
  isEditing,
  tieneInscripcionActiva,
  inscribiendo,
  temporadaActiva,
  onEdit,
  onCancelEdit,
  onSave,
  onInscribir,
}: Props) {
  return (
    <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl uppercase">
          {formData.nombre[0]}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {formData.nombre} {formData.apellidos}
          </h1>
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {socio.categoria?.nombre || "Sin equipo"}
          </span>
        </div>
      </div>
      {!isEditing ? (
        <div className="flex gap-2">
          {temporadaActiva && !tieneInscripcionActiva && (
            <button
              onClick={onInscribir}
              disabled={inscribiendo}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {inscribiendo ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <UserPlus size={16} />
              )}
              Inscribirse
            </button>
          )}
          {tieneInscripcionActiva && (
            <span className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-200">
              <UserPlus size={16} /> Inscrito
            </span>
          )}
          <button
            onClick={onEdit}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Pencil size={16} /> Editar Perfil
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={onCancelEdit}
            className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 flex items-center gap-2"
          >
            <X size={16} /> Cancelar
          </button>
          <button
            onClick={onSave}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <Save size={16} /> Guardar
          </button>
        </div>
      )}
    </div>
  );
}
