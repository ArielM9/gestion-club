import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { socioId, productos } = body;

    if (!socioId || !productos || productos.length === 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true }
    });

    if (!temporadaActiva) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 400 });
    }

    const total = productos.reduce((acc: number, p: any) => acc + p.cantidad, 0);

    const venta = await prisma.venta.create({
      data: {
        socioId,
        tipo: 'ENTREGADA',
        estado: 'COMPLETADA',
        metodo: 'COMPENSACION',
        total: 0,
        temporadaId: temporadaActiva.id,
        productos: {
          create: productos.map((p: any) => ({
            productoId: p.productoId,
            talla: p.talla,
            cantidad: p.cantidad,
            precioUnitario: 0
          }))
        }
      }
    });

    for (const p of productos) {
      const existente = await prisma.productoTalla.findFirst({
        where: { productoId: p.productoId, talla: p.talla }
      });

      if (existente) {
        await prisma.productoTalla.update({
          where: { id: existente.id },
          data: { stock: existente.stock - p.cantidad }
        });
      }

      await prisma.movimientoStock.create({
        data: {
          productoId: p.productoId,
          talla: p.talla,
          cantidad: -p.cantidad,
          tipo: 'ENTREGA',
          razon: `Entrega a socio ${socioId}`,
          ventaId: venta.id,
          temporadaId: temporadaActiva.id
        }
      });
    }

    return NextResponse.json({ success: true, ventaId: venta.id });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al registrar entrega' }, { status: 500 });
  }
}
