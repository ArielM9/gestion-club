import { NextRequest, NextResponse } from 'next/server';
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const filename = searchParams.get('filename');
        const contentType = searchParams.get('contentType') || 'application/pdf';

        if (!filename) {
            return NextResponse.json({ error: "Nombre de archivo requerido" }, { status: 400 });
        }

        const fileExtension = filename.split('.').pop();
        const uniqueId = uuidv4();
        const s3Key = `temp/unassigned/${uniqueId}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: s3Key,
            ContentType: contentType,
        });

        // La URL expira en 15 minutos
        const url = await getSignedUrl(s3, command, { expiresIn: 900 });

        return NextResponse.json({ 
            url, 
            key: s3Key 
        });

    } catch (error) {
        console.error("Error generando presigned URL:", error);
        return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
    }
}
