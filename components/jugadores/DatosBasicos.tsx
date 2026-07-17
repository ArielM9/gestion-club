"use client";

import { User, FileText, Upload } from "lucide-react";
import type { SocioData, CategoriaBasic } from "@/lib/types/jugador";
import { EditableField } from "@/components/ui/EditableField";

interface DatosBasicosProps {
  formData: SocioData;
  socio: SocioData;
  isEditing: boolean;
  categorias: CategoriaBasic[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  getDocumentoPorTipo: (tipo: string) => any;
  setDocVer: (doc: any) => void;
  setDocSubir: (doc: { tipo: string; label: string } | null) => void;
}

export default function DatosBasicos({
  formData,
  isEditing,
  categorias,
  onChange,
  getDocumentoPorTipo,
  setDocVer,
  setDocSubir,
}: DatosBasicosProps) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
      <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
        <User size={14} /> Información Básica
      </h2>
      <div className="grid grid-cols-2 gap-4">
        <EditableField
          label="Nombre"
          name="nombre"
          value={formData.nombre}
          isEditing={isEditing}
          onChange={onChange}
        />
        <EditableField
          label="Apellidos"
          name="apellidos"
          value={formData.apellidos}
          isEditing={isEditing}
          onChange={onChange}
        />
        <EditableField
          label="Mote"
          name="mote"
          value={formData.mote || ""}
          isEditing={isEditing}
          onChange={onChange}
        />
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Fecha Nacimiento</p>
          {isEditing ? (
            <input
              type="date"
              name="fechaNacimiento"
              value={formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString().split('T')[0] : ''}
              onChange={onChange}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          ) : (
            <p className="px-1 text-sm font-black text-slate-700">
              {formData.fechaNacimiento 
                ? new Date(formData.fechaNacimiento).toLocaleDateString('es-ES') 
                : "---"}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">DNI</p>
          {isEditing ? (
            <input
              name="dni"
              value={formData.dni}
              onChange={onChange}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          ) : (
            <div
              onClick={() => {
                const doc = getDocumentoPorTipo('DNI');
                doc ? setDocVer(doc) : setDocSubir({ tipo: 'DNI', label: 'DNI/NIE Socio' });
              }}
              className="flex items-center gap-2 px-1 cursor-pointer group"
            >
              <span className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors">
                {formData.dni || "---"}
              </span>
              {getDocumentoPorTipo('DNI') ? (
                <FileText size={14} className="text-green-600" />
              ) : (
                <Upload size={14} className="text-red-500 opacity-50" />
              )}
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Equipo</p>
        {isEditing ? (
          <select
            name="categoriaId"
            value={formData.categoriaId || ""}
            onChange={onChange}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none transition-all cursor-pointer"
          >
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
        ) : (
          <p className="px-1 text-sm font-black text-blue-600 uppercase italic">
            {formData.categoria?.nombre || "Sin equipo"}
          </p>
        )}
      </div>
    </div>
  );
}
