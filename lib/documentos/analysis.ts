import prisma from '@/lib/prisma';
import { analizarNombreArchivo } from '@/lib/parser';

export async function procesarAnalisisPendiente(pendienteId: string) {
    try {
        // 1. Marcar como ANALIZANDO
        await prisma.documentoPendiente.update({
            where: { id: pendienteId },
            data: { estado: 'ANALIZANDO' }
        });

        // 2. Obtener datos del archivo
        const pendiente = await prisma.documentoPendiente.findUnique({
            where: { id: pendienteId }
        });

        if (!pendiente) return;

        // 3. Analizar nombre
        const analisis = analizarNombreArchivo(pendiente.filename);

        // 4. Buscar socio con lógica flexible (sin tildes y por partes)
        let socioIdFound = null;
        let nuevoEstado: any = 'REQUIERE_REVISION';

        if (analisis.nombreSujeto) {
            // Normalizar: quitar tildes y pasar a minúsculas
            const normalizar = (text: string) => 
                text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

            const nombreBusqueda = normalizar(analisis.nombreSujeto);

            // Buscamos socios. Prisma 'contains' + 'insensitive' ayuda, 
            // pero si en DB tiene tildes y en el nombre no, 'contains' fallará.
            // Una solución robusta es traer candidatos y filtrar en memoria o usar una función de DB.
            // Por ahora, buscaremos coincidencias directas y si falla, intentaremos algo más flexible.
            const socios = await prisma.socio.findMany({
                where: {
                    OR: [
                        { nombre: { contains: analisis.nombreSujeto, mode: 'insensitive' } },
                        { apellidos: { contains: analisis.nombreSujeto, mode: 'insensitive' } }
                    ]
                },
                take: 10
            });

            // Si no hay match directo, probamos normalizando en memoria (fuerza bruta sobre los más probables o todos)
            let matchId: string | null = null;
            
            const directMatch = socios.find(s => 
                normalizar(s.nombre).includes(nombreBusqueda) || 
                normalizar(s.apellidos).includes(nombreBusqueda)
            );

            if (directMatch) {
                matchId = directMatch.id;
            } else {
                // Si aún no hay match, ampliamos la búsqueda a toda la tabla (si no es gigante)
                const todosLosSocios = await prisma.socio.findMany({
                    select: { id: true, nombre: true, apellidos: true, nombreTutor: true, dniTutor: true },
                    where: { activo: true }
                });
                
                const recursiveMatch = todosLosSocios.find(s => 
                    normalizar(s.nombre).includes(nombreBusqueda) || 
                    normalizar(s.apellidos).includes(nombreBusqueda) ||
                    nombreBusqueda.includes(normalizar(s.nombre))
                );
                
                if (recursiveMatch) {
                    matchId = recursiveMatch.id;
                } else {
                    // Si aún no hay match, buscamos por Tutor en los ya cargados
                    const tutorMatch = todosLosSocios.find(s => 
                        (s.nombreTutor && normalizar(s.nombreTutor).includes(nombreBusqueda)) ||
                        (s.dniTutor && normalizar(s.dniTutor).includes(nombreBusqueda))
                    );

                    if (tutorMatch) {
                        matchId = tutorMatch.id;
                        // Podríamos marcar que fue via tutor si tuviéramos campo para ello
                    }
                }
            }

            if (matchId) {
                socioIdFound = matchId;
                nuevoEstado = 'MATCH_AUTOMATICO';
            }
        }

        // 5. Actualizar registro final
        await prisma.documentoPendiente.update({
            where: { id: pendienteId },
            data: {
                tipoDetectado: analisis.tipo,
                nombreDetectado: analisis.nombreSujeto,
                temporadaDetectada: analisis.temporada,
                concepto: analisis.concepto,
                socioId: socioIdFound,
                estado: nuevoEstado,
            }
        });

    } catch (error) {
        console.error(`Error analizando documento ${pendienteId}:`, error);
        await prisma.documentoPendiente.update({
            where: { id: pendienteId },
            data: { 
                estado: 'REQUIERE_REVISION',
                error: error instanceof Error ? error.message : 'Error desconocido'
            }
        });
    }
}

export async function finalizarProcesamiento(pendienteId: string) {
    try {
        // 1. Obtener los datos del pendiente confirmado
        const pendiente = await prisma.documentoPendiente.findUnique({
            where: { id: pendienteId },
            include: { socio: true }
        });

        if (!pendiente || pendiente.estado !== 'CONFIRMADO' || !pendiente.socioId) {
            throw new Error("Documento no listo para procesar o sin socio asignado");
        }

        // 2. Determinar ruta final
        // Estructura: temporadas/{temporada}/socios/{socioId}/{tipo}_{filename}
        const temporada = pendiente.temporadaDetectada || 'sin-temporada';
        const tipo = pendiente.tipoDetectado || 'OTROS';
        const finalPath = `temporadas/${temporada}/socios/${pendiente.socioId}/${tipo}_${pendiente.filename}`;

        // 3. Mover en S3 (Copiar + Borrar)
        const { CopyObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
        const { s3 } = await import('@/lib/s3');

        await s3.send(new CopyObjectCommand({
            Bucket: process.env.S3_BUCKET,
            CopySource: `${process.env.S3_BUCKET}/${pendiente.tempPath}`,
            Key: finalPath,
        }));

        await s3.send(new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: pendiente.tempPath,
        }));

        // 4. Obtener temporada activa
        const temporadaActiva = await prisma.temporada.findFirst({
            where: { activa: true }
        });

        if (!temporadaActiva) {
            throw new Error("No hay una temporada activa configurada");
        }

        // 5. Crear registro definitivo y borrar el pendiente en una transacción
        await prisma.$transaction([
            prisma.documento.create({
                data: {
                    filename: pendiente.filename,
                    storagePath: finalPath,
                    tipo: pendiente.tipoDetectado || 'DNI', 
                    concepto: pendiente.concepto,
                    socioId: pendiente.socioId,
                    temporadaId: temporadaActiva.id,
                    estado: 'PENDIENTE', 
                }
            }),
            prisma.documentoPendiente.delete({
                where: { id: pendienteId }
            })
        ]);

        console.log(`Documento ${pendienteId} procesado con éxito y movido a ${finalPath}`);

    } catch (error) {
        console.error(`Error fatal finalizando procesamiento de ${pendienteId}:`, error);
        // Podríamos marcarlo como ERROR en la DB para que el admin lo vea
        await prisma.documentoPendiente.update({
            where: { id: pendienteId },
            data: { error: error instanceof Error ? error.message : 'Error en movimiento S3/DB' }
        });
    }
}
