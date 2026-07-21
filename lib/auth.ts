import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
// If your Prisma file is located elsewhere, you can change the path
import prisma from "./prisma";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql", // or "mysql", "postgresql", ...etc
    }),
    emailAndPassword: {
        enabled: true,
        // Minimum password length enforced on sign-up and password change.
        // 10 chars is the OWASP-recommended floor for human-memorable passwords.
        minPasswordLength: 10,
    },

    // Rate limiting is configured at the top level in Better Auth.
    // The default is 100 requests / 10s window; we tighten sign-in/email to
    // 5 attempts / 60s to slow down credential-stuffing and brute-force attacks.
    rateLimit: {
        enabled: true,
        window: 10,
        max: 100,
        customRules: {
            "/sign-in/email": {
                window: 60,
                max: 5,
            },
        },
    },

    // Reject sign-in for users whose status is PENDING. PENDING users are
    // created by the registration flow and must be approved by an admin
    // (set to ACTIVE) before they can authenticate.
    hooks: {
        before: createAuthMiddleware(async (ctx) => {
            if (ctx.path === "/sign-in/email") {
                const body = ctx.body as { email?: string } | undefined;
                const email = body?.email;
                if (email) {
                    const user = await prisma.user.findUnique({
                        where: { email },
                        select: { status: true },
                    });
                    if (user?.status === "PENDING") {
                        throw new APIError("FORBIDDEN", {
                            message: "Tu cuenta está pendiente de aprobación por un administrador.",
                        });
                    }
                }
            }
        }),
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "COLABORADOR", // Rol por defecto para nuevos registros
            },
        },
    },
});
