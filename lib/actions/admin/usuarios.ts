"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { requireRole } from "@/lib/server/auth-guard";
import { auditLog } from "@/lib/server/audit-log";

export type Role = "ADMIN" | "CONTABILIDAD" | "DIRECTIVA" | "COLABORADOR";
export type UserStatus = "ACTIVE" | "PENDING" | "DISABLED";

export async function getUsuarios() {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  try {
    const usuarios = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Mapear para asegurar compatibilidad con el campo nuevo
    const usuariosFormateados = usuarios.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      username: u.username,
      role: u.role,
      status: u.status,
      mustChangePassword: (u as any).mustChangePassword ?? false,
      createdAt: u.createdAt,
    }));
    
    return { success: true, data: usuariosFormateados };
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return { error: "Error al obtener usuarios" };
  }
}

export async function getUsuarioById(id: string) {
  await requireRole(["ADMIN", "DIRECTIVA"]);
  try {
    const usuario = await prisma.user.findUnique({
      where: { id },
    });
    
    if (!usuario) {
      return { success: true, data: null };
    }
    
    const usuarioFormateado = {
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      username: usuario.username,
      role: usuario.role,
      status: usuario.status,
      mustChangePassword: (usuario as any).mustChangePassword ?? false,
      createdAt: usuario.createdAt,
    };
    
    return { success: true, data: usuarioFormateado };
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return { error: "Error al obtener usuario" };
  }
}

export async function crearUsuario(data: {
  name?: string;
  email: string;
  username?: string;
  role: Role;
}) {
  const session = await requireRole(["ADMIN"]);
  try {
    const tempPassword = randomBytes(4).toString("hex").toUpperCase();
    const passwordWithPrefix = `Temp${tempPassword}!`;

    const usuario = await prisma.user.create({
      data: {
        name: data.name || null,
        email: data.email,
        username: data.username || null,
        role: data.role,
        status: "ACTIVE",
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    revalidatePath("/admin/usuarios");
    await auditLog(session.user.id, "CREAR_USUARIO", `Creó usuario: ${data.email}`);
    return { 
      success: true, 
      data: usuario,
      tempPassword 
    };
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    if (error.code === "P2002") {
      return { error: "Ya existe un usuario con este email o username" };
    }
    return { error: "Error al crear usuario" };
  }
}

export async function actualizarUsuario(id: string, data: {
  email?: string;
  name?: string;
  username?: string;
  role?: Role;
  status?: UserStatus;
}) {
  const session = await requireRole(["ADMIN"]);
  try {
    await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.username !== undefined && { username: data.username }),
        ...(data.role && { role: data.role }),
        ...(data.status && { status: data.status }),
      },
    });

    revalidatePath("/admin/usuarios");
    await auditLog(session.user.id, "ACTUALIZAR_USUARIO", `Actualizó usuario: ${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return { error: "Error al actualizar usuario" };
  }
}

export async function resetPassword(id: string) {
  const session = await requireRole(["ADMIN"]);
  try {
    const tempPassword = randomBytes(4).toString("hex").toUpperCase();
    
    await prisma.user.update({
      where: { id },
      data: {
        mustChangePassword: true,
      },
    });

    revalidatePath("/admin/usuarios");
    await auditLog(session.user.id, "RESET_PASSWORD", `Reseteó password de: ${id}`);
    return { 
      success: true,
      tempPassword: `Temp${tempPassword}!`
    };
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    return { error: "Error al resetear contraseña" };
  }
}

export async function toggleUsuarioStatus(id: string) {
  const session = await requireRole(["ADMIN"]);
  try {
    const usuario = await prisma.user.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!usuario) {
      return { error: "Usuario no encontrado" };
    }

    const nuevoEstado = usuario.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

    await prisma.user.update({
      where: { id },
      data: { status: nuevoEstado },
    });

    revalidatePath("/admin/usuarios");
    await auditLog(session.user.id, "TOGGLE_USUARIO_STATUS", `Cambió status de: ${id}`);
    return { success: true, nuevoEstado };
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return { error: "Error al cambiar estado del usuario" };
  }
}
