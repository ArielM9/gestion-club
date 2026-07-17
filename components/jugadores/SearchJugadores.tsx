// components/jugadores/SearchJugadores.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Search, X } from "lucide-react";
import { useRef } from "react";

export default function SearchJugadores() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Usamos debounce para no saturar la base de datos con cada letra
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    
    // IMPORTANTE: Al buscar, reseteamos a la página 1
    params.set("page", "1");

    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }

    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    handleSearch("");
  };

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">Buscar</label>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        className="peer block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-10 text-sm outline-2 placeholder:text-slate-500 font-medium focus:border-blue-500 transition-all"
        placeholder="Nombre, apellidos, DNI o mote..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("search")?.toString()}
      />
      {searchParams.get("search") && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}