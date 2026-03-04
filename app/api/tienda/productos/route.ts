import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activoVenta = searchParams.get('activoVenta') === 'true';

    const productos = await prisma.producto.findMany({
      where: activoVenta ? { activoVenta: true } : undefined,
      include: {
        tallas: {
          orderBy: { talla: 'asc' }
        }
      },
      orderBy: [{ categoria: 'asc' }, { nombre: 'asc' }]
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, categoria, descripcion, precioVenta, precioCosto, activoVenta, activoPedido, tipo, tallas } = body;

    if (!nombre || !categoria || !precioVenta || !tallas || tallas.length === 0) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        categoria,
        descripcion: descripcion || null,
        precioVenta: parseFloat(precioVenta),
        precioCosto: precioCosto ? parseFloat(precioCosto) : null,
        activoVenta: activoVenta ?? true,
        activoPedido: activoPedido ?? true,
        tipo: tipo || 'ROPA',
        tallas: {
          create: tallas.map((t: any) => ({
            talla: t.talla,
            stock: t.stock || 0
          }))
        }
      }
    });

    return NextResponse.json({ success: true, producto });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}
