import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  label: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export default function ActionButton({ label, description, icon: Icon, href, onClick, variant = "secondary" }: ActionButtonProps) {
  const styles = {
    primary: "bg-[#1e293b] text-white hover:bg-slate-800 shadow-lg shadow-slate-200 cursor-pointer active:scale-95",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm cursor-pointer active:scale-95 text-slate-800"
  };

  const commonClasses = `flex items-center gap-4 p-5 rounded-2xl font-bold transition-all active:scale-95 ${styles[variant]}`;

  const content = (
    <>
      <div className={`p-3 rounded-xl shrink-0 ${variant === "primary" ? "bg-white/10" : "bg-slate-100"}`}>
        <Icon size={22} className={variant === "secondary" ? "text-yellow-600" : "text-white"} />
      </div>
      <div className="min-w-0 text-left">
        <span className="block text-sm font-black">{label}</span>
        {description && (
          <span className={`block text-xs mt-0.5 font-medium ${variant === "primary" ? "text-slate-400" : "text-slate-500"}`}>
            {description}
          </span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className={commonClasses}>
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={commonClasses}>
        {content}
      </Link>
    );
  }

  return null;
}
