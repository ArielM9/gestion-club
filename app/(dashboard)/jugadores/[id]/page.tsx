import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import FichaCliente from "../../../../components/jugadores/FichaCliente";

export default async function JugadorPage({ params }: { params: { id: string } }) {
    const { id } = await params;

    const socio = await prisma.socio.findUnique({
        where: { id },
        include: {
            categoria: true,
            cargos: {
                orderBy: { fecha: 'desc' }
            },
            abonos: {
                orderBy: { fecha: 'desc' }
            }
        },
    });

    const categorias = await prisma.categoria.findMany({
        orderBy: { nombre: "asc" }
    });

    if (!socio) notFound();

    return (
        <div className="max-w-5xl mx-auto p-6">
            <FichaCliente socio={socio} categorias={categorias} />
        </div>
    );
}