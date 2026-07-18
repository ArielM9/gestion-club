import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { containsNormalized } from '@/lib/utils/normalizar';

export const dynamic = 'force-dynamic';

// Postgres ILIKE no ignora acentos (García != garcia), por eso el filtrado
// accent-insensitive se hace en memoria sobre un pool acotado de socios activos.
const SEARCH_POOL_SIZE = 500;
const MAX_RESULTS = 25;

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        const pool = await prisma.socio.findMany({
            where: { activo: true },
            select: {
                id: true,
                nombre: true,
                apellidos: true,
                dni: true,
                nombreTutor: true,
                dniTutor: true,
            },
            orderBy: [
                { nombre: 'asc' },
                { apellidos: 'asc' },
            ],
            take: SEARCH_POOL_SIZE,
        });

        const results = pool
            .filter(s =>
                containsNormalized(s.nombre, query) ||
                containsNormalized(s.apellidos, query) ||
                containsNormalized(s.dni, query) ||
                containsNormalized(s.nombreTutor, query) ||
                containsNormalized(s.dniTutor, query)
            )
            .slice(0, MAX_RESULTS)
            .map(s => {
                const isTutorMatch = containsNormalized(s.nombreTutor, query);
                return {
                    id: s.id,
                    nombre: `${s.nombre} ${s.apellidos}`,
                    dni: s.dni,
                    subText: isTutorMatch ? `Tutor: ${s.nombreTutor}` : null,
                };
            });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Error buscando socios:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
