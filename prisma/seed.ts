import { PrismaClient, Role, UserStatus, MetodoPago, EstadoAbono } from "../app/generated/client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🚀 Iniciando Seeding Integral (Datos Reales + Lógica de Menores)...");

  // 1. ADMIN
  const password = "12345678";
  await prisma.user.upsert({
    where: { email: "admin@victorianos.com" },
    update: {},
    create: {
      id: "admin_root",
      username: "admin",
      name: "Administrador General",
      email: "admin@victorianos.com",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      accounts: { create: { id: "acc_admin_root", accountId: "admin_root", providerId: "credential", password, createdAt: new Date(), updatedAt: new Date() } }
    }
  });

  // 2. TEMPORADA
  const temporada = await prisma.temporada.create({
    data: { nombre: "2025/2026", fechaInicio: new Date("2025-09-01"), fechaFin: new Date("2026-06-30"), activa: true }
  });

  // 3. CATEGORÍAS
  const catsData = [
    { nombre: "Escuelita", costeFicha: 50, costeCuota: 100 },
    { nombre: "M16", costeFicha: 120, costeCuota: 150 },
    { nombre: "Senior Masculino", costeFicha: 180, costeCuota: 200 },
    { nombre: "Femenino", costeFicha: 120, costeCuota: 150 }
  ];

  const cats: any = {};
  for (const c of catsData) {
    cats[c.nombre] = await prisma.categoria.create({ data: c });
  }

  // 4. JUGADORES CON LÓGICA DE TUTORES
  const jugadoresData = [
    // ADULTOS
    { nombre: "Hugo", apellidos: "García Ramos", mote: "Huguito", dni: "11111111A", nac: "1995-05-20", cat: "Senior Masculino", tutor: null },
    { nombre: "Elena", apellidos: "Pérez Soler", mote: "Titán", dni: "22222222B", nac: "1998-02-15", cat: "Femenino", tutor: null },
    { nombre: "Adrián", apellidos: "Sanz Ibáñez", mote: "Sanz", dni: "33333333C", nac: "1992-11-30", cat: "Senior Masculino", tutor: null },
    { nombre: "Sofía", apellidos: "Marín Ocaña", mote: null, dni: "44444444D", nac: "1999-07-12", cat: "Femenino", tutor: null },
    
    // MENORES (Con datos de tutor obligatorios)
    { nombre: "Mateo", apellidos: "López Vega", mote: "Torito", dni: "55555555E", nac: "2010-03-25", cat: "M16", 
      tutor: { nombre: "Carlos López", dni: "99999991Q", tel: "677111222" } },
    { nombre: "Lucas", apellidos: "Gómez Ferro", mote: "Lukitas", dni: "66666666F", nac: "2011-08-14", cat: "M16", 
      tutor: { nombre: "Andrés Gómez", dni: "99999992W", tel: "677333444" } },
    { nombre: "Valentina", apellidos: "Cruz Daza", mote: "Vale", dni: "77777777G", nac: "2017-01-10", cat: "Escuelita", 
      tutor: { nombre: "Lucía Daza", dni: "99999993E", tel: "677555666" } },
    { nombre: "Diego", apellidos: "Torres Gil", mote: "Didi", dni: "88888888H", nac: "2018-05-04", cat: "Escuelita", 
      tutor: { nombre: "Marta Gil", dni: "99999994R", tel: "677777888" } },
    { nombre: "Iker", apellidos: "Jiménez Ruiz", mote: null, dni: "99999999I", nac: "2009-12-20", cat: "M16", 
      tutor: { nombre: "Pedro Jiménez", dni: "99999995T", tel: "677999000" } },
    { nombre: "Emma", apellidos: "Vázquez Rey", mote: "Flecha", dni: "10101010J", nac: "2016-11-02", cat: "Escuelita", 
      tutor: { nombre: "Sonia Rey", dni: "99999996Y", tel: "688111222" } },
  ];

  for (const j of jugadoresData) {
    const socio = await prisma.socio.create({
      data: {
        nombre: j.nombre,
        apellidos: j.apellidos,
        mote: j.mote,
        dni: j.dni,
        fechaNacimiento: new Date(j.nac),
        email: `${j.nombre.toLowerCase()}@ejemplo.com`,
        telefono: j.tutor ? null : "600111222", // Si es menor, solemos no tener su móvil personal
        direccion: "Calle del Rugby, 15",
        cuentaBancaria: "ES21 1234 5678 9012 3456 7890",
        categoriaId: cats[j.cat].id,
        tallaRopa: j.cat === "Escuelita" ? "Talla 10" : "L",
        rgpdFirmado: true,
        // Datos del Tutor
        nombreTutor: j.tutor?.nombre || null,
        dniTutor: j.tutor?.dni || null,
        telefonoTutor: j.tutor?.tel || null,
        observaciones: j.cat === "Escuelita" ? "Alergia leve al polen" : "Sin observaciones",
      }
    });

    // Crear Cargo inicial (Deuda)
    const cargo = await prisma.cargo.create({
      data: {
        monto: cats[j.cat].costeFicha,
        concepto: "Inscripción Anual y Ficha",
        socioId: socio.id,
        temporadaId: temporada.id,
      }
    });

    // Simular que los 4 primeros han pagado (Abono)
    if (jugadoresData.indexOf(j) < 4) {
      await prisma.abono.create({
        data: {
          monto: cats[j.cat].costeFicha,
          metodo: MetodoPago.TRANSFERENCIA,
          estado: EstadoAbono.APROBADO,
          socioId: socio.id,
          temporadaId: temporada.id,
          cargoId: cargo.id,
          aprobadoPorId: "admin_root"
        }
      });
    }
  }

  console.log("✅ Seed completado: 10 socios (4 adultos, 6 menores con tutores), categorías y cargos.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });