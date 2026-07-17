// scripts/seed-demo.ts
// Public demo seed — runs at container startup. Creates the demo admin user,
// two temporadas, ~45 socios across all categories, 5 equipos, 25 eventos,
// contabilidad records, documentos, tienda ventas, and uploads placeholder
// photos and PDFs to MinIO. Designed to be idempotent: safe to re-run against
// an existing demo database.

import { db as prisma, Role, UserStatus, MetodoPago, EstadoAbono, TipoEvento, TipoProducto, TipoVenta, EstadoVenta, TipoMovimiento, TipoDocumento, EstadoDocumento } from "@repo/db";
import { S3Client, PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";
import { deflateSync } from "zlib";
import { createHash, randomInt } from "crypto";
import bcrypt from "bcryptjs";

dotenv.config();

const DEMO_EMAIL = "admin@demo.local";
const DEMO_PASSWORD = "demo123456";

// ---------------------------------------------------------------------------
// 1. MinIO bootstrap
// ---------------------------------------------------------------------------

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || "club-files";

async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`✅ Bucket "${BUCKET}" ya existe`);
    return;
  } catch {
    // fall through to create
  }
  await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
  console.log(`✅ Bucket "${BUCKET}" creado`);
}

// ---------------------------------------------------------------------------
// 2. PNG generator (1x1 deterministic colored squares)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const lengthBuf = Buffer.alloc(4);
  lengthBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lengthBuf, typeBuf, data, crcBuf]);
}

function makePng1x1(r: number, g: number, b: number): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);
  ihdr.writeUInt32BE(1, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 2;   // color type RGB
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  const rawData = Buffer.from([0x00, r, g, b]); // filter byte + RGB
  const idat = deflateSync(rawData);
  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const PALETTE = [
  [59, 130, 246],   // blue
  [16, 185, 129],   // emerald
  [245, 158, 11],   // amber
  [239, 68, 68],    // red
  [139, 92, 246],   // violet
  [14, 165, 233],   // sky
  [236, 72, 153],   // pink
  [34, 197, 94],    // green
  [249, 115, 22],   // orange
  [99, 102, 241],   // indigo
];

function colorFor(seed: string): [number, number, number] {
  const hash = createHash("md5").update(seed).digest();
  const idx = hash[0] % PALETTE.length;
  return PALETTE[idx] as [number, number, number];
}

// ---------------------------------------------------------------------------
// 3. Minimal PDF generator (one-page, no compression)
// ---------------------------------------------------------------------------

function makePdf(text: string): Buffer {
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = `BT /F1 12 Tf 50 750 Td (${escape(text)}) Tj ET`;
  const objects: string[] = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  const header = "%PDF-1.4\n";
  let body = header;
  const offsets: number[] = [];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(body, "latin1"));
    body += obj;
  }
  const xrefOffset = Buffer.byteLength(body, "latin1");
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += String(off).padStart(10, "0") + " 00000 n \n";
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(body + xref + trailer, "latin1");
}

// ---------------------------------------------------------------------------
// 4. Static seed datasets
// ---------------------------------------------------------------------------

const APELLIDOS_M = ["García", "Rodríguez", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández", "Ruiz", "Díaz", "Moreno", "Romero", "Alonso", "Navarro", "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Serrano"];
const APELLIDOS_F = ["Pérez", "Gómez", "Martínez", "Rodríguez", "Sánchez", "López", "Fernández", "García", "Ruiz", "Díaz", "Moreno", "Romero", "Alonso", "Navarro", "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Serrano"];
const NOMBRES_M = ["Carlos", "Javier", "Miguel", "Alejandro", "David", "Pablo", "Jorge", "Daniel", "Adrián", "Hugo", "Mario", "Lucas", "Iván", "Sergio", "Andrés", "Roberto", "Diego", "Marcos", "Antonio", "Manuel"];
const NOMBRES_F = ["María", "Laura", "Carmen", "Ana", "Sara", "Patricia", "Andrea", "Inés", "Julia", "Lucía", "Sofía", "Emma", "Olivia", "Marta", "Elena", "Cristina", "Paula", "Nuria", "Isabel", "Rosa"];
const MOTES = ["Tigre", "Rayo", "Trueno", "Lince", "Águila", "Pantera", "León", "Lobo", "Halcón", "Zorro", "Tiburón", "Búfalo", "Bolt", "Flash", "Fénix", "Vikingo", "Samurai", "Cóndor", "Puma", "Titán"];

const CATEGORIAS = ["M6", "M8", "M10", "M12", "M14", "M16", "M18", "Senior Masculino", "Senior Femenino"] as const;
type Cat = (typeof CATEGORIAS)[number];

const EQUIPOS_DEMO: Array<{ nombre: string; cat: Cat; federado: boolean }> = [
  { nombre: "Senior M", cat: "Senior Masculino", federado: true },
  { nombre: "Senior F", cat: "Senior Femenino", federado: true },
  { nombre: "M16", cat: "M16", federado: true },
  { nombre: "M14", cat: "M14", federado: true },
  { nombre: "M10", cat: "M10", federado: false },
];

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length)];
}

