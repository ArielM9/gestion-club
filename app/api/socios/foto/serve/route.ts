import { NextRequest, NextResponse } from 'next/server';
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: "Key es requerido" }, { status: 400 });
        }

        // Solo permitir claves de fotos (seguridad)
        if (!key.startsWith('fotos/')) {
            return NextResponse.json({ error: "Ruta no permitida" }, { status: 403 });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
        });

        const response = await s3.send(command);

        if (!response.Body) {
            return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
        }

        // Convertir el stream a buffer
        const chunks: Uint8Array[] = [];
        const reader = response.Body.transformToWebStream().getReader();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const buffer = Buffer.concat(chunks);

        // Determinar Content-Type
        const contentType = response.ContentType || (key.endsWith('.png') ? 'image/png' : 'image/jpeg');

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
        });
    } catch (error: any) {
        console.error("Error sirviendo foto:", error);
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
            return NextResponse.json({ error: "Foto no encontrada" }, { status: 404 });
        }
        return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
    }
}
