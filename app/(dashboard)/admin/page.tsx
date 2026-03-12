import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { Users, Tag, Layers, Download, Trophy } from "lucide-react";

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session) {
    redirect("/login");
  }

  const userRole = session.user.role;
  
  if (userRole !== "ADMIN") {
    redirect("/");
  }

  const adminModules = [
    {
      title: "Usuarios",
      description: "Gestionar usuarios, roles y accesos",
      href: "/admin/usuarios",
      icon: Users,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Categorías",
      description: "Gestionar categorías (M6, M8, Senior...)",
      href: "/admin/categorias",
      icon: Trophy,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Temporadas",
      description: "Gestionar temporadas y precios",
      href: "/admin/temporadas",
      icon: Layers,
      color: "bg-amber-50 text-amber-600",
    },
    {
      title: "Exportar Datos",
      description: "Descargar datos del club",
      href: "/admin/exportar",
      icon: Download,
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="px-2">
        <h1 className="text-3xl font-black text-slate-900">Administración</h1>
        <p className="text-slate-500 font-medium">Configuración y gestión del club</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminModules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 rounded-2xl ${module.color} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
              <module.icon size={24} />
            </div>
            <h2 className="text-lg font-black text-slate-900 mb-1">{module.title}</h2>
            <p className="text-sm text-slate-500 font-medium">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
