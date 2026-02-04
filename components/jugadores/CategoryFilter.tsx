"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {     ChevronDown, Filter } from "lucide-react";

interface Category {
  id: string;
  nombre: string;
}

export default function CategoryFilter({ categorias }: { categorias: Category[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleFilter = (id: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", "1"); // También reseteamos página aquí

    if (id && id !== "all") {
      params.set("categoria", id);
    } else {
      params.delete("categoria");
    }

    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="relative w-full md:w-64">
      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <select
        onChange={(e) => handleFilter(e.target.value)}
        defaultValue={searchParams.get("categoria")?.toString() || "all"}
        className="block w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-bold appearance-none bg-white focus:border-blue-500 outline-none transition-all cursor-pointer text-slate-700"
      >
        <option value="all">Todas las categorías</option>
        {categorias.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}