function esMenor(cat: Cat): boolean {
  return !cat.startsWith("Senior");
}

function dniFalso(i: number): string {
  const num = String(10000000 + i).padStart(8, "0");
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  return num + letters[parseInt(num) % 23];
}

function emailFor(nombre: string, apellido: string): string {
  return `${nombre.toLowerCase()}.${apellido.toLowerCase().split(" ")[0]}@demo.local`.replace(/[^a-z0-9.@]/g, "");
}

const LOCALIDADES = ["Madrid", "Las Rozas", "Pozuelo", "Majadahonda", "Alcobendas", "Tres Cantos", "Boadilla", "Villanueva", "San Sebastián de los Reyes"];
const CALLES = ["Calle del Rugby", "Avenida del Estadio", "Plaza del Jugador", "Camino del Ensayo", "Calle del Melé"];

interface SocioDemo {
  idx: number;
  nombre: string;
  apellidos: string;
  sexo: "M" | "F";
  cat: Cat;
  fechaNacimiento: string;
  dni: string;
  tutor?: { nombre: string; dni: string; tel: string };
  pagoEstado: "PAGADO" | "PARCIAL" | "PENDIENTE";
  ropa: boolean;
  activo: boolean;
  archivado: boolean;
  perfilCompleto: boolean;
  conFoto: boolean;
  email: string;
  telefono: string;
  direccion: string;
  localidad: string;
  codigoPostal: string;
}

function generarSocios(total = 45): SocioDemo[] {
  const out: SocioDemo[] = [];
  const distribucion: Array<{ cat: Cat; n: number }> = [
    { cat: "M6", n: 3 },
    { cat: "M8", n: 4 },
    { cat: "M10", n: 5 },
    { cat: "M12", n: 5 },
    { cat: "M14", n: 6 },
    { cat: "M16", n: 5 },
    { cat: "M18", n: 4 },
    { cat: "Senior Masculino", n: 7 },
    { cat: "Senior Femenino", n: 6 },
  ];
  let idx = 1;
  for (const { cat, n } of distribucion) {
    for (let i = 0; i < n && out.length < total; i++) {
      const sexo: "M" | "F" = cat === "Senior Femenino" || (cat !== "Senior Masculino" && randomInt(0, 100) < 40) ? "F" : "M";
      const nombre = sexo === "M" ? pick(NOMBRES_M) : pick(NOMBRES_F);
      const apellido = sexo === "M" ? pick(APELLIDOS_M) : pick(APELLIDOS_F);
      const apellidos = `${apellido} ${pick(sexo === "M" ? APELLIDOS_M : APELLIDOS_F)}`;
      const menor = esMenor(cat);
      const year = 2025 - (cat.startsWith("Senior") ? randomInt(18, 35) : cat === "M6" ? 6 : cat === "M8" ? 8 : cat === "M10" ? 10 : cat === "M12" ? 12 : cat === "M14" ? 14 : cat === "M16" ? 16 : 18);
      const month = randomInt(1, 12);
      const day = randomInt(1, 28);
      const fechaNacimiento = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const pagoEstado: SocioDemo["pagoEstado"] = randomInt(0, 100) < 50 ? "PAGADO" : randomInt(0, 100) < 55 ? "PARCIAL" : "PENDIENTE";
      const archivado = !menor && randomInt(0, 100) < 15;
      const perfilCompleto = randomInt(0, 100) < 30;
      const conFoto = randomInt(0, 100) < 35;
      out.push({
        idx: idx++,
        nombre,
        apellidos,
        sexo,
        cat,
        fechaNacimiento,
        dni: dniFalso(idx),
        tutor: menor ? { nombre: `Tutor ${nombre}`, dni: dniFalso(idx + 5000), tel: `6${String(10000000 + randomInt(0, 9999999)).slice(0, 8)}` } : undefined,
        pagoEstado,
        ropa: pagoEstado === "PAGADO" && randomInt(0, 100) < 70,
        activo: !archivado,
        archivado,
        perfilCompleto,
        conFoto,
        email: emailFor(nombre, apellidos),
        telefono: menor ? `6${String(10000000 + randomInt(0, 9999999)).slice(0, 8)}` : `6${String(10000000 + randomInt(0, 9999999)).slice(0, 8)}`,
        direccion: `${pick(CALLES)}, ${randomInt(1, 100)}`,
        localidad: pick(LOCALIDADES),
        codigoPostal: `28${String(randomInt(100, 999))}`,
      });
    }
  }
  return out;
}

