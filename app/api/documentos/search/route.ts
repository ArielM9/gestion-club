import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const q = searchParams.get('q');

        if (!q || q.length < 2) {
            return NextResponse.json([]);
        }

        const resultados = await prisma.documento.findMany({
            where: {
                OR: [
                    { filename: { contains: q, mode: 'insensitive' } },
                    { storagePath: { contains: q, mode: 'insensitive' } },
                    {
                        socio: {
                            OR: [
                                { nombre: { contains: q, mode: 'insensitive' } },
                                { apellidos: { contains: q, mode: 'insensitive' } },
                                { dni: { contains: q, mode: 'insensitive' } }
                            ]
                        }
                    },
                    {
                        temporada: {
                            nombre: { contains: q, mode: 'insensitive' }
                        }
                    }
                ]
            },
            include: {
                socio: {
                    select: {
                        id: true,
                        nombre: true,
                        apellidos: true,
                        dni: true
                    }
                },
                temporada: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        return NextResponse.json(resultados);
    } catch (error) {
        console.error("Error buscando documentos:", error);
        return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
    }
}
