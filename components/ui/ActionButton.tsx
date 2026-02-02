import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  href: string;
  variant?: "primary" | "secondary";
}

export default function ActionButton({ label, icon: Icon, href, variant = "secondary" }: ActionButtonProps) {
  // Variantes de estilo para que se vean como botones de verdad
  const styles = {
    primary: "bg-[#1e293b] text-white hover:bg-slate-800 shadow-lg shadow-slate-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm"
  };

  return (
    <Link 
      href={href}
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${styles[variant]}`}
    >
      <Icon size={18} className={variant === "secondary" ? "text-yellow-600" : "text-white"} />
      <span>{label}</span>
    </Link>
  );
}