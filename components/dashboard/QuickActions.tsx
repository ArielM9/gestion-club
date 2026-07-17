"use client";

import { useState } from "react";
import { UserPlus, HandCoins, Shirt } from "lucide-react";
import ActionButton from "@/components/ui/ActionButton";
import ModalGlobalIngresos from "@/components/dashboard/ModalGlobalIngresos";
import InscripcionModal from "@/components/dashboard/InscripcionModal";
import RenovarSocioModal from "@/components/jugadores/RenovarSocioModal";

export default function QuickActions({ userRole = "COLABORADOR" }: { userRole?: string }) {
  const [showIngreso, setShowIngreso] = useState(false);
  const [showInscripcion, setShowInscripcion] = useState(false);
  const [showRenovar, setShowRenovar] = useState(false);

  const actions = [
    {
      label: "Inscripción",
      description: "Nuevo socio o renovar jugador",
      icon: UserPlus,
      onClick: () => setShowInscripcion(true),
      variant: "primary" as const,
    },
    {
      label: "Registrar Pago",
      description: "Cuotas, multas o materiales",
      icon: HandCoins,
      onClick: () => setShowIngreso(true),
      variant: "primary" as const,
    },
    {
      label: "Entrega de Ropa",
      description: "Gestión de stock e inventario",
      icon: Shirt,
      href: "/tienda/entregas",
      variant: "primary" as const,
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

      <ModalGlobalIngresos
        isOpen={showIngreso}
        onClose={() => setShowIngreso(false)}
        userRole={userRole}
      />

      <InscripcionModal
        isOpen={showInscripcion}
        onClose={() => setShowInscripcion(false)}
        onOpenRenovar={() => setShowRenovar(true)}
      />

      <RenovarSocioModal
        isOpen={showRenovar}
        onClose={() => setShowRenovar(false)}
      />
    </section>
  );
}
