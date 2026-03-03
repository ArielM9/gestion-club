"use client";

import { useState } from "react";
import { Download, FileText, Users, CreditCard, Calendar } from "lucide-react";
import { toast } from "sonner";
import { exportarDatosAction, getTemporadasParaExport, type TipoExportacion } from "@/lib/actions/admin/exportar";

interface TemporadasData {
  id: string;
  nombre: string;
  activa: boolean;
}

export default function ExportarDatos({ temporadas }: { temporadas: TemporadasData[] }) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState<string>("");

  const temporadaActiva = temporadas.find(t => t.activa);
  const temporadaDefault = temporadaSeleccionada || temporadaActiva?.id || "";

  const handleExport = async (tipo: TipoExportacion) => {
    setExporting(tipo);
    
    const result = await exportarDatosAction(tipo, temporadaDefault);
    
    setExporting(null);
    
    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.success && result.data) {
      const blob = new Blob([result.data], { type: "text/c charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Exportado: ${result.filename}`);
    }
  };

  const opcionesExport = [
    {
      id: "socios" as TipoExportacion,
      title: "Socios",
      description: "Exportar lista de socios activos",
      icon: Users,
      color: "bg-blue-50 text-blue-600 hover:bg-blue-100"
    },
    {
      id: "inscripciones" as TipoExportacion,
      title: "Inscripciones",
      description: "Exportar inscripciones de la temporada",
      icon: Calendar,
      color: "bg-green-50 text-green-600 hover:bg-green-100"
    },
    {
      id: "contabilidad" as TipoExportacion,
      title: "Contabilidad",
      description: "Exportar movimientos financieros",
      icon: CreditCard,
      color: "bg-amber-50 text-amber-600 hover:bg-amber-100"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Selector de temporada */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Calendar size={18} />
          Temporada para exportar
        </h3>
        <select
          value={temporadaDefault}
          onChange={(e) => setTemporadaSeleccionada(e.target.value)}
          className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none"
        >
          <option value="">Temporada activa</option>
          {temporadas.map(t => (
            <option key={t.id} value={t.id}>
              {t.nombre} {t.activa ? "(activa)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Opciones de exportación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {opcionesExport.map(opcion => (
          <button
            key={opcion.id}
            onClick={() => handleExport(opcion.id)}
            disabled={exporting === opcion.id}
            className={`p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all text-left ${opcion.color} disabled:opacity-50`}
          >
            <div className="flex items-center justify-between mb-4">
              <opcion.icon size={28} />
              {exporting === opcion.id ? (
                <span className="text-xs font-bold animate-pulse">Exportando...</span>
              ) : (
                <Download size={20} />
              )}
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">{opcion.title}</h3>
            <p className="text-xs text-slate-600">{opcion.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl">
        <p className="text-sm text-slate-500">
          Los archivos se exportan en formato CSV, compatible con Excel y Google Sheets.
        </p>
      </div>
    </div>
  );
}
