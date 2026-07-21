import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Role = "ADMIN" | "CONTABILIDAD" | "DIRECTIVA" | "COLABORADOR";

export async function requireSession() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        throw new Error("UNAUTHENTICATED");
    }
    return session;
}

export async function requireRole(roles: Role[]) {
    const session = await requireSession();
    if (!roles.includes(session.user.role as Role)) {
        throw new Error("FORBIDDEN");
    }
    return session;
}
