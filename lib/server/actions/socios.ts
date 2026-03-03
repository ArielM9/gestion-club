'use server';

import prisma from '@/lib/prisma';
import { normalizarTexto } from '@/lib/utils/normalizar';

export async function buscarSocios(query: string) {
    try {
        if (!query || query.length < 2) {
            return { success: true, data: [] };
        }

        const queryNormalizada = normalizarTexto(query);

        const socios = await prisma.socio.findMany({
            where: {
                OR: [
                    { nombre: { contains: queryNormalizada, mode: 'insensitive' } },
                    { apellidos: { contains: queryNormalizada, mode: 'insensitive' } },
                    { dni: { contains: queryNormalizada, mode: 'insensitive' } },
                    { nombreTutor: { contains: queryNormalizada, mode: 'insensitive' } },
                    { dniTutor: { contains: queryNormalizada, mode: 'insensitive' } },
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

        const formatted = socios.map(s => {
            const isTutorMatch = s.nombreTutor?.toLowerCase().includes(query.toLowerCase());
            return {
                id: s.id,
                nombre: `${s.nombre} ${s.apellidos}`,
                dni: s.dni,
                subText: isTutorMatch ? `Tutor: ${s.nombreTutor}` : null
            };
        });

        return { success: true, data: formatted };
    } catch (error) {
        console.error("Error buscando socios:", error);
        return { error: "Error al buscar socios" };
    }
}
