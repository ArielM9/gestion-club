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
    const { socioId, tipo, metodo, productos } = body;

    if (!productos || productos.length === 0) {
      return NextResponse.json({ error: 'Añade productos' }, { status: 400 });
    }

    if ((tipo === 'PLAZOS' || tipo === 'FIADO') && !socioId) {
      return NextResponse.json({ error: 'Selecciona un socio para venta a plazos o fiado' }, { status: 400 });
    }

    const temporadaActiva = await prisma.temporada.findFirst({
      where: { activa: true }
    });

    if (!temporadaActiva) {
      return NextResponse.json({ error: 'No hay temporada activa' }, { status: 400 });
    }

    const total = productos.reduce((acc: number, p: any) => acc + (p.precio * p.cantidad), 0);
    
    let estadoInicial: "PENDIENTE" | "APROBADA" | "COMPLETADA" = 'APROBADA';
    
    if (tipo === 'DIRECTA' && metodo === 'EFECTIVO') {
      estadoInicial = 'PENDIENTE';
    }

    const venta = await prisma.venta.create({
      data: {
        socioId: socioId || null,
        tipo: tipo || 'DIRECTA',
        estado: estadoInicial,
        metodo: tipo === 'DIRECTA' ? metodo : 'COMPENSACION',
        total,
        temporadaId: temporadaActiva.id,
        productos: {
          create: productos.map((p: any) => ({
            productoId: p.productoId,
            talla: p.talla,
            cantidad: p.cantidad,
            precioUnitario: p.precio
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
          tipo: 'VENTA',
          razon: `Venta ${venta.id}`,
          ventaId: venta.id,
          temporadaId: temporadaActiva.id
        }
      });
    }

    let mensaje = 'Venta registrada correctamente';
    let cargoId: string | null = null;

    if (tipo === 'PLAZOS' || tipo === 'FIADO') {
      const cargo = await prisma.cargo.create({
        data: {
          socioId: socioId,
          monto: total,
          concepto: tipo === 'PLAZOS' 
            ? `Ropa club - Venta a plazos (${productos.length} artículo${productos.length > 1 ? 's' : ''})`
            : `Ropa club - Pendiente`,
          temporadaId: temporadaActiva.id
        }
      });
      cargoId = cargo.id;
      mensaje = tipo === 'PLAZOS' 
        ? `Venta a plazos registrada. Generado cargo de ${total.toFixed(2)}€`
        : `Venta fiada registrada. Generado cargo de ${total.toFixed(2)}€ al socio`;
    } else if (tipo === 'DIRECTA' && metodo === 'EFECTIVO') {
      mensaje = 'Venta registrada. Pendiente de aprobación en efectivo.';
    }

    return NextResponse.json({ 
      success: true, 
      ventaId: venta.id,
      cargoId,
      estado: estadoInicial,
      tipo,
      mensaje
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al registrar venta' }, { status: 500 });
  }
}
