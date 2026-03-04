import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== 'ADMIN' && userRole !== 'CONTABILIDAD' && userRole !== 'DIRECTIVA') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { ventaId, accion } = body;

    if (!ventaId || !accion) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    if (accion !== 'aprobar' && accion !== 'rechazar') {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: { productos: true }
    });

    if (!venta) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 });
    }

    if (venta.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'La venta ya ha sido procesada' }, { status: 400 });
    }

    const nuevoEstado = accion === 'aprobar' ? 'APROBADA' : 'RECHAZADA';

    const ventaActualizada = await prisma.venta.update({
      where: { id: ventaId },
      data: {
        estado: nuevoEstado,
        aprobadoPorId: session.user.id
      }
    });

    if (accion === 'rechazar') {
      for (const vp of venta.productos) {
        const productoTalla = await prisma.productoTalla.findFirst({
          where: { productoId: vp.productoId, talla: vp.talla }
        });

        if (productoTalla) {
          await prisma.productoTalla.update({
            where: { id: productoTalla.id },
            data: { stock: productoTalla.stock + vp.cantidad }
          });
        }

        await prisma.movimientoStock.create({
          data: {
            productoId: vp.productoId,
            talla: vp.talla,
            cantidad: vp.cantidad,
            tipo: 'AJUSTE',
            razon: `Venta rechazada ${ventaId}`,
            temporadaId: venta.temporadaId
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      estado: nuevoEstado,
      mensaje: accion === 'aprobar' ? 'Venta aprobada' : 'Venta rechazada y stock restaurado'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 });
  }
}
