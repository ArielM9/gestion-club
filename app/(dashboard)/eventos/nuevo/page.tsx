import prisma from "@/lib/prisma";
import FormularioEvento from "@/components/eventos/FormularioEvento";

export default async function NuevoEventoPage() {
  const equipos = await prisma.equipo.findMany({
    include: {
      categoria: true,
      temporada: true,
    },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto mb-20">
      <header className="mb-8 px-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nuevo Evento</h1>
        <p className="text-slate-500 font-medium">
          Crea un nuevo partido, torneo, reunión o evento social.
        </p>
      </header>

      <FormularioEvento equipos={equipos} />
    </div>
  );
}
