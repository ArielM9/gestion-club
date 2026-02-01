"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export const LogoutButton = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login"); // Redirigimos al login tras salir
          router.refresh();      // Forzamos a Next.js a limpiar la caché de la sesión
        },
      },
    });
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
    >
      Cerrar Sesión
    </button>
  );
};