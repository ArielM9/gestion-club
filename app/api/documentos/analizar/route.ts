import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { procesarAnalisisPendiente } from '@/lib/documentos/analysis';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { documentoId } = body;
        
        console.log("[ANALIZAR] Recibida petición para documento:", documentoId);

        if (!documentoId) {
            return NextResponse.json({ error: "documentoId es requerido" }, { status: 400 });
        }

        const documento = await prisma.documentoPendiente.findUnique({
            where: { id: documentoId }
        });

        if (!documento) {
            return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
        }

        if (documento.estado !== 'SUBIDO') {
            return NextResponse.json({ 
                error: "El documento ya fue procesado o está en proceso",
                estado: documento.estado 
            }, { status: 400 });
        }

        await procesarAnalisisPendiente(documentoId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error al analizar documento:", error);
        return NextResponse.json({ error: "Error interno al analizar" }, { status: 500 });
    }
}
