import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone",
  transpilePackages: ['@repo/db'],
  serverExternalPackages: [
    '@prisma/client', 
    'prisma', 
    '@prisma/adapter-pg', 
    'pg'
  ],
};

export default nextConfig;
