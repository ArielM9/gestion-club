import { Sparkles } from "lucide-react";

interface WelcomeHeaderProps {
  nombre: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  CONTABILIDAD: "Contabilidad",
  COLABORADOR: "Colaborador",
};

export default function WelcomeHeader({ nombre, role }: WelcomeHeaderProps) {
  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <section
      aria-labelledby="welcome-heading"
      className="relative bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Red accent bar — vibrant block-based touch */}
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-600 via-red-500 to-amber-400" />

      <div className="flex items-center gap-5 p-6 md:p-8">
        <div
          className="hidden sm:flex p-3 rounded-2xl bg-red-50 text-red-600 shrink-0"
          aria-hidden="true"
        >
          <Sparkles size={24} strokeWidth={2.25} />
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <h1
            id="welcome-heading"
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight"
          >
            Bienvenido, <span className="text-red-600">{nombre}</span>
          </h1>
          <p className="mt-1.5 text-sm font-bold text-slate-500 uppercase tracking-wider">
            {roleLabel}
          </p>
        </div>
      </div>
    </section>
  );
}
