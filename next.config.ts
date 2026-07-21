import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",
  transpilePackages: ['@repo/db'],
  serverExternalPackages: [
    '@prisma/client',
    'prisma',
    '@prisma/adapter-pg',
    'pg',
  ],
  // Security headers applied to every response.
  // CSP is intentionally omitted for now — it requires per-route tuning and
  // can easily break inline scripts during the hardening phase. Add it
  // incrementally once we have a clear inventory of inline scripts/styles.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
