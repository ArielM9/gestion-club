"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TIPOS_EVENTO = [
  { value: "", label: "Todos los tipos" },
  { value: "PARTIDO", label: "Partidos" },
  { value: "TORNEO", label: "Torneos" },
  { value: "SOCIAL", label: "Eventos Sociales" },
  { value: "REUNION", label: "Reuniones" },
  { value: "OTRO", label: "Otros" },
];

export default function TipoFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentTipo = searchParams.get("tipo") || "";

  const handleTipoChange = (tipo: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (tipo) {
      params.set("tipo", tipo);
    } else {
      params.delete("tipo");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentTipo}
      onChange={(e) => handleTipoChange(e.target.value)}
      className="w-full md:w-56 rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm font-bold focus:border-blue-500 outline-none transition-all cursor-pointer"
    >
      {TIPOS_EVENTO.map((tipo) => (
        <option key={tipo.value} value={tipo.value}>
          {tipo.label}
        </option>
      ))}
    </select>
  );
}
