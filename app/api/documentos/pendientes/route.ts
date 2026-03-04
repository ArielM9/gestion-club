import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pendientes = await prisma.documentoPendiente.findMany({
            include: {
                socio: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(pendientes);
    } catch (error) {
        console.error("Error al obtener documentos pendientes:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}