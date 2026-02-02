// components/dashboard/EventList.tsx
import { getProximosEventos } from "@/lib/data-fetching";
import EventItem from "@/components/ui/EventItem";

export default async function EventList() {
  // Aquí es donde ocurre la conexión con Prisma
  const eventos = await getProximosEventos();

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Próximos Partidos y Eventos</h2>
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          Ver calendario completo
        </button>
      </div>

      <div className="grid gap-2">
        {eventos.length === 0 ? (
          <p className="text-slate-400 text-center py-10">No hay eventos próximos.</p>
        ) : (
          eventos.map((evento) => (
            <EventItem 
              key={evento.id}
              tipo={evento.tipo}
              fecha={evento.fecha}
              ubicacion={evento.ubicacion}
              rival={evento.rival}
              titulo={evento.titulo}
              esLocal={evento.esLocal}
              // Aquí resolvemos las 3 tablas para el operario
              equipoNombre={evento.equipo?.nombre}
              categoriaNombre={evento.equipo?.categoria?.nombre}
            />
          ))
        )}
      </div>
    </div>
  );
}