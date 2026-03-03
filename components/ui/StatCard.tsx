import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatCardProps {
  titulo: string;
  valor: string | number;
  icon: LucideIcon;
  color: string; // Ejemplo: "text-blue-600 bg-blue-100"
  href?: string;
}

export default function StatCard({ titulo, valor, icon: Icon, color, href }: StatCardProps) {
  const content = (
    <div className="bg-white p-6 rounded-4xl shadow-sm border border-white/50 flex items-center gap-5 hover:shadow-md transition-shadow cursor-pointer h-full min-h-[100px]">
      {/* Círculo del Icono */}
      <div className={`p-4 rounded-4xl ${color} shrink-0`}>
        <Icon size={24} />
      </div>

      {/* Textos */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500 truncate">{titulo}</p>
        <h3 className="text-2xl font-bold text-slate-900 truncate">{valor}</h3>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }

  return content;
}