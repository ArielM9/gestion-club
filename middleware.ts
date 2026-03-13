import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// 1. Definimos el "Libro de Permisos"
// Esto es mucho más fácil de mantener que llenar el código de IFs
const ROLE_PERMISSIONS: Record<string, string[]> = {
    COLABORADOR: ["/dashboard", "/jugadores", "/contabilidad", "/eventos", "/documentos", "/equipos"],
    CONTABILIDAD: ["/dashboard", "/contabilidad", "/jugadores", "/eventos", "/documentos", "/tienda", "/equipos"],
    DIRECTIVA: ["/dashboard", "/contabilidad", "/jugadores", "/eventos", "/documentos", "/tienda", "/equipos"], // Acceso a todo excepto /admin
    ADMIN: ["/dashboard", "/contabilidad", "/jugadores", "/eventos", "/admin", "/documentos", "/tienda", "/equipos"], // Acceso total
};

// 2. Rutas que SIEMPRE son públicas (para evitar bucles infinitos)
const PUBLIC_ROUTES = ["/login", "/register", "/api/auth", "/api/storage/test"];

// 3. Rutas que requieren sesión pero están permitidas para todos los roles autenticados
const AUTHENTICATED_ROUTES = ["/api/documentos", "/api/socios", "/api/storage", "/api/tienda"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // A0. Bloquear registro si está habilitado
    const blockRegister = process.env.BLOCK_REGISTER === 'true';
    if (blockRegister && pathname === '/register') {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // A. Si es una ruta pública (y no bloqueada arriba), no hacemos nada, que pase.
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

    if (!session?.user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const userRole = session.user.role as string;
    const allowedRoutes = ROLE_PERMISSIONS[userRole] || [];

    // D. LA REGLA DE ORO: Si la ruta actual no empieza por ninguna de tus rutas permitidas... ¡FUERA!
    const isAllowed = allowedRoutes.some(route => pathname.startsWith(route));

    // D2. Si la ruta está en AUTHENTICATED_ROUTES, permitir si está autenticado (ya verificado en paso B)
    const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some(route => pathname.startsWith(route));

    // Permitimos la home "/" para todos los logueados, o redirigimos si no tiene permiso
    if (pathname !== "/" && !isAllowed && !isAuthenticatedRoute) {
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