import { PrismaClient, Role, UserStatus } from "../app/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando Seed Demo...");

  // Usuario ADMIN
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@demo.com" },
    update: {},
    create: {
      email: "admin@demo.com",
      name: "Admin Demo",
      username: "admin",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
      emailVerified: true
    }
  });
  console.log("✅ Usuario admin creado: admin@demo.com / demo123");

  console.log("\n📋 Instrucciones para la demo:");
  console.log("   1. Inicia sesión con: admin@demo.com / demo123");
  console.log("   2. Cambia la contraseña al iniciar");
  console.log("   3. Crea una temporada desde Configuración");
  console.log("   4. Añade categorías, jugadores, etc.");
  console.log("\n✨ Seed demo completado");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
