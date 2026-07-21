import { NextRequest, NextResponse } from 'next/server';
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_CONTENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
type AllowedContentType = typeof ALLOWED_CONTENT_TYPES[number];

const CONTENT_TYPE_TO_EXTENSION: Record<AllowedContentType, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const contentType = searchParams.get('contentType') || 'application/pdf';

        if (!ALLOWED_CONTENT_TYPES.includes(contentType as AllowedContentType)) {
            return NextResponse.json(
                { error: "Tipo de archivo no permitido" },
                { status: 400 }
            );
        }

        const fileExtension = CONTENT_TYPE_TO_EXTENSION[contentType as AllowedContentType];
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
