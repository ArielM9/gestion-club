"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Search } from "lucide-react";

export default function SearchEventos() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Buscar eventos
      </label>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className="peer block w-full rounded-xl border border-slate-200 py-2.5 pl-10 text-sm outline-2 placeholder:text-slate-500 font-medium focus:border-blue-500 transition-all"
        placeholder="Buscar por ubicación, rival, equipo..."
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get("search")?.toString()}
      />
    </div>
  );
}
