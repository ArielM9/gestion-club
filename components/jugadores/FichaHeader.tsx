import { Pencil, Save, X, UserPlus, Shield, ShieldCheck, ShieldOff, Camera, Loader2 } from "lucide-react";
import type { SocioData } from "@/lib/types/jugador";

interface Props {
  socio: SocioData;
  formData: SocioData;
  federadoActual?: boolean;
  isEditing: boolean;
  tieneInscripcionActiva: boolean;
  inscribiendo: boolean;
  temporadaActiva?: string;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onInscribir: () => void;
  onTogglarFederado: () => void;
  federando: boolean;
  onPhotoUpload?: () => void;
  onDesinscribir?: () => void;
}

export function FichaHeader({
  socio,
  formData,
  federadoActual = false,
  isEditing,
  tieneInscripcionActiva,
  inscribiendo,
  temporadaActiva,
  onEdit,
  onCancelEdit,
  onSave,
  onInscribir,
  onTogglarFederado,
  federando,
  onPhotoUpload,
  onDesinscribir,
}: Props) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl uppercase overflow-hidden relative group">
          {formData.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formData.fotoUrl}
              alt={formData.nombre}
              className="h-full w-full object-cover"
            />
          ) : (
            formData.nombre[0]
          )}
          {onPhotoUpload && (!formData.fotoUrl || isEditing) && (
            <button
              type="button"
              onClick={onPhotoUpload}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              aria-label={formData.fotoUrl ? "Cambiar foto" : "Subir foto"}
            >
              <Camera size={18} className="text-white" />
            </button>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {formData.nombre} {formData.apellidos}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              {socio.categoria?.nombre || "Sin categoría"}
            </span>
            {tieneInscripcionActiva && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-[10px] font-black text-green-600 uppercase tracking-wider">
                <UserPlus size={10} /> Inscrito
              </span>
            )}
            {federadoActual && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                <ShieldCheck size={10} /> Federado
              </span>
            )}
          </div>
        </div>
      </div>
      {!isEditing ? (
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <Pencil size={16} /> Editar Perfil
          </button>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Botones de inscripción/federación — solo en modo editar */}
          {temporadaActiva && !tieneInscripcionActiva && (
            <button
              onClick={onInscribir}
              disabled={inscribiendo}
              className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {inscribiendo ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              Inscribir
            </button>
          )}
          {tieneInscripcionActiva && (
            <button
              onClick={onTogglarFederado}
              disabled={federando}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm border flex items-center gap-2 transition-all min-h-[44px] ${
                federadoActual
                  ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
              } disabled:opacity-50`}
            >
              {federando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : federadoActual ? (
                <ShieldCheck size={16} />
              ) : (
                <ShieldOff size={16} />
              )}
              {federadoActual ? "Desfederar" : "Federar"}
            </button>
          )}
          {tieneInscripcionActiva && onDesinscribir && (
            <button
              onClick={onDesinscribir}
              className="px-4 py-2.5 rounded-xl font-bold text-sm border border-red-200 text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 min-h-[44px]"
            >
              <X size={16} /> Desinscribir
            </button>
          )}
          <button
            onClick={onCancelEdit}
            className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 flex items-center gap-2 min-h-[44px]"
          >
            <X size={16} /> Cancelar
          </button>
          <button
            onClick={onSave}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 min-h-[44px]"
          >
            <Save size={16} /> Guardar
          </button>
        </div>
      )}
    </div>
  );
}
