import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        const socios = await prisma.socio.findMany({
            where: {
                OR: [
                    { nombre: { contains: query, mode: 'insensitive' } },
                    { apellidos: { contains: query, mode: 'insensitive' } },
                    { dni: { contains: query, mode: 'insensitive' } },
                    { nombreTutor: { contains: query, mode: 'insensitive' } },
                    { dniTutor: { contains: query, mode: 'insensitive' } },
                ],
                activo: true,
            },
            select: {
                id: true,
                nombre: true,
                apellidos: true,
                dni: true,
                nombreTutor: true,
            },
            take: 10,
        });

        // Formateamos para que el SocioSelector lo entienda 
        const formatted = socios.map(s => {
            const isTutorMatch = s.nombreTutor?.toLowerCase().includes(query.toLowerCase());
            return {
                id: s.id,
                nombre: `${s.nombre} ${s.apellidos}`,
                dni: s.dni,
                subText: isTutorMatch ? `Tutor: ${s.nombreTutor}` : null
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Error buscando socios:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
