"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Users, Wallet, ShoppingBag, Calendar, FileText, Trophy, Shield } from "lucide-react";
import { LogoutButton } from "../auth/LogoutButton";

export default function Sidebar({ session }: { session: any }) {
  const pathname = usePathname();
  const userRole = session?.user?.role;

  const menuItems = [
    { label: "Inicio", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "CONTABILIDAD", "COLABORADOR"] },
    { label: "Equipos", href: "/equipos", icon: Shield, roles: ["ADMIN", "CONTABILIDAD", "COLABORADOR"] },
    { label: "Jugadores", href: "/jugadores", icon: Users, roles: ["ADMIN", "COLABORADOR", "CONTABILIDAD"] },
    { label: "Documentos", href: "/documentos", icon: FileText, roles: ["ADMIN", "COLABORADOR", "CONTABILIDAD"] },
    { label: "Contabilidad", href: "/contabilidad", icon: Wallet, roles: ["ADMIN", "CONTABILIDAD"] },
    { label: "Tienda e Inventario", href: "/tienda", icon: ShoppingBag, roles: ["ADMIN", "CONTABILIDAD", "DIRECTIVA"] },
    { label: "Eventos", href: "/eventos", icon: Calendar, roles: ["ADMIN", "COLABORADOR"] },
    { label: "Configuración", href: "/admin", icon: Settings, roles: ["ADMIN"] },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1e293b] text-slate-400 p-4 w-64 border-r border-slate-800">
      {/* Cabecera Logo */}
      <div className="flex items-center gap-3 mb-10 px-2 py-4">
        <div className="bg-yellow-500 text-slate-900 font-black p-2 rounded-lg text-xs">RC</div>
        <div>
          <h2 className="text-white font-bold text-sm leading-tight">CR Victorianos</h2>
          <p className="text-[10px] text-slate-500">Panel Admin</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {menuItems.map((item) => {
          if (!item.roles.includes(userRole)) return null;

          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                ? "bg-blue-600/10 text-yellow-500 border border-blue-500/20 shadow-sm"
                : "hover:bg-slate-800 hover:text-white"
                }`}
            >
              <item.icon size={20} className={isActive ? "text-yellow-500" : ""} />
              <span className={`text-sm font-medium ${isActive ? "text-white" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Perfil Usuario */}
      {/* 3. Pie de página (Usuario) */}
      <div className="mt-auto border-t border-slate-800/50 pt-6 px-2">
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar con inicial */}
          <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center text-yellow-500 font-black border border-slate-700">
            {session.user.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {session.user.name}
            </p>
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
              {userRole || "Usuario"}
            </p>
          </div>
        </div>

        {/* El botón ahora es un simple enlace funcional */}
        <LogoutButton />
      </div>

    </div>
  );
}