"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { X, Search, UserCheck, Loader2, CheckCircle2, Archive } from "lucide-react";
import { toast } from "sonner";
import { buscarTodosLosSocios } from "@/lib/actions/socios";
import { inscribirJugadorEnTemporadaAction } from "@/lib/actions/temporadas";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface RenovarSocioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SocioResultado {
  id: string;
  nombre: string;
  dni: string;
  inscrito: boolean;
}

export default function RenovarSocioModal({ isOpen, onClose }: RenovarSocioModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<SocioResultado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [renovandoId, setRenovandoId] = useState<string | null>(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [confirmDeuda, setConfirmDeuda] = useState<{ socioId: string; socioNombre: string; deuda: number } | null>(null);

    const handleSearch = useDebouncedCallback(async (term: string) => {
      const trimmed = term.trim();
      if (trimmed.length < 2) {
        setResultados([]);
        setBusquedaRealizada(false);
        return;
      }

      setBuscando(true);
      const result = await buscarTodosLosSocios(trimmed);
      setBuscando(false);

      if ("error" in result && result.error) {
        toast.error(result.error);
        setResultados([]);
        return;
      }

      if ("data" in result && result.data) {
        setResultados(result.data);
        setBusquedaRealizada(true);
      }
    }, 300);

    const handleChange = (value: string) => {
      setQuery(value);
      handleSearch(value);
    };

    const handleClose = () => {
      setQuery("");
      setResultados([]);
      setBusquedaRealizada(false);
      setRenovandoId(null);
      onClose();
    };

    const handleRenovar = async (socioId: string, socioNombre: string) => {
      setRenovandoId(socioId);

      // Primer intento: sin migrar deuda (para detectar si tiene deuda)
      const result = await inscribirJugadorEnTemporadaAction(socioId, false);

      if (result.tieneDeuda) {
        const deuda = result.deuda ?? 0;
        setConfirmDeuda({ socioId, socioNombre, deuda });
        // No reseteamos renovandoId: se mantiene mientras el diálogo está abierto
        return;
      } else if (result.success) {
        toast.success(`${socioNombre} renovado correctamente`);
        handleClose();
        window.location.reload();
      } else {
        toast.error(result.error || "Error al renovar");
        setRenovandoId(null);
      }
    };

    const handleConfirmMigrarDeuda = async () => {
      if (!confirmDeuda) return;
      const { socioId, socioNombre } = confirmDeuda;
      setConfirmDeuda(null);

      const result = await inscribirJugadorEnTemporadaAction(socioId, true);
      if (result.success) {
        toast.success(`${socioNombre} renovado correctamente`);
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error || "Error al renovar");
        setRenovandoId(null);
      }
    };

    const handleCancelMigrarDeuda = () => {
      setConfirmDeuda(null);
      setRenovandoId(null);
    };

    if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserCheck size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Renovar Jugador</h3>
              <p className="text-xs text-slate-500">Busca un socio archivado para reinscribirlo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Nombre, apellidos o DNI..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-none font-medium focus:border-blue-500 transition-all"
            />
            {buscando && (
              <Loader2
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
              />
            )}
          </div>

          <p className="mt-2 text-[11px] text-slate-400 font-medium">
            Escribe al menos 2 caracteres para buscar
          </p>

          <div className="mt-4 space-y-2">
            {buscando && resultados.length === 0 ? null : resultados.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                {busquedaRealizada ? (
                  <>
                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-sm">Sin resultados</p>
                    <p className="text-xs mt-1">No hay socios que coincidan con la búsqueda</p>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-sm">Busca un jugador</p>
                    <p className="text-xs mt-1">
                      Aquí aparecerán los socios para renovar
                    </p>
                  </>
                )}
              </div>
            ) : (
              resultados.map((socio) => {
                const renovando = renovandoId === socio.id;
                return (
                  <div
                    key={socio.id}
                    className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate">
                        {socio.nombre}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">{socio.dni}</p>
                    </div>

                    {socio.inscrito ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-wider border border-green-200">
                        <CheckCircle2 size={12} />
                        Inscrito
                      </span>
                    ) : (
                      <>
                        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider border border-slate-200">
                          <Archive size={12} />
                          Archivado
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRenovar(socio.id, socio.nombre)}
                          disabled={renovando}
                          className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-2 rounded-lg font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {renovando ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <UserCheck size={14} />
                          )}
                          Renovar
                        </button>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDeuda !== null}
        onClose={handleCancelMigrarDeuda}
        onConfirm={handleConfirmMigrarDeuda}
        title="Migrar deuda pendiente"
        message={
          confirmDeuda
            ? `${confirmDeuda.socioNombre} tiene ${confirmDeuda.deuda}€ de deuda de temporada anterior. ¿Migrar la deuda a la nueva temporada y continuar?`
            : ""
        }
        confirmLabel="Migrar y renovar"
        variant="warning"
        isLoading={renovandoId !== null}
      />
    </div>
  );
}