const SOCIOS = generarSocios(45);

const PRECIOS: Record<Cat, { cuota: number; ficha: number }> = {
  M6: { cuota: 80, ficha: 0 },
  M8: { cuota: 90, ficha: 0 },
  M10: { cuota: 100, ficha: 0 },
  M12: { cuota: 120, ficha: 25 },
  M14: { cuota: 140, ficha: 30 },
  M16: { cuota: 160, ficha: 35 },
  M18: { cuota: 180, ficha: 40 },
  "Senior Masculino": { cuota: 220, ficha: 50 },
  "Senior Femenino": { cuota: 200, ficha: 45 },
};

// ---------------------------------------------------------------------------
// 5. Demo admin user
// ---------------------------------------------------------------------------

async function ensureDemoAdmin() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date();
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { role: Role.ADMIN, status: UserStatus.ACTIVE, mustChangePassword: false, emailVerified: true },
    create: {
      email: DEMO_EMAIL,
      name: "Demo Admin",
      username: "demo",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      emailVerified: true,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          providerId: "credential",
          accountId: DEMO_EMAIL,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        },
      },
    },
  });
  // Ensure the credential account exists with a valid password even if the user pre-existed
  const existingAccount = await prisma.account.findFirst({
    where: { providerId: "credential", accountId: DEMO_EMAIL },
  });
  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: passwordHash, userId: user.id },
    });
  } else {
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        providerId: "credential",
        accountId: DEMO_EMAIL,
        password: passwordHash,
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
  console.log(`✅ Admin demo: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  return user;
}

// ---------------------------------------------------------------------------
// 6. Temporadas
// ---------------------------------------------------------------------------

async function ensureTemporadas() {
  const prev = await prisma.temporada.upsert({
    where: { id: "temp-2024-2025" },
    update: {},
    create: {
      id: "temp-2024-2025",
      nombre: "2024/2025",
      fechaInicio: new Date("2024-09-01"),
      fechaFin: new Date("2025-06-30"),
      activa: false,
      fechaCierre: new Date("2025-07-15"),
      balanceGenerado: true,
    },
  });
  const current = await prisma.temporada.upsert({
    where: { id: "temp-2025-2026" },
    update: {},
    create: {
      id: "temp-2025-2026",
      nombre: "2025/2026",
      fechaInicio: new Date("2025-09-01"),
      fechaFin: new Date("2026-06-30"),
      activa: true,
    },
  });
  console.log("✅ Temporadas: 2024/2025 (cerrada) y 2025/2026 (activa)");
  return { prev, current };
}

async function ensureCategorias(): Promise<Record<Cat, string>> {
  const out = {} as Record<Cat, string>;
  for (const c of CATEGORIAS) {
    const cat = await prisma.categoria.upsert({
      where: { nombre: c },
      update: {},
      create: { nombre: c },
    });
    out[c] = cat.id;
  }
  // Precios para la temporada activa
  for (const c of CATEGORIAS) {
    const p = PRECIOS[c];
    await prisma.temporadaCategoria.upsert({
      where: { temporadaId_categoriaId: { temporadaId: "temp-2025-2026", categoriaId: out[c] } },
      update: { costeCuota: p.cuota, costeFicha: p.ficha, incluyeRopa: !c.startsWith("Senior") },
      create: { temporadaId: "temp-2025-2026", categoriaId: out[c], costeCuota: p.cuota, costeFicha: p.ficha, incluyeRopa: !c.startsWith("Senior") },
    });
  }
  console.log(`✅ ${CATEGORIAS.length} categorías con precios`);
  return out;
}

// ---------------------------------------------------------------------------
// 7. Socios + Inscripciones + Cargos + Abonos
// ---------------------------------------------------------------------------

async function ensureSocios(categorias: Record<Cat, string>, currentId: string) {
  let creados = 0;
  let conFoto = 0;
  const created: Array<{ id: string; seed: SocioDemo }> = [];
  for (const s of SOCIOS) {
    const existing = await prisma.socio.findUnique({ where: { dni: s.dni } });
    if (existing) {
      created.push({ id: existing.id, seed: s });
      continue;
    }
    const socio = await prisma.socio.create({
      data: {
        nombre: s.nombre,
        apellidos: s.apellidos,
        mote: randomInt(0, 100) < 35 ? pick(MOTES) : null,
        dni: s.dni,
        sexo: s.sexo,
        fechaNacimiento: new Date(s.fechaNacimiento),
        email: s.perfilCompleto || randomInt(0, 100) < 80 ? s.email : null,
        telefono: s.perfilCompleto ? s.telefono : null,
        direccion: s.perfilCompleto ? s.direccion : null,
        codigoPostal: s.perfilCompleto ? s.codigoPostal : null,
        localidad: s.perfilCompleto ? s.localidad : null,
        nacionalidad: "Española",
        categoriaId: categorias[s.cat],
        nombreTutor: s.tutor?.nombre,
        dniTutor: s.tutor?.dni,
        telefonoTutor: s.tutor?.tel,
        tallaRopa: s.ropa ? (s.cat === "M6" || s.cat === "M8" ? "Talla 8" : s.cat === "M10" ? "Talla 10" : s.cat === "M12" || s.cat === "M14" ? "Talla 14" : "M") : null,
        rgpdFirmado: randomInt(0, 100) < 85,
        declaracionResponsable: randomInt(0, 100) < 70,
        exoneracionResponsabilidad: randomInt(0, 100) < 60,
        declaracionExtranjera: false,
        activo: s.activo,
        observaciones: s.archivado ? "Dado de baja por cambio de ciudad" : null,
        deudaPendiente: s.pagoEstado === "PAGADO" ? 0 : PRECIOS[s.cat].cuota * (s.pagoEstado === "PARCIAL" ? 0.4 : 1),
      },
    });
    creados++;
    if (s.conFoto) conFoto++;
    created.push({ id: socio.id, seed: s });
  }
  console.log(`✅ ${creados} socios nuevos (${created.length} totales, ${conFoto} con foto)`);

  // Inscripciones en la temporada activa
  for (const { id, seed } of created) {
    await prisma.inscripcion.upsert({
      where: { socioId_temporadaId: { socioId: id, temporadaId: currentId } },
      update: {},
      create: {
        socioId: id,
        temporadaId: currentId,
        categoriaId: categorias[seed.cat],
        federado: !EQUIPOS_DEMO.find((e) => e.cat === seed.cat && !e.federado),
      },
    });
  }
  return created;
}

// ---------------------------------------------------------------------------
// 8. Equipos
// ---------------------------------------------------------------------------

async function ensureEquipos(categorias: Record<Cat, string>, currentId: string) {
  const out: Record<string, string> = {};
  for (const eq of EQUIPOS_DEMO) {
    const equipo = await prisma.equipo.upsert({
      where: { nombre_temporadaId: { nombre: eq.nombre, temporadaId: currentId } },
      update: {},
      create: { nombre: eq.nombre, temporadaId: currentId, categoriaId: categorias[eq.cat], federado: eq.federado },
    });
    out[eq.nombre] = equipo.id;
  }
  console.log(`✅ ${EQUIPOS_DEMO.length} equipos`);
  return out;
}

// ---------------------------------------------------------------------------
// 9. Eventos
// ---------------------------------------------------------------------------

async function ensureEventos(equipos: Record<string, string>) {
  const eventos: Array<{ tipo: TipoEvento; fecha: Date; ubicacion: string; esLocal?: boolean; rival?: string; titulo?: string; detalles?: string; equipoId?: string }> = [];
  // 12 partidos
  const rivales = ["CR Cisneros", "Alcobendas", "Las Rozas", "Sanse Scrum", "Rugby Ávila", "CD Universidad", "Boadilla", "Toledo RC", "Guadalajara", "Getafe", "Móstoles", "San Patrick"];
  for (let i = 0; i < 12; i++) {
    const eq = i < 4 ? "Senior M" : i < 6 ? "Senior F" : i < 9 ? "M16" : "M14";
    const fecha = new Date(2025, 8 + Math.floor(i / 4), 7 + (i % 4) * 7, 16 - (i % 3), 0, 0);
    eventos.push({
      tipo: TipoEvento.PARTIDO,
      fecha,
      ubicacion: i % 2 === 0 ? "Campo Municipal" : "Campo Visitante",
      esLocal: i % 2 === 0,
      rival: rivales[i % rivales.length],
      equipoId: equipos[eq],
    });
  }
  // 4 torneos
  eventos.push({ tipo: TipoEvento.TORNEO, fecha: new Date(2025, 9, 18, 9, 0), ubicacion: "Alcobendas", titulo: "Torneo de Otoño M14", detalles: "Torneo de formación categorías M12-M14" });
  eventos.push({ tipo: TipoEvento.TORNEO, fecha: new Date(2025, 10, 23, 9, 0), ubicacion: "Campo Municipal", titulo: "Torneo de la Constitución", detalles: "Torneo infantil" });
  eventos.push({ tipo: TipoEvento.TORNEO, fecha: new Date(2026, 2, 14, 9, 30), ubicacion: "Las Rozas", titulo: "Festival Rugby Baby", detalles: "Festival M6-M10" });
  eventos.push({ tipo: TipoEvento.TORNEO, fecha: new Date(2026, 4, 9, 10, 0), ubicacion: "Madrid", titulo: "Torneo Fin de Temporada", detalles: "Torneo cierre de año" });
  // 4 reuniones
  eventos.push({ tipo: TipoEvento.REUNION, fecha: new Date(2025, 8, 5, 20, 0), ubicacion: "Sede Social", titulo: "Asamblea Ordinaria", detalles: "Aprobación de presupuesto y calendario" });
  eventos.push({ tipo: TipoEvento.REUNION, fecha: new Date(2025, 9, 15, 19, 30), ubicacion: "Sede Social", titulo: "Reunión Directiva", detalles: "Planificación trimestre" });
  eventos.push({ tipo: TipoEvento.REUNION, fecha: new Date(2025, 10, 10, 20, 0), ubicacion: "Sede Social", titulo: "Comité Entrenadores", detalles: "Coordinación entrenamientos" });
  eventos.push({ tipo: TipoEvento.REUNION, fecha: new Date(2026, 1, 5, 19, 0), ubicacion: "Sede Social", titulo: "Asamblea Extraordinaria", detalles: "Presupuesto anual" });
  // 3 sociales
  eventos.push({ tipo: TipoEvento.SOCIAL, fecha: new Date(2025, 8, 27, 21, 0), ubicacion: "Sede Social", titulo: "Fiesta de Inauguración", detalles: "Cena de hermandad" });
  eventos.push({ tipo: TipoEvento.SOCIAL, fecha: new Date(2025, 11, 15, 12, 0), ubicacion: "Sede Social", titulo: "Merienda Navideña", detalles: "Merienda con niños" });
  eventos.push({ tipo: TipoEvento.SOCIAL, fecha: new Date(2026, 5, 20, 22, 0), ubicacion: "Club Host", titulo: "Fiesta Fin de Temporada", detalles: "Entrega de trofeos" });
  // 2 otros
  eventos.push({ tipo: TipoEvento.OTRO, fecha: new Date(2025, 9, 31, 17, 0), ubicacion: "Campo Municipal", titulo: "Jornada de Puertas Abiertas", detalles: "Captación de nuevos jugadores" });
  eventos.push({ tipo: TipoEvento.OTRO, fecha: new Date(2026, 1, 15, 10, 0), ubicacion: "Instituto", titulo: "Charla Formativa", detalles: "Introducción al rugby en colegios" });

  let count = 0;
  for (const e of eventos) {
    await prisma.evento.create({ data: e });
    count++;
  }
  console.log(`✅ ${count} eventos creados`);
}

// ---------------------------------------------------------------------------
// 10. Contabilidad
// ---------------------------------------------------------------------------

async function ensureContabilidad(currentId: string) {
  // Ingresos externos
  const ingresos = [
    { monto: 1500, fuente: "Ayuntamiento", concepto: "Subvención deportiva 2025", fecha: new Date("2025-10-01") },
    { monto: 800, fuente: "Caja", concepto: "Venta de lotería", fecha: new Date("2025-11-15") },
    { monto: 500, fuente: "Patrocinador", concepto: "Patrocinio Bar Sporting", fecha: new Date("2025-09-15") },
    { monto: 1200, fuente: "Ayuntamiento", concepto: "Subvención mantenimiento", fecha: new Date("2025-12-01") },
    { monto: 350, fuente: "Socios", concepto: "Cuotas extraordinarias", fecha: new Date("2026-01-10") },
  ];
  for (const i of ingresos) {
    await prisma.ingresoExterno.create({ data: { ...i, temporadaId: currentId } });
  }
  // Gastos
  const gastos = [
    { monto: 450, concepto: "Árbitros partido 15/09", categoria: "Arbitrajes", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-16") },
    { monto: 380, concepto: "Árbitros partido 22/09", categoria: "Arbitrajes", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-23") },
    { monto: 220, concepto: "Balones entrenamiento", categoria: "Material", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-10") },
    { monto: 150, concepto: "Conos y testigos", categoria: "Material", metodo: MetodoPago.EFECTIVO, fecha: new Date("2025-09-12") },
    { monto: 600, concepto: "Alquiler campo septiembre", categoria: "Instalaciones", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-30") },
    { monto: 600, concepto: "Alquiler campo octubre", categoria: "Instalaciones", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-31") },
    { monto: 180, concepto: "Cuota federación jugadores", categoria: "Federación", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-05") },
    { monto: 320, concepto: "Servicios médicos", categoria: "Sanidad", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-20") },
    { monto: 95, concepto: "Botiquín y vendas", categoria: "Sanidad", metodo: MetodoPago.EFECTIVO, fecha: new Date("2025-09-08") },
    { monto: 450, concepto: "Transporte equipo M16", categoria: "Transporte", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-19") },
    { monto: 280, concepto: "Camisetas entrenamiento", categoria: "Ropa", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-11-01") },
    { monto: 550, concepto: "Seguro responsabilidad civil", categoria: "Seguros", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-01") },
    { monto: 150, concepto: "Limpieza sede", categoria: "Mantenimiento", metodo: MetodoPago.EFECTIVO, fecha: new Date("2025-09-30") },
    { monto: 85, concepto: "Luz sede", categoria: "Mantenimiento", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-15") },
    { monto: 120, concepto: "Agua sede", categoria: "Mantenimiento", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-20") },
  ];
  for (const g of gastos) {
    await prisma.gasto.create({ data: { ...g, temporadaId: currentId } });
  }
  console.log(`✅ Contabilidad: ${ingresos.length} ingresos, ${gastos.length} gastos`);
}

async function ensureCargosYAbonos(currentId: string, adminId: string, created: Array<{ id: string; seed: SocioDemo }>) {
  let abonos = 0;
  let cargos = 0;
  for (const { id, seed } of created) {
    const p = PRECIOS[seed.cat];
    const total = p.cuota + p.ficha;
    const cargo = await prisma.cargo.create({
      data: { monto: total, concepto: `Inscripción ${seed.cat}`, socioId: id, temporadaId: currentId },
    });
    cargos++;
    if (seed.pagoEstado === "PAGADO") {
      await prisma.abono.create({
        data: {
          monto: total,
          metodo: MetodoPago.TRANSFERENCIA,
          estado: EstadoAbono.APROBADO,
          motivo: "Pago completo",
          socioId: id,
          temporadaId: currentId,
          cargoId: cargo.id,
          aprobadoPorId: adminId,
        },
      });
      abonos++;
    } else if (seed.pagoEstado === "PARCIAL") {
      const parcial = Math.round(total * 0.6 * 100) / 100;
      await prisma.abono.create({
        data: {
          monto: parcial,
          metodo: MetodoPago.EFECTIVO,
          estado: randomInt(0, 100) < 60 ? EstadoAbono.APROBADO : EstadoAbono.PENDIENTE,
          motivo: "Pago parcial",
          socioId: id,
          temporadaId: currentId,
          cargoId: cargo.id,
          aprobadoPorId: adminId,
        },
      });
      abonos++;
    }
  }
  console.log(`✅ Cargos: ${cargos}, Abonos: ${abonos}`);
}

// ---------------------------------------------------------------------------
// 11. Documentos (con upload a MinIO)
// ---------------------------------------------------------------------------

async function uploadPdfToMinio(key: string, title: string): Promise<void> {
  const buffer = makePdf(`Demo: ${title} — Victorianos Gestión`);
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buffer, ContentType: "application/pdf" }));
}

async function ensureDocumentos(currentId: string, created: Array<{ id: string; seed: SocioDemo }>) {
  const tipos: TipoDocumento[] = [TipoDocumento.DNI, TipoDocumento.DR, TipoDocumento.DJ, TipoDocumento.ER, TipoDocumento.AI, TipoDocumento.COMPROBANTE_PAGO];
  const estados: EstadoDocumento[] = [EstadoDocumento.VALIDADO, EstadoDocumento.PENDIENTE, EstadoDocumento.RECHAZADO, EstadoDocumento.ORFANO];
  const targets = created.filter((c) => randomInt(0, 100) < 50).slice(0, 20);
  let count = 0;
  for (const { id, seed } of targets) {
    const tipo = pick(tipos);
    const estado = randomInt(0, 100) < 50 ? EstadoDocumento.VALIDADO : randomInt(0, 100) < 60 ? EstadoDocumento.PENDIENTE : randomInt(0, 100) < 70 ? EstadoDocumento.RECHAZADO : EstadoDocumento.ORFANO;
    const ext = tipo === TipoDocumento.DNI ? "pdf" : "pdf";
    const filename = `${tipo.toLowerCase()}_${seed.dni}.${ext}`;
    const storagePath = `documentos/${currentId}/${id}/${filename}`;
    try {
      await uploadPdfToMinio(storagePath, `${tipo} - ${seed.nombre}`);
    } catch (err) {
      console.warn(`  ⚠️  No se pudo subir ${storagePath}: ${(err as Error).message}`);
      continue;
    }
    await prisma.documento.create({
      data: {
        tipo,
        filename,
        storagePath,
        socioId: id,
        temporadaId: currentId,
        estado,
        concepto: tipo === TipoDocumento.COMPROBANTE_PAGO ? "Pago cuota" : null,
      },
    });
    count++;
  }
  console.log(`✅ ${count} documentos subidos a MinIO`);
}

// ---------------------------------------------------------------------------
// 12. Fotos de jugadores (upload a MinIO)
// ---------------------------------------------------------------------------

async function ensureFotos(created: Array<{ id: string; seed: SocioDemo }>) {
  const targets = created.filter((c) => c.seed.conFoto).slice(0, 15);
  let count = 0;
  for (const { id, seed } of targets) {
    const [r, g, b] = colorFor(`${seed.nombre}${seed.apellidos}`);
    const buf = makePng1x1(r, g, b);
    const key = `fotos/${id}.png`;
    try {
      await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: "image/png" }));
      await prisma.socio.update({ where: { id }, data: { fotoUrl: key } });
      count++;
    } catch (err) {
      console.warn(`  ⚠️  No se pudo subir foto ${key}: ${(err as Error).message}`);
    }
  }
  console.log(`✅ ${count} fotos subidas a MinIO`);
}

// ---------------------------------------------------------------------------
// 13. Tienda: productos, ventas, stock
// ---------------------------------------------------------------------------

async function ensureTienda(currentId: string, adminId: string, created: Array<{ id: string; seed: SocioDemo }>) {
  const productosData = [
    { nombre: "Camiseta entrenamiento", categoria: "Camisetas", precioVenta: 18, precioCosto: 10, tipo: TipoProducto.ROPA },
    { nombre: "Camiseta partido", categoria: "Camisetas", precioVenta: 25, precioCosto: 15, tipo: TipoProducto.ROPA },
    { nombre: "Sudadera con capucha", categoria: "Sudaderas", precioVenta: 35, precioCosto: 20, tipo: TipoProducto.ROPA },
    { nombre: "Chubasquero", categoria: "Chubasqueros", precioVenta: 40, precioCosto: 22, tipo: TipoProducto.ROPA },
    { nombre: "Pantalón entrenamiento", categoria: "Pantalones", precioVenta: 22, precioCosto: 12, tipo: TipoProducto.ROPA },
    { nombre: "Calcetines rugby", categoria: "Calcetines", precioVenta: 8, precioCosto: 4, tipo: TipoProducto.ROPA },
    { nombre: "Gorra club", categoria: "Complementos", precioVenta: 12, precioCosto: 6, tipo: TipoProducto.COMPLEMENTO },
    { nombre: "Llavero", categoria: "Complementos", precioVenta: 5, precioCosto: 2, tipo: TipoProducto.COMPLEMENTO },
  ];
  const tallasRopa = ["Talla 6", "Talla 8", "Talla 10", "Talla 12", "XS", "S", "M", "L", "XL"];
  const tallasUnica = ["Única"];

  const productos: Array<{ id: string; precioVenta: number; tallas: string[] }> = [];
  for (const p of productosData) {
    let prod = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
    if (!prod) {
      prod = await prisma.producto.create({ data: p });
      const tallas = p.categoria === "Llaveros" || p.categoria === "Gorra club" ? tallasUnica : tallasRopa;
      for (const talla of tallas) {
        await prisma.productoTalla.create({
          data: { productoId: prod.id, talla, stock: randomInt(5, 35) },
        });
      }
    }
    const tallas = p.categoria === "Llaveros" || p.categoria === "Gorra club" ? tallasUnica : tallasRopa;
    productos.push({ id: prod.id, precioVenta: prod.precioVenta, tallas });
  }
  console.log(`✅ ${productos.length} productos en tienda`);

  // 8 ventas
  const tipos: TipoVenta[] = [TipoVenta.DIRECTA, TipoVenta.ENTREGADA, TipoVenta.PLAZOS, TipoVenta.FIADO];
  for (let i = 0; i < 8; i++) {
    const socio = created[randomInt(0, created.length)];
    const prod = productos[randomInt(0, productos.length)];
    const talla = prod.tallas[randomInt(0, prod.tallas.length)];
    const cantidad = randomInt(1, 3);
    const total = prod.precioVenta * cantidad;
    const tipo = tipos[i % tipos.length];
    const estado: EstadoVenta = tipo === TipoVenta.ENTREGADA ? EstadoVenta.COMPLETADA : randomInt(0, 100) < 70 ? EstadoVenta.APROBADA : EstadoVenta.PENDIENTE;
    const venta = await prisma.venta.create({
      data: {
        socioId: socio.id,
        tipo,
        estado,
        metodo: tipo === TipoVenta.FIADO ? null : pick([MetodoPago.EFECTIVO, MetodoPago.TRANSFERENCIA, MetodoPago.TARJETA]),
        total,
        temporadaId: currentId,
        aprobadoPorId: adminId,
        productos: { create: [{ productoId: prod.id, talla, cantidad, precioUnitario: prod.precioVenta }] },
      },
    });
    // Movimientos de stock
    await prisma.movimientoStock.create({
      data: { productoId: prod.id, talla, cantidad, tipo: tipo === TipoVenta.ENTREGADA ? TipoMovimiento.ENTREGA : TipoMovimiento.VENTA, ventaId: venta.id, temporadaId: currentId },
    });
  }
  console.log(`✅ 8 ventas y movimientos de stock`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🚀 Seed Demo — Victorianos Gestión\n");

  await ensureBucket();
  const admin = await ensureDemoAdmin();
  const temporadas = await ensureTemporadas();
  const categorias = await ensureCategorias();
  const created = await ensureSocios(categorias, temporadas.current.id);
  await ensureCargosYAbonos(temporadas.current.id, admin.id, created);
  const equipos = await ensureEquipos(categorias, temporadas.current.id);
  await ensureEventos(equipos);
  await ensureContabilidad(temporadas.current.id);
  await ensureTienda(temporadas.current.id, admin.id, created);
  await ensureFotos(created);
  await ensureDocumentos(temporadas.current.id, created);

  console.log("\n✨ Seed demo completado");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
