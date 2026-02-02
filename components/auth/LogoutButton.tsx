"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react"; // Añadimos un icono para que sea más intuitivo

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          router.refresh();
        },
      },
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors duration-200 hover:cursor-pointer"
    >
      <LogOut size={14} />
      <span>Cerrar Sesión</span>
    </button>
  );
};