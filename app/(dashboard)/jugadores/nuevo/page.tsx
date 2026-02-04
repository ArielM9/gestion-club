import prisma from "@/lib/prisma";
import FormularioSocio from "@/components/jugadores/FormularioSocio";

export default async function NuevoSocioPage() {
  // Traemos las categorías disponibles de la base de datos
  const categorias = await prisma.categoria.findMany({
    orderBy: { nombre: 'asc' }
  });

  return (
    <div className="max-w-4xl mx-auto mb-20">
      <header className="mb-8 px-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Alta de Socio</h1>
        <p className="text-slate-500 font-medium">Completa la ficha técnica y los datos de facturación.</p>
      </header>

      {/* Pasamos las categorías al cliente */}
      <FormularioSocio categorias={categorias} />
    </div>
  );
}