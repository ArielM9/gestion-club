"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Trophy, PartyPopper, Handshake, MoreHorizontal, Save, Loader2, ArrowLeft } from "lucide-react";
import { crearEventoAction } from "@/lib/actions/eventos";
import { toast } from "sonner";

interface Equipo {
  id: string;
  nombre: string;
  categoria: { id: string; nombre: string };
}

interface FormularioEventoProps {
  equipos: Equipo[];
}

const TIPOS_EVENTO = [
  { value: "PARTIDO", label: "Partido", icon: <Users size={16} /> },
  { value: "TORNEO", label: "Torneo", icon: <Trophy size={16} /> },
  { value: "SOCIAL", label: "Evento Social", icon: <PartyPopper size={16} /> },
  { value: "REUNION", label: "Reunión", icon: <Handshake size={16} /> },
  { value: "OTRO", label: "Otro", icon: <MoreHorizontal size={16} /> },
];

export default function FormularioEvento({ equipos }: FormularioEventoProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState("PARTIDO");

  const [formData, setFormData] = useState({
    tipo: "PARTIDO",
    fecha: "",
    hora: "12:00",
    ubicacion: "",
    titulo: "",
    detalles: "",
    esLocal: true,
    rival: "",
    equipoId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fechaCompleta = `${formData.fecha}T${formData.hora}:00`;

    const res = await crearEventoAction({
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
      toast.success("Evento creado correctamente");
      router.push("/eventos");
      router.refresh();
    } else {
      toast.error(res.error || "Error al crear el evento");
    }
  };

  const showEquipo = tipo === "PARTIDO" || tipo === "TORNEO";
  const showRival = tipo === "PARTIDO";
  const showTitulo = tipo !== "PARTIDO";

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
              onClick={() => {
                setTipo(t.value);
                setFormData({ ...formData, tipo: t.value });
              }}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                tipo === t.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-100 hover:border-slate-200"
              }`}
            >
              <span className={tipo === t.value ? "text-blue-600" : "text-slate-400"}>
                {t.icon}
              </span>
              <span className={`text-xs font-bold ${tipo === t.value ? "text-blue-600" : "text-slate-500"}`}>
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
            placeholder="Campo Municipal, Sede Social, etc."
            value={formData.ubicacion}
            onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Equipo (solo para PARTIDO y TORNEO) */}
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
                  {equipo.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Rival (solo para PARTIDO) */}
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
                placeholder="Nombre del equipo rival"
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

      {/* Título (para no PARTIDO) */}
      {showTitulo && (
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-6">
            Título del Evento
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              required
              placeholder="Ej: Cena de Navidad, Junta Directiva..."
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
            placeholder="Información adicional sobre el evento..."
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
              Crear Evento
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 px-6 py-4 rounded-2xl font-bold text-sm hover:text-slate-700 transition-all"
        >
          <ArrowLeft size={18} />
          Cancelar
        </button>
      </div>
    </form>
  );
}
