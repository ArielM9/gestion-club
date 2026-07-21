import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/lib/server/audit-log";

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
    const { abonoId, accion, motivo } = body;

    if (!abonoId || !accion) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    if (accion !== 'aprobar' && accion !== 'rechazar') {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    const abono = await prisma.abono.findUnique({
      where: { id: abonoId },
      include: { socio: { select: { id: true } } },
    });

    if (!abono) {
      return NextResponse.json({ error: 'Abono no encontrado' }, { status: 404 });
    }

    if (abono.estado !== 'PENDIENTE') {
      return NextResponse.json({ error: 'El abono ya ha sido procesado' }, { status: 400 });
    }

    const nuevoEstado = accion === 'aprobar' ? 'APROBADO' : 'RECHAZADO';

    await prisma.abono.update({
      where: { id: abonoId },
      data: {
        estado: nuevoEstado,
        aprobadoPorId: session.user.id,
        motivo: accion === 'rechazar' && motivo ? motivo : abono.motivo,
      },
    });

    await auditLog(session.user.id, "APROBAR_ABONO", `${accion} abono: ${abonoId}`);

    revalidatePath('/contabilidad');
    if (abono.socio?.id) {
      revalidatePath(`/jugadores/${abono.socio.id}`);
    }

    return NextResponse.json({
      success: true,
      estado: nuevoEstado,
      mensaje: accion === 'aprobar' ? 'Abono aprobado' : 'Abono rechazado',
    });
  } catch (error) {
    console.error('Error al aprobar/rechazar abono:', error);
    return NextResponse.json({ error: 'Error al procesar el abono' }, { status: 500 });
  }
}
