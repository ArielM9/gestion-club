// Demo mode detection — server + client safe singleton flag.
//
// `NEXT_PUBLIC_IS_DEMO` is read at build time and inlined into the client bundle.
// We intentionally expose both:
//   - `isDemoMode()`: function form, safe to call from anywhere
//   - `IS_DEMO`: boolean constant for fast checks
//
// The dashboard layout and middleware gate auth on this flag. Production deploys
// leave the env var unset, so the constant is `false` everywhere.

export const IS_DEMO = process.env.NEXT_PUBLIC_IS_DEMO === "true";

export function isDemoMode(): boolean {
  return IS_DEMO || process.env.IS_DEMO === "true";
}

// Demo admin credentials — only meaningful when IS_DEMO is true.
// The seed script creates this user with a known password so the middleware
// can sign them in automatically without going through /login.
//
// The password is sourced from DEMO_ADMIN_PASSWORD so it never ships in the
// repository. A warning is logged at boot if the variable is missing so the
// misconfiguration is visible during development.
export const DEMO_ADMIN_EMAIL = "admin@demo.local";
export const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD;

if (!DEMO_ADMIN_PASSWORD) {
  console.warn(
    "⚠️ DEMO_ADMIN_PASSWORD not set. Demo mode may not work correctly."
  );
}
