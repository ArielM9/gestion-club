"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Trophy, PartyPopper, Handshake, MoreHorizontal, Save, Loader2, Pencil, X, Trash2, ArrowLeft } from "lucide-react";
import { actualizarEventoAction, eliminarEventoAction } from "@/lib/actions/eventos";
import { toast } from "sonner";

interface Equipo {
  id: string;
  nombre: string;
  categoria: { id: string; nombre: string };
}

interface Evento {
  id: string;
  tipo: string;
  fecha: Date;
  ubicacion: string;
  titulo: string | null;
  detalles: string | null;
  esLocal: boolean;
  rival: string | null;
  equipo: Equipo | null;
}

interface FichaEventoProps {
  evento: Evento;
  equipos: Equipo[];
}

const TIPOS_EVENTO = [
  { value: "PARTIDO", label: "Partido", icon: <Users size={16} /> },
  { value: "TORNEO", label: "Torneo", icon: <Trophy size={16} /> },
  { value: "SOCIAL", label: "Evento Social", icon: <PartyPopper size={16} /> },
  { value: "REUNION", label: "Reunión", icon: <Handshake size={16} /> },
  { value: "OTRO", label: "Otro", icon: <MoreHorizontal size={16} />,
  },
];

const tipoLabels: Record<string, string> = {
  PARTIDO: "Partido",
  TORNEO: "Torneo",
  SOCIAL: "Evento Social",
  REUNION: "Reunión",
  OTRO: "Otro",
};

export default function FichaEvento({ evento, equipos }: FichaEventoProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fechaObj = new Date(evento.fecha);
  const esPasado = fechaObj < new Date();

  const [formData, setFormData] = useState({
    tipo: evento.tipo,
    fecha: fechaObj.toISOString().split("T")[0],
    hora: fechaObj.toTimeString().slice(0, 5),
    ubicacion: evento.ubicacion,
    titulo: evento.titulo || "",
    detalles: evento.detalles || "",
    esLocal: evento.esLocal,
    rival: evento.rival || "",
    equipoId: evento.equipo?.id || "",
  });

  const showEquipo = formData.tipo === "PARTIDO" || formData.tipo === "TORNEO";
  const showRival = formData.tipo === "PARTIDO";
  const showTitulo = formData.tipo !== "PARTIDO";
  const showEsLocal = formData.tipo === "PARTIDO";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fechaCompleta = `${formData.fecha}T${formData.hora}:00`;

    const res = await actualizarEventoAction(evento.id, {
      tipo: formData.tipo as "PARTIDO" | "TORNEO" | "SOCIAL" | "REUNION" | "OTRO",
      fecha: new Date(fechaCompleta),
      ubicacion: formData.ubicacion,
      titulo: formData.titulo || null,
      detalles: formData.detalles || null,
      esLocal: formData.esLocal,
      rival: formData.rival || null,
      equipoId: formData.equipoId || null,
    });

    setLoading(false);

    if (res.success) {
      toast.success("Evento actualizado correctamente");
      setIsEditing(false);
      router.refresh();
    } else {
      toast.error(res.error || "Error al actualizar el evento");
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const res = await eliminarEventoAction(evento.id);
    setLoading(false);

    if (res.success) {
      toast.success("Evento eliminado");
      router.push("/eventos");
    } else {
      toast.error(res.error || "Error al eliminar el evento");
    }
  };

  const handleCancel = () => {
    setFormData({
      tipo: evento.tipo,
      fecha: fechaObj.toISOString().split("T")[0],
      hora: fechaObj.toTimeString().slice(0, 5),
      ubicacion: evento.ubicacion,
      titulo: evento.titulo || "",
      detalles: evento.detalles || "",
      esLocal: evento.esLocal,
      rival: evento.rival || "",
      equipoId: evento.equipo?.id || "",
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Tipo de evento */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">
            Tipo de Evento
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {TIPOS_EVENTO.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setFormData({ ...formData, tipo: t.value })}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.tipo === t.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <span className={formData.tipo === t.value ? "text-blue-600" : "text-slate-400"}>
                  {t.icon}
                </span>
                <span className={`text-xs font-bold ${formData.tipo === t.value ? "text-blue-600" : "text-slate-500"}`}>
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Fecha y hora */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
            <Calendar size={16} />
            Fecha y Hora
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Fecha
              </label>
              <input
                type="date"
                required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                Hora
              </label>
              <input
                type="time"
                required
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
            <MapPin size={16} />
            Ubicación
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              required
              value={formData.ubicacion}
              onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Equipo */}
        {showEquipo && (
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
              <Users size={16} />
              Equipo
            </h3>
            <div className="space-y-2">
              <select
                value={formData.equipoId}
                onChange={(e) => setFormData({ ...formData, equipoId: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="">Seleccionar equipo (opcional)</option>
                {equipos.map((equipo) => (
                  <option key={equipo.id} value={equipo.id}>
                    {equipo.nombre} - {equipo.categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Rival */}
        {showRival && (
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">
              Datos del Partido
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                  Rival
                </label>
                <input
                  type="text"
                  value={formData.rival}
                  onChange={(e) => setFormData({ ...formData, rival: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="esLocal"
                  checked={formData.esLocal}
                  onChange={(e) => setFormData({ ...formData, esLocal: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="esLocal" className="text-sm font-bold text-slate-700">
                  Es partido local
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Título */}
        {showTitulo && (
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">
              Título del Evento
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        )}

        {/* Detalles */}
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">
            Detalles Adicionales
          </h3>
          <div className="space-y-2">
            <textarea
              rows={4}
              value={formData.detalles}
              onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#1e293b] text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                Guardar Cambios
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-2 text-slate-500 px-6 py-4 rounded-2xl font-bold text-sm hover:text-slate-700 transition-all"
          >
            <X size={18} />
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/eventos")}
            className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg uppercase">
                {tipoLabels[evento.tipo]}
              </span>
              {esPasado ? (
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  Pasado
                </span>
              ) : (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  Próximo
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              {evento.tipo === "PARTIDO" && evento.rival
                ? `vs ${evento.rival}`
                : evento.titulo || tipoLabels[evento.tipo]}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#1e293b] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
          >
            <Pencil size={16} />
            Editar
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition-all"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Info Principal */}
      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha y Hora</p>
              <p className="text-lg font-bold text-slate-800">
                {fechaObj.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="text-sm font-medium text-slate-500">
                {fechaObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ubicación</p>
              <p className="text-lg font-bold text-slate-800">{evento.ubicacion}</p>
            </div>
          </div>
          <div className="space-y-6">
            {evento.equipo && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Equipo</p>
                <p className="text-lg font-bold text-slate-800">
                  {evento.equipo.nombre}
                  <span className="text-sm font-medium text-slate-500 ml-2">
                    • {evento.equipo.categoria.nombre}
                  </span>
                </p>
              </div>
            )}
            {evento.tipo === "PARTIDO" && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo</p>
                <p className={`text-sm font-bold px-3 py-1 rounded-lg w-fit ${evento.esLocal ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                  {evento.esLocal ? "Partido Local" : "Partido Visitante"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detalles */}
      {evento.detalles && (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-4">Detalles</h3>
          <p className="text-sm font-medium text-slate-600 whitespace-pre-wrap">{evento.detalles}</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-black text-slate-900 mb-4">Confirmar eliminación</h3>
            <p className="text-slate-500 font-medium mb-6">
              ¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-6 py-3 rounded-2xl font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
