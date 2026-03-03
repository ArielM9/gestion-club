import { PrismaClient } from "@/app/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Evitamos el error de tipos de 'global' en TS
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Configuramos el adaptador (Prisma 7.3 requiere este argumento)
const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL as string 
});

// Singleton: Si ya existe la instancia en global, la usamos; si no, creamos una nueva
const prisma = globalForPrisma.prisma || new PrismaClient({ 
  adapter 
});

// En desarrollo, guardamos la instancia en global para que el Hot Reload no abra conexiones nuevas
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;