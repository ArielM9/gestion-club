import { NextRequest, NextResponse } from 'next/server';
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: "Key es requerido" }, { status: 400 });
        }

        if (!key.startsWith('documentos/') && !key.startsWith('fotos/')) {
            return NextResponse.json({ error: "Ruta no permitida" }, { status: 403 });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return NextResponse.json({ url });
    } catch (error) {
        console.error("Error generando URL de visualización:", error);
        return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
    }
}
