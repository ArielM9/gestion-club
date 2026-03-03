"use client";

import { Phone, FileText, Upload } from "lucide-react";
import type { SocioData } from "@/lib/types/jugador";
import { EditableField } from "@/components/ui/EditableField";

interface ContactoSectionProps {
  formData: SocioData;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  getDocumentoPorTipo: (tipo: string) => any;
  setDocVer: (doc: any) => void;
  setDocSubir: (doc: { tipo: string; label: string } | null) => void;
}

export default function ContactoSection({
  formData,
  isEditing,
  onChange,
  getDocumentoPorTipo,
  setDocVer,
  setDocSubir,
}: ContactoSectionProps) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
      <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
        <Phone size={14} /> Contacto y Familia
      </h2>
      <EditableField
        label="Email"
        name="email"
        value={formData.email || ""}
        isEditing={isEditing}
        onChange={onChange}
      />
      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
        <div className="col-span-2">
          <EditableField
            label="Nombre Tutor"
            name="nombreTutor"
            value={formData.nombreTutor || ""}
            isEditing={isEditing}
            onChange={onChange}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">DNI Tutor</p>
          {isEditing ? (
            <input
              name="dniTutor"
              value={formData.dniTutor || ""}
              onChange={onChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none transition-all"
            />
          ) : (
            <div
              onClick={() => {
                const doc = getDocumentoPorTipo('DNI_TUTOR');
                doc ? setDocVer(doc) : setDocSubir({ tipo: 'DNI_TUTOR', label: 'DNI Tutor' });
              }}
              className="flex items-center gap-2 px-1 cursor-pointer group"
            >
              <span className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors">
                {formData.dniTutor || "---"}
              </span>
              {getDocumentoPorTipo('DNI_TUTOR') ? (
                <FileText size={14} className="text-green-600" />
              ) : (
                <Upload size={14} className="text-red-500 opacity-50" />
              )}
            </div>
          )}
        </div>
        <EditableField
          label="Teléfono"
          name="telefonoTutor"
          value={formData.telefonoTutor || ""}
          isEditing={isEditing}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
