import { PrismaClient, Role, UserStatus } from "@/app/generated/client/client"
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ 
  connectionString: process.env.DATABASE_URL 
});
const prisma = new PrismaClient({adapter: adapter});

async function main() {
  console.log("🌱 Seeding database with Better Auth support...");

  // ------------------
  // USUARIOS INTERNOS (Actualizado para Better Auth)
  // ------------------
  // Usamos una contraseña simple para todos: 123456
  const password = "123456";

  await prisma.user.create({
    data: {
      id: "admin_id",
      username: "admin",
      name: "Admin",
      email: "admin@club.com", // Obligatorio para Better Auth
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      accounts: {
        create: {
          id: "acc_admin",
          accountId: "admin",
          providerId: "credential",
          password: password,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
}
  });

  await prisma.user.create({
    data: {
      id: "juan_id",
      username: "juan",
      name: "Juan",
      email: "juan@club.com",
      role: Role.CONTABILIDAD,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      accounts: {
        create: {
          id: "acc_juan",
          accountId: "juan",
          providerId: "credential",
          password: password,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    }
  });

  await prisma.user.create({
    data: {
      id: "nobita_id",
      username: "nobita",
      name: "Nobita",
      email: "nobita@club.com",
      role: Role.DIRECTIVA,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      accounts: {
        create: {
          id: "acc_nobita",
          accountId: "nobita",
          providerId: "credential",
          password: password,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    }
  });

  await prisma.user.create({
    data: {
      id: "rocio_id",
      username: "rocio",
      name: "Rocio",
      email: "rocio@club.com",
      role: Role.COLABORADOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      accounts: {
        create: {
          id: "acc_rocio",
          accountId: "rocio",
          providerId: "credential",
          password: password,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    }
  });

  // ------------------
  // TEMPORADA ACTIVA (Igual que tu original)
  // ------------------
  const temporada = await prisma.temporada.create({
    data: {
      nombre: "2024-2025",
      fechaInicio: new Date("2024-09-01"),
      fechaFin: new Date("2025-06-30"),
      activa: true,
    },
  });

  // ------------------
  // CATEGORÍAS (Igual que tu original)
  // ------------------
  const categoriasData = [
    { nombre: "M10", costeFicha: 50, costeCuota: 60 },
    { nombre: "M14", costeFicha: 120, costeCuota: 80 },
    { nombre: "M16", costeFicha: 150, costeCuota: 100 },
    { nombre: "M18", costeFicha: 150, costeCuota: 100 },
    { nombre: "Sub23", costeFicha: 220, costeCuota: 100 },
    { nombre: "Senior", costeFicha: 250, costeCuota: 100 },
    { nombre: "Femenino", costeFicha: 100, costeCuota: 100 },
  ];

  const categorias = await Promise.all(
    categoriasData.map((c) => prisma.categoria.create({ data: c }))
  );

  const categoriaMap = Object.fromEntries(categorias.map((c: any) => [c.nombre, c.id]));

  // ------------------
  // EQUIPOS (Igual que tu original)
  // ------------------
  const equipos = await Promise.all([
    prisma.equipo.create({ data: { nombre: "Senior", temporadaId: temporada.id, categoriaId: categoriaMap["Senior"] } }),
    prisma.equipo.create({ data: { nombre: "M16", temporadaId: temporada.id, categoriaId: categoriaMap["M16"] } }),
    prisma.equipo.create({ data: { nombre: "Femenino", temporadaId: temporada.id, categoriaId: categoriaMap["Femenino"] } }),
    prisma.equipo.create({ data: { nombre: "M10", temporadaId: temporada.id, categoriaId: categoriaMap["M10"] } }),
    prisma.equipo.create({ data: { nombre: "M14", temporadaId: temporada.id, categoriaId: categoriaMap["M14"] } }),
  ]);

  const equipoMap = Object.fromEntries(equipos.map((e: any) => [e.nombre, e.id]));

  // ------------------
  // SOCIOS (Igual que tu original)
  // ------------------
  let dniCounter = 10000000;
  for (const categoria of categorias) {
    for (let i = 1; i <= 3; i++) {
      const socio = await prisma.socio.create({
        data: {
          nombre: `Jugador${i}`,
          apellidos: categoria.nombre,
          dni: `${dniCounter++}X`,
          fechaNacimiento: new Date("2008-01-01"),
          telefono: "600000000",
          email: `jugador${i}.${categoria.nombre}@example.com`,
          direccion: "Calle Falsa 123",
        },
      });

      await prisma.inscripcion.create({
        data: {
          socioId: socio.id,
          temporadaId: temporada.id,
          equipoId: equipoMap[categoria.nombre] ?? equipoMap["Senior"],
        },
      });
    }
  }

  console.log("✅ Seed completado correctamente");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });