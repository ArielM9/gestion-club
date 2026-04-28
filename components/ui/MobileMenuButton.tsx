"use client";

import { useMobileMenu } from "@/lib/store/mobileMenu";
import { Menu, X } from "lucide-react";

export function MobileMenuButton() {
  const { isOpen, toggle } = useMobileMenu();

  return (
    <button
      onClick={toggle}
      className="md:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:bg-slate-800 transition-colors"
      aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  );
}