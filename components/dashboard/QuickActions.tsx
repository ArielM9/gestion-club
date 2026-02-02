import { UserPlus, HandCoins, Shirt } from "lucide-react";
import ActionButton from "@/components/ui/ActionButton";

export default function QuickActions() {
  const actions = [
    {
      label: "Nuevo Jugador",
      description: "Alta de socio y ficha técnica",
      icon: UserPlus,
      href: "/jugadores/nuevo",
      variant: "primary",
    },
    {
      label: "Registrar Pago",
      description: "Cuotas, multas o materiales",
      icon: HandCoins,
      href: "/contabilidad/pago",
      variant: "primary",
    },
    {
      label: "Entrega de Ropa",
      description: "Gestión de stock e inventario",
      icon: Shirt,
      href: "/tienda/entrega",
      variant: "primary",
    },
  ];

  return (
    <section>
      <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Acciones Rápidas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => (
          <ActionButton key={action.label} {...action} />
        ))}
      </div>
    </section>
  );
}