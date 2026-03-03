'use server';

import prisma from '@/lib/prisma';
import { procesarAnalisisPendiente, finalizarProcesamiento } from '@/lib/documentos/analysis';
import { revalidatePath } from 'next/cache';
import { normalizarTexto } from '@/lib/utils/normalizar';

export async function getDocumentosPendientes() {
    try {
        const pendientes = await prisma.documentoPendiente.findMany({
            include: {
                socio: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return { success: true, data: pendientes };
    } catch (error) {
        console.error("Error al obtener documentos pendientes:", error);
        return { error: "Error al obtener documentos pendientes" };
    }
}

export async function confirmarDocumento(
    documentoId: string,
    data: {
        socioId: string;
        tipo?: 'DNI' | 'DR' | 'DJ' | 'ER' | 'AI' | 'COMPROBANTE_PAGO' | undefined;
        temporada?: string;
    }
) {
    try {
        const actualizado = await prisma.documentoPendiente.update({
            where: { id: documentoId },
            data: {
                socioId: data.socioId,
                tipoDetectado: data.tipo,
                temporadaDetectada: data.temporada,
                estado: 'CONFIRMADO',
            }
        });

        finalizarProcesamiento(documentoId).catch(err => {
            console.error(`Error en procesamiento final de ${documentoId}:`, err);
        });

        revalidatePath('/documentos');
        revalidatePath(`/jugadores/${data.socioId}`);
        
        return { success: true, data: actualizado };
    } catch (error) {
        console.error("Error al confirmar documento:", error);
        return { error: "Error al confirmar el documento" };
    }
}

export async function analizarDocumento(documentoId: string) {
    try {
        const documento = await prisma.documentoPendiente.findUnique({
            where: { id: documentoId }
        });

        if (!documento) {
            return { error: "Documento no encontrado" };
        }

        if (documento.estado !== 'SUBIDO') {
            return { error: "El documento ya fue procesado o está en proceso" };
        }

        await procesarAnalisisPendiente(documentoId);
        
        revalidatePath('/documentos');
        revalidatePath('/documentos/subir');
        
        return { success: true };
    } catch (error) {
        console.error("Error al analizar documento:", error);
        return { error: "Error interno al analizar" };
    }
}

export async function crearDocumentoPendiente(data: { filename: string; key: string }) {
    try {
        const nuevoPendiente = await prisma.documentoPendiente.create({
            data: {
                filename: data.filename,
                tempPath: data.key,
                estado: 'SUBIDO',
            }
        });

        revalidatePath('/documentos');
        revalidatePath('/documentos/subir');
        
        return { success: true, id: nuevoPendiente.id };
    } catch (error) {
        console.error("Error al crear documento pendiente:", error);
        return { error: "Error al registrar la subida" };
    }
}

export async function buscarDocumentos(query: string) {
    try {
        if (!query || query.length < 2) {
            return { success: true, data: [] };
        }

        const queryNormalizada = normalizarTexto(query);

        const resultados = await prisma.documento.findMany({
            where: {
                OR: [
                    { filename: { contains: queryNormalizada, mode: 'insensitive' } },
                    { storagePath: { contains: queryNormalizada, mode: 'insensitive' } },
                    {
                        socio: {
                            OR: [
                                { nombre: { contains: queryNormalizada, mode: 'insensitive' } },
                                { apellidos: { contains: queryNormalizada, mode: 'insensitive' } },
                                { dni: { contains: queryNormalizada, mode: 'insensitive' } }
                            ]
                        }
                    },
                    {
                        temporada: {
                            nombre: { contains: queryNormalizada, mode: 'insensitive' }
                        }
                    }
                ]
            },
            include: {
                socio: {
                    select: {
                        id: true,
                        nombre: true,
                        apellidos: true,
                        dni: true
                    }
                },
                temporada: {
                    select: {
                        id: true,
                        nombre: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        });

        return { success: true, data: resultados };
    } catch (error) {
        console.error("Error buscando documentos:", error);
        return { error: "Error en la búsqueda" };
    }
}

export async function getComprobantesSinVincular() {
    try {
        const comprobantes = await prisma.documento.findMany({
            where: {
                tipo: 'COMPROBANTE_PAGO',
                cargoId: null,
            },
            include: {
                socio: true,
                temporada: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return { success: true, data: comprobantes };
    } catch (error) {
        console.error("Error al obtener comprobantes sin vincular:", error);
        return { error: "Error al obtener comprobantes" };
    }
}

export async function getCargosSinVincular(socioId: string) {
    try {
        const cargos = await prisma.cargo.findMany({
            where: {
                socioId,
                abonos: {
                    none: {}
                }
            },
            include: {
                temporada: true,
            },
            orderBy: {
                fecha: 'desc',
            },
        });
        return { success: true, data: cargos };
    } catch (error) {
        console.error("Error al obtener cargos:", error);
        return { error: "Error al obtener cargos" };
    }
}

export async function vincularComprobanteCargo(documentoId: string, cargoId: string) {
    try {
        await prisma.documento.update({
            where: { id: documentoId },
            data: { cargoId },
        });
        revalidatePath('/contabilidad');
        return { success: true };
    } catch (error) {
        console.error("Error al vincular comprobante:", error);
        return { error: "Error al vincular el comprobante" };
    }
}
