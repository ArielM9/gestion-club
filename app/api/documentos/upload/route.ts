import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { filename, key } = body;

        if (!filename || !key) {
            return NextResponse.json({ error: "filename y key son requeridos" }, { status: 400 });
        }

        // Crear el registro en DocumentoPendiente
        const nuevoPendiente = await prisma.documentoPendiente.create({
            data: {
                filename: filename,
                tempPath: key,
                estado: 'SUBIDO',
            }
        });

        console.log("[UPLOAD] Documento creado:", nuevoPendiente.id, nuevoPendiente.estado);
        
        return NextResponse.json({ 
            success: true, 
            id: nuevoPendiente.id 
        });

    } catch (error) {
        console.error("Error registrando metadatos:", error);
        return NextResponse.json({ error: "Error al registrar la subida" }, { status: 500 });
    }
}