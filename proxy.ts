import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// 1. Definimos el "Libro de Permisos"
// Esto es mucho más fácil de mantener que llenar el código de IFs
const ROLE_PERMISSIONS: Record<string, string[]> = {
    COLABORADOR: ["/dashboard", "/jugadores", "/contabilidad", "/eventos"],
    CONTABILIDAD: ["/dashboard", "/contabilidad", "/jugadores", "/eventos"],
    ADMIN: ["/dashboard", "/contabilidad", "/jugadores", "/eventos", "/admin"], // El admin llega a todo
};

// 2. Rutas que SIEMPRE son públicas (para evitar bucles infinitos)
const PUBLIC_ROUTES = ["/login", "/register", "/api/auth"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // A. Si es una ruta pública, no hacemos nada, que pase.
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }

    // B. Verificación de sesión
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // C. Obtener sesión para verificar el ROL
    const res = await fetch(`${request.nextUrl.origin}/api/auth/get-session`, {
        headers: { cookie: request.headers.get("cookie") || "" },
    });
    const session = await res.json();
    console.log(session);

    if (!session?.user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const userRole = session.user.role as string;
    const allowedRoutes = ROLE_PERMISSIONS[userRole] || [];

    // D. LA REGLA DE ORO: Si la ruta actual no empieza por ninguna de tus rutas permitidas... ¡FUERA!
    const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));

    // Permitimos la home "/" para todos los logueados, o redirigimos si no tiene permiso
    if (pathname !== "/" && !isAllowed) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

// Bloqueamos TODO por defecto, excepto archivos estáticos
export const config = {
    matcher: [
        /*
         * Coincide con todas las rutas excepto:
         * - _next/static (archivos estáticos)
         * - _next/image (optimización de imágenes)
         * - favicon.ico (icono del sitio)
         * - public (archivos en la carpeta public)
         */
        "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
    ],
};