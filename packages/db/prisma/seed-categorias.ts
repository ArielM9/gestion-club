import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando seed de categorías...");

  const categoriasData = [
    { nombre: "M6" },
    { nombre: "M8" },
    { nombre: "M10" },
    { nombre: "M12" },
    { nombre: "M14" },
    { nombre: "M16" },
    { nombre: "M18" },
    { nombre: "M20" },
    { nombre: "M22" },
    { nombre: "Senior Masculino" },
    { nombre: "Senior Femenino" },
  ];

  let creadas = 0;
  let existentes = 0;

  for (const c of categoriasData) {
    const existe = await prisma.categoria.findUnique({
      where: { nombre: c.nombre },
    });

    if (!existe) {
      await prisma.categoria.create({
        data: { nombre: c.nombre },
      });
      console.log(`   ✅ Creada: ${c.nombre}`);
      creadas++;
    } else {
      console.log(`   ⏭️  Ya existe: ${c.nombre}`);
      existentes++;
    }
  }

  console.log(`\n✅ Seed completado: ${creadas} categorías creadas, ${existentes} ya existentes`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
