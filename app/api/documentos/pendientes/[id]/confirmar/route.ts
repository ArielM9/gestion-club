import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { finalizarProcesamiento } from '@/lib/documentos/analysis';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { socioId, tipo, temporada } = body;

        if (!socioId) {
            return NextResponse.json({ error: "socioId es requerido" }, { status: 400 });
        }

        // 1. Marcar como CONFIRMADO en la DB
        const actualizado = await prisma.documentoPendiente.update({
            where: { id },
            data: {
                socioId,
                tipoDetectado: tipo || undefined,
                temporadaDetectada: temporada || undefined,
                estado: 'CONFIRMADO',
            }
        });

        // 2. Disparar el procesamiento final (mover archivo, crear Documento definitivo)
        // Fire & Forget para no bloquear la UI
        finalizarProcesamiento(id).catch(err => {
            console.error(`Error en procesamiento final de ${id}:`, err);
        });

        return NextResponse.json({ success: true, data: actualizado });

    } catch (error) {
        console.error("Error al confirmar documento:", error);
        return NextResponse.json({ error: "Error interno al confirmar" }, { status: 500 });
    }
}
