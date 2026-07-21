import prisma from "@/lib/prisma";

export async function auditLog(userId: string, accion: string, detalles: string) {
  try {
    await prisma.log.create({
      data: { userId, accion, detalles },
    });
  } catch (error) {
    // Audit logging should never crash the main action
    console.error("Audit log failed:", error);
  }
}
