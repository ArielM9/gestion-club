import { NextRequest, NextResponse } from 'next/server';
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png'] as const;

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const socioId = searchParams.get('socioId');
        const contentType = searchParams.get('contentType') || 'image/jpeg';
        const scope = searchParams.get('scope') || 'temp';

        if (scope === 'permanent') {
            const role = session.user.role as string;
            if (role !== 'ADMIN' && role !== 'CONTABILIDAD') {
                return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
            }
        }

        if (!ALLOWED_CONTENT_TYPES.includes(contentType as typeof ALLOWED_CONTENT_TYPES[number])) {
            return NextResponse.json(
                { error: "Solo se permiten archivos JPG o PNG" },
                { status: 400 }
            );
        }

        const fileExtension = contentType === 'image/png' ? 'png' : 'jpg';
        const uniqueId = uuidv4();

        let s3Key: string;
        if (scope === 'permanent' && socioId) {
            s3Key = `fotos/${socioId}.${fileExtension}`;
        } else {
            s3Key = `fotos/temp/${uniqueId}.${fileExtension}`;
        }

        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: s3Key,
            ContentType: contentType,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 900 });

        // URL del proxy interno que sirve la imagen desde el servidor
        // Evita problemas de CORS y mixed content con MinIO
        const displayUrl = `/api/socios/foto/serve?key=${encodeURIComponent(s3Key)}`;

        return NextResponse.json({
            url,
            key: s3Key,
            displayUrl
        });
    } catch (error) {
        console.error("Error generando presigned URL para foto:", error);
        return NextResponse.json(
            { error: "Error de servidor" },
            { status: 500 }
        );
    }
}
