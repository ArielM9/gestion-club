import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import FichaCliente from "../../../../components/jugadores/FichaCliente";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JugadorPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  const userRole = session?.user?.role || "COLABORADOR";

    const socio = await prisma.socio.findUnique({
        where: { id },
        include: {
            categoria: true,
            cargos: {
                orderBy: { fecha: 'desc' }
            },
            abonos: {
                orderBy: { fecha: 'desc' }
            },
            documentos: {
                include: {
                    temporada: {
                        select: { nombre: true }
                    }
                }
            },
            inscripciones: {
                include: {
                    temporada: {
                        select: { nombre: true, activa: true }
                    }
                }
            }
        },
    });

    const categorias = await prisma.categoria.findMany({
        orderBy: { nombre: "asc" }
    });

    const temporadas = await prisma.temporada.findMany({
        where: { activa: true },
        take: 1
    });

    if (!socio) notFound();

    const socioFormateado = {
        ...socio,
        documentos: socio.documentos.map(doc => ({
            ...doc,
            createdAt: doc.createdAt.toISOString()
        }))
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            <FichaCliente 
                socio={socioFormateado} 
                categorias={categorias}
                temporadaActiva={temporadas[0]?.nombre}
                userRole={userRole}
            />
        </div>
    );
}