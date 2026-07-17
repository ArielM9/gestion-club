"use client";

import { useMobileMenu } from "@/lib/store/mobileMenu";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

interface MobileMenuOverlayProps {
  session: any;
}

export function MobileMenuOverlay({ session }: MobileMenuOverlayProps) {
  const { isOpen, close } = useMobileMenu();
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={close}
      />
      <button
        onClick={close}
        className="absolute top-4 left-[18rem] z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg hover:bg-slate-700 transition-colors"
        aria-label="Cerrar menú"
      >
        <X size={20} />
      </button>
      <div className="absolute inset-y-0 left-0 w-72 animate-in slide-in-from-left">
        <Sidebar session={session} />
      </div>
    </div>
  );
}