import { Suspense } from "react";
import { getAllCategorias } from "@/lib/actions/admin/categorias";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminCategorias from "./AdminCategorias";

export default async function AdminCategoriasPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;
  
  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA") {
    redirect("/");
  }

  const categorias = await getAllCategorias();

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestión de Categorías</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
          Administra las categorías del club (M6, M8, Senior...)
        </p>
      </header>

      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />}>
        <AdminCategorias categorias={categorias} />
      </Suspense>
    </div>
  );
}
