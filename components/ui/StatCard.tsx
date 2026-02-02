import { LucideIcon } from "lucide-react";

interface StatCardProps {
  titulo: string;
  valor: string | number;
  icon: LucideIcon;
  color: string; // Ejemplo: "text-blue-600 bg-blue-100"
}

export default function StatCard({ titulo, valor, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-4xl shadow-sm border border-white/50 flex items-center gap-5">
      {/* Círculo del Icono */}
      <div className={`p-4 rounded-4xl ${color}`}>
        <Icon size={24} />
      </div>

      {/* Textos */}
      <div>
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <h3 className="text-2xl font-bold text-slate-900">{valor}</h3>
      </div>
    </div>
  );
}