// /api/demo/init — signs the demo admin in via Better Auth and redirects
// back to the page that requested the init. Used by the dashboard layout
// when IS_DEMO is on and no Better Auth session cookie is present.
//
// Flow:
//   1. Middleware lets demo traffic through without checks
//   2. Dashboard layout calls this endpoint (via redirect) to bootstrap
//   3. This route calls auth.api.signInEmail to create a real session
//   4. The Set-Cookie header is forwarded on the redirect response
//   5. The browser follows the redirect and now has a valid session

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, isDemoMode } from "@/lib/demo";

export async function GET(req: NextRequest) {
  // Defence in depth: only run when IS_DEMO is on
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo mode not enabled" }, { status: 404 });
  }

  const returnTo = req.nextUrl.searchParams.get("return") || "/";
  const safeReturn = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  try {
    const result = await auth.api.signInEmail({
      body: { email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD },
      asResponse: true,
      headers: req.headers,
    });

    // Forward every Set-Cookie header from the auth response onto our redirect
    const redirectResponse = NextResponse.redirect(new URL(safeReturn, req.url));
    const setCookies = result.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      for (const cookie of setCookies) {
        redirectResponse.headers.append("set-cookie", cookie);
      }
    } else {
      // Fallback for runtimes that don't expose getSetCookie
      const single = result.headers.get("set-cookie");
      if (single) redirectResponse.headers.set("set-cookie", single);
    }
    return redirectResponse;
  } catch (err) {
    console.error("[demo/init] sign-in failed:", err);
    return NextResponse.json(
      { error: "No se pudo iniciar la sesión demo. ¿Está ejecutado el seed?" },
      { status: 500 }
    );
  }
}
