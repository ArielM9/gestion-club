import { db as prisma, Role, UserStatus, MetodoPago, EstadoAbono, TipoEvento, TipoProducto } from "@repo/db";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🚀 Iniciando Seeding Completo...");

  // 1. USUARIO ADMIN (crear primero para tener el ID disponible)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@victorianos.es" },
    update: {},
    create: {
      email: "admin@victorianos.es",
      name: "Administrador",
      username: "admin",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false,
      emailVerified: true
    }
  });
  console.log("✅ Usuario admin creado:", adminUser.email);

  // Crear usuarios adicionales para variedad
  const users = [adminUser];
  const extraUsers = [
    { email: "contabilidad@victorianos.es", name: "Juan Contable", username: "jconta", role: Role.CONTABILIDAD },
    { email: "directiva@victorianos.es", name: "María Directiva", username: "mdirectiva", role: Role.DIRECTIVA },
    { email: "colaborador@victorianos.es", name: "Pedro Colaborador", username: "pcolab", role: Role.COLABORADOR },
  ];
  for (const u of extraUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, status: UserStatus.ACTIVE, mustChangePassword: false, emailVerified: true }
    });
    users.push(user);
  }
  console.log("✅ Usuarios adicionales creados");

  // 2. TEMPORADA ACTIVA
  const temporada = await prisma.temporada.upsert({
    where: { id: "temp-2025-2026" },
    update: {},
    create: {
      id: "temp-2025-2026",
      nombre: "2025/2026",
      fechaInicio: new Date("2025-09-01"),
      fechaFin: new Date("2026-06-30"),
      activa: true
    }
  });

  // 3. CATEGORÍAS (todas las categorías de rugby)
  const categoriasData = [
    { nombre: "M6" },
    { nombre: "M8" },
    { nombre: "M10" },
    { nombre: "M12" },
    { nombre: "M14" },
    { nombre: "M16" },
    { nombre: "M18" },
    { nombre: "Senior Masculino" },
    { nombre: "Senior Femenino" },
  ];

  const categorias: Record<string, any> = {};
  for (const c of categoriasData) {
    const cat = await prisma.categoria.upsert({
      where: { nombre: c.nombre },
      update: {},
      create: { nombre: c.nombre }
    });
    categorias[c.nombre] = cat;
  }
  console.log("✅ Categorías creadas:", Object.keys(categorias).join(", "));

  // 4. JUGADORES - 30 casos realistas
  const jugadoresData: Array<{
    nombre: string;
    apellidos: string;
    mote: string | null;
    dni: string;
    nac: string;
    cat: string;
    sexo: string;
    pagado: boolean;
    ropa: boolean;
    docs: string[];
    tutor?: { nombre: string; dni: string; tel: string };
    notas?: string;
  }> = [
    // === ADULTOS (18+) ===
    { nombre: "Carlos", apellidos: "García López", mote: "Carlangas", dni: "11111111A", nac: "1995-05-20", cat: "Senior Masculino", sexo: "M", pagado: true, ropa: true, docs: ["DNI", "DR"] },
    { nombre: "María", apellidos: "Pérez Sánchez", mote: "Mariví", dni: "22222222B", nac: "1998-02-15", cat: "Senior Femenino", sexo: "F", pagado: true, ropa: true, docs: ["DNI"] },
    { nombre: "Javier", apellidos: "Rodríguez Torres", mote: "Javi", dni: "33333333C", nac: "1992-11-30", cat: "Senior Masculino", sexo: "M", pagado: true, ropa: false, docs: ["DNI", "DR"] },
    { nombre: "Laura", apellidos: "Martínez Gil", mote: null, dni: "44444444D", nac: "1999-07-12", cat: "Senior Femenino", sexo: "F", pagado: false, ropa: false, docs: ["DNI"] },
    { nombre: "Antonio", apellidos: "Fernández Ruiz", mote: "Tonino", dni: "55555555E", nac: "1988-03-25", cat: "Senior Masculino", sexo: "M", pagado: false, ropa: false, docs: ["DNI"] },
    { nombre: "Patricia", apellidos: "Gómez Castro", mote: "Patri", dni: "66666666F", nac: "1996-09-08", cat: "Senior Femenino", sexo: "F", pagado: true, ropa: true, docs: ["DNI", "DR", "AI"] },
    
    // === M18 ===
    { nombre: "Miguel", apellidos: "Hernández Vega", mote: "Migue", dni: "77777777G", nac: "2007-04-15", cat: "M18", sexo: "M", pagado: true, ropa: true, docs: ["DNI", "DR"] },
    { nombre: "Andrea", apellidos: "López Serrano", mote: "Andy", dni: "88888888H", nac: "2007-08-22", cat: "M18", sexo: "F", pagado: true, ropa: false, docs: ["DNI"] },
    
    // === M16 ===
    { nombre: "Alejandro", apellidos: "Díaz Morales", mote: "Alex", dni: "99999999I", nac: "2009-01-10", cat: "M16", sexo: "M", pagado: true, ropa: true, docs: ["DNI", "DR"], tutor: { nombre: "Juan Díaz", dni: "11111112A", tel: "600111222" } },
    { nombre: "Carmen", apellidos: "Ramírez Ortega", mote: "Car", dni: "10101010J", nac: "2009-05-18", cat: "M16", sexo: "F", pagado: false, ropa: false, docs: ["DNI"], tutor: { nombre: "Rosa Ortega", dni: "11111113B", tel: "600222333" } },
    { nombre: "David", apellidos: "Cortés Vargas", mote: "Davids", dni: "20202020K", nac: "2010-02-14", cat: "M16", sexo: "M", pagado: true, ropa: true, docs: ["DNI"], tutor: { nombre: "Miguel Cortés", dni: "11111114C", tel: "600333444" } },
    { nombre: "Sara", apellidos: "Navarro Fuentes", mote: null, dni: "30303030L", nac: "2010-11-30", cat: "M16", sexo: "F", pagado: true, ropa: true, docs: ["DNI", "DR"], tutor: { nombre: "Carmen Fuentes", dni: "11111115D", tel: "600444555" } },
    
    // === M14 ===
    { nombre: "Pablo", apellidos: "Serrano Reyes", mote: "Pablito", dni: "40404040M", nac: "2011-06-05", cat: "M14", sexo: "M", pagado: true, ropa: true, docs: ["DNI"], tutor: { nombre: "Pedro Serrano", dni: "11111116E", tel: "600555666" } },
    { nombre: "Inés", apellidos: "Garrido Molina", mote: "Ines", dni: "50505050N", nac: "2012-03-12", cat: "M14", sexo: "F", pagado: false, ropa: false, docs: [], tutor: { nombre: "Marta Molina", dni: "11111117F", tel: "600666777" } },
    { nombre: "Jorge", apellidos: "Herrera León", mote: "Jorgito", dni: "60606060O", nac: "2011-09-28", cat: "M14", sexo: "M", pagado: true, ropa: false, docs: ["DNI", "DR"], tutor: { nombre: "Luis Herrera", dni: "11111118G", tel: "600777888" } },
    
    // === M12 ===
    { nombre: "Marcos", apellidos: "Campos Díaz", mote: "Marquitos", dni: "70707070P", nac: "2013-07-15", cat: "M12", sexo: "M", pagado: true, ropa: true, docs: ["DNI"], tutor: { nombre: "Antonio Campos", dni: "11111119H", tel: "600888999" } },
    { nombre: "Julia", apellidos: "Aguilar Soto", mote: "Juli", dni: "80808080Q", nac: "2014-02-08", cat: "M12", sexo: "F", pagado: true, ropa: true, docs: ["DNI", "DR"], tutor: { nombre: "Ana Soto", dni: "11111120J", tel: "600999000" } },
    { nombre: "Hugo", apellidos: "Reyes Wass", mote: null, dni: "90909090R", nac: "2013-12-01", cat: "M12", sexo: "M", pagado: false, ropa: false, docs: [], tutor: { nombre: "Carlos Reyes", dni: "11111121K", tel: "611000111" } },
    
    // === M10 ===
    { nombre: "Daniel", apellidos: "Vega Santiago", mote: "Dani", dni: "11111111S", nac: "2015-04-20", cat: "M10", sexo: "M", pagado: true, ropa: true, docs: ["DNI"], tutor: { nombre: "Diego Vega", dni: "11111122L", tel: "611111222" } },
    { nombre: "Emma", apellidos: "Ruiz Ballesteros", mote: "Emi", dni: "22222222T", nac: "2016-01-15", cat: "M10", sexo: "F", pagado: true, ropa: true, docs: ["DNI", "DR"], tutor: { nombre: "Elena Ballesteros", dni: "11111123M", tel: "611222333" } },
    { nombre: "Mario", apellidos: "Santos Peña", mote: "Mari", dni: "33333333U", nac: "2015-08-30", cat: "M10", sexo: "M", pagado: false, ropa: false, docs: [], tutor: { nombre: "Mario Santos", dni: "11111124N", tel: "611333444" } },
    
    // === M8 ===
    { nombre: "Lucía", apellidos: "Giménez Campos", mote: "Luc", dni: "44444444V", nac: "2017-05-10", cat: "M8", sexo: "F", pagado: true, ropa: true, docs: ["DNI"], tutor: { nombre: "Rosa Campos", dni: "11111125O", tel: "611444555" } },
    { nombre: "Leo", apellidos: "Morales Requena", mote: "Leon", dni: "55555555W", nac: "2018-03-22", cat: "M8", sexo: "M", pagado: true, ropa: true, docs: ["DNI"], tutor: { nombre: "Javier Morales", dni: "11111126P", tel: "611555666" } },
    { nombre: "Sofía", apellidos: "Torres Blanchard", mote: "Sofi", dni: "66666666X", nac: "2017-11-05", cat: "M8", sexo: "F", pagado: false, ropa: false, docs: [], tutor: { nombre: "María Blanchard", dni: "11111127Q", tel: "611666777" } },
    
    // === M6 ===
    { nombre: "Olivia", apellidos: "Montesinos Vidal", mote: "Oli", dni: "77777777Y", nac: "2019-06-18", cat: "M6", sexo: "F", pagado: true, ropa: true, docs: ["DNI"], tutor: { nombre: "Pedro Vidal", dni: "11111128R", tel: "611777888" } },
    { nombre: "Thiago", apellidos: "Arias García", mote: "Titi", dni: "88888888Z", nac: "2020-02-14", cat: "M6", sexo: "M", pagado: true, ropa: false, docs: [], tutor: { nombre: "Luis Arias", dni: "11111129S", tel: "611888999" } },
    { nombre: "Valentina", apellidos: "Córdoba Castillo", mote: "Valen", dni: "99999999A", nac: "2019-09-25", cat: "M6", sexo: "F", pagado: false, ropa: false, docs: [], tutor: { nombre: "Juan Córdoba", dni: "11111130T", tel: "611999000" } },

    // === CASOS ESPECIALES ===
    { nombre: "Roberto", apellidos: "Alvarez Muñoz", mote: "Rob", dni: "12121212B", nac: "1990-12-01", cat: "Senior Masculino", sexo: "M", pagado: true, ropa: false, docs: [], notas: "Pendiente enviar DNI" },
    { nombre: "Gonzalo", apellidos: "Sáenz Pardo", mote: "Gon", dni: "23232323C", nac: "2011-04-08", cat: "M14", sexo: "M", pagado: true, ropa: true, docs: ["DNI", "DR", "DJ", "AI", "ER"], tutor: { nombre: "Carlos Sáenz", dni: "11111131U", tel: "612000111" } },
  ];

  // Crear jugadores (usar upsert para que sea idempotente)
  for (const j of jugadoresData) {
    const nombreApellidos = j.nombre + " " + j.apellidos;
    const socio = await prisma.socio.upsert({
      where: { dni: j.dni },
      update: {},
      create: {
        nombre: j.nombre,
        apellidos: j.apellidos,
        mote: j.mote,
        dni: j.dni,
        sexo: j.sexo,
        fechaNacimiento: new Date(j.nac),
        email: `${j.nombre.toLowerCase()}.${j.apellidos.split(" ")[0].toLowerCase()}@ejemplo.com`,
        telefono: j.tutor ? null : "600123456",
        direccion: "Calle del Rugby, 1",
        cuentaBancaria: "ES21 1234 5678 9012 3456 7890",
        categoriaId: categorias[j.cat].id,
        tallaRopa: j.ropa ? (j.cat === "M6" || j.cat === "M8" ? "Talla 6" : j.cat === "M10" ? "Talla 10" : "M") : null,
        rgpdFirmado: true,
        nombreTutor: j.tutor?.nombre || null,
        dniTutor: j.tutor?.dni || null,
        telefonoTutor: j.tutor?.tel || null,
        observaciones: j.notas || null,
        activo: true
      }
    });

    // Crear Cargo (deuda)
    const catData = categorias[j.cat];
    const costeTotal = (catData["coste Ficha"] || 0) + (catData.costeCuota || 0);
    const cargo = await prisma.cargo.create({
      data: {
        monto: costeTotal,
        concepto: "Inscripción y Ficha " + j.cat,
        socioId: socio.id,
        temporadaId: temporada.id
      }
    });

    // Si está pagado, crear Abono
    if (j.pagado) {
      await prisma.abono.create({
        data: {
          monto: costeTotal,
          metodo: MetodoPago.TRANSFERENCIA,
          estado: EstadoAbono.APROBADO,
          motivo: "Pago completo temporada",
          socioId: socio.id,
          temporadaId: temporada.id,
          cargoId: cargo.id,
          aprobadoPorId: adminUser.id
        }
      });
    }
  }

  // 5. EQUIPOS (crear uno por categoría)
  console.log("✅ Creando equipos...");
  const equipos: Record<string, any> = {};
  for (const [catName, cat] of Object.entries(categorias)) {
    const equipo = await prisma.equipo.create({
      data: {
        nombre: catName,
        categoriaId: cat.id,
        temporadaId: temporada.id
      }
    });
    equipos[catName] = equipo;
  }

  // 6. EVENTOS (partidos, torneos, reuniones, sociales)
  console.log("✅ Creando eventos...");
  const eventosData = [
    // PARTIDOS - Senior Masculino
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-09-15T16:00:00"), ubicacion: "Campo Municipal", esLocal: true, rival: "CR Cisneros", equipoId: equipos["Senior Masculino"].id },
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-09-22T12:00:00"), ubicacion: "Madrid", esLocal: false, rival: "Alcobendas Rugby", equipoId: equipos["Senior Masculino"].id },
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-10-05T16:30:00"), ubicacion: "Campo Municipal", esLocal: true, rival: "CD Universidad", equipoId: equipos["Senior Masculino"].id },
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-10-12T18:00:00"), ubicacion: "Las Rozas", esLocal: false, rival: "Rugby Las Rozas", equipoId: equipos["Senior Masculino"].id },
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-10-26T16:00:00"), ubicacion: "Campo Municipal", esLocal: true, rival: "Sanse Scrum", equipoId: equipos["Senior Masculino"].id },
    // PARTIDOS - Senior Femenino
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-09-14T11:00:00"), ubicacion: "Campo Municipal", esLocal: true, rival: "Mujeres Rugby Madrid", equipoId: equipos["Senior Femenino"].id },
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-09-28T12:00:00"), ubicacion: "Madrid", esLocal: false, rival: "INEF Madrid", equipoId: equipos["Senior Femenino"].id },
    // PARTIDOS - M18
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-09-20T10:00:00"), ubicacion: "Campo Municipal", esLocal: true, rival: "Alcobendas M18", equipoId: equipos["M18"].id },
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-10-04T11:00:00"), ubicacion: "Colegio San Patricio", esLocal: false, rival: "Sanpatrick M18", equipoId: equipos["M18"].id },
    // PARTIDOS - M16
    { tipo: TipoEvento.PARTIDO, fecha: new Date("2025-09-21T09:30:00"), ubicacion: "Campo Municipal", esLocal: true, rival: "CR Cisneros M16", equipoId: equipos["M16"].id },
    // TORNEO - M14
    { tipo: TipoEvento.TORNEO, fecha: new Date("2025-10-18T09:00:00"), ubicacion: "Alcobendas", titulo: "Torneo de Otoño M14", detalles: "Torneo de formación kategorias M12-M14" },
    { tipo: TipoEvento.TORNEO, fecha: new Date("2025-11-23T09:00:00"), ubicacion: "Campo Municipal", titulo: "Torneo de la Constitución M14", detalles: "Torneo infantil de rugby base" },
    // TORNEO - M10
    { tipo: TipoEvento.TORNEO, fecha: new Date("2025-10-19T09:30:00"), ubicacion: "Madrid", titulo: "Festival Rugby Baby", detalles: "Festival de rugby para categorías M6-M10" },
    // REUNIONES
    { tipo: TipoEvento.REUNION, fecha: new Date("2025-09-05T20:00:00"), ubicacion: "Sede Social", titulo: "Asamblea Ordinaria", detalles: "Aprobación de presupuesto y calendario" },
    { tipo: TipoEvento.REUNION, fecha: new Date("2025-10-15T19:30:00"), ubicacion: "Sede Social", titulo: "Reunión Directiva", detalles: "Planificación de eventos del trimestre" },
    { tipo: TipoEvento.REUNION, fecha: new Date("2025-11-10T20:00:00"), ubicacion: "Sede Social", titulo: "Comité Entrenadores", detalles: "Coordinación de horarios entrenamientos" },
    // EVENTOS SOCIALES
    { tipo: TipoEvento.SOCIAL, fecha: new Date("2025-09-27T21:00:00"), ubicacion: "Sede Social", titulo: "Fiesta de Inauguración Temporada", detalles: "Cena de hermandad con familias" },
    { tipo: TipoEvento.SOCIAL, fecha: new Date("2025-12-15T12:00:00"), ubicacion: "Sede Social", titulo: "Merienda Navideña", detalles: "Merienda con entrega de regalos a los niños" },
    { tipo: TipoEvento.SOCIAL, fecha: new Date("2026-01-31T21:00:00"), ubicacion: "Restaurante El Rugby", titulo: "Copa del Rey - Fiesta", detalles: "Celebración si clasificados" },
    { tipo: TipoEvento.SOCIAL, fecha: new Date("2026-03-15T20:00:00"), ubicacion: "Sede Social", titulo: "Comida de Hermanos", detalles: "Comida anual del club" },
    { tipo: TipoEvento.SOCIAL, fecha: new Date("2026-06-20T22:00:00"), ubicacion: "Club Host", titulo: "Fiesta Fin de Temporada", detalles: "Entrega de trofeos y celebración" },
    // OTRO
    { tipo: TipoEvento.OTRO, fecha: new Date("2025-10-31T17:00:00"), ubicacion: "Campo Municipal", titulo: "Jornada de Puertas Abiertas", detalles: "Captación de nuevos jugadores" },
    { tipo: TipoEvento.OTRO, fecha: new Date("2026-02-15T10:00:00"), ubicacion: "Instituto", titulo: "Charla Formativa Rugby", detalles: "Introducción al rugby en colegios" },
  ];
  for (const e of eventosData) {
    await prisma.evento.create({ data: e });
  }

  // 7. INGRESOS EXTERNOS
  console.log("✅ Creando ingresos externos...");
  const ingresosData = [
    { monto: 1500, fuente: "Ayunta", concepto: "Subvención deportiva 2025", fecha: new Date("2025-10-01") },
    { monto: 800, fuente: "Caja", concepto: "Venta de lotería", fecha: new Date("2025-11-15") },
    { monto: 500, fuente: "Patrocinador", concepto: "Patrocinio Bar Sporting", fecha: new Date("2025-09-15") },
    { monto: 1200, fuente: "Ayunta", concepto: "Subvención mantenimiento instalaciones", fecha: new Date("2025-12-01") },
    { monto: 350, fuente: "Socios", concepto: "Cuotas extraordinarias", fecha: new Date("2026-01-10") },
  ];
  for (const ing of ingresosData) {
    await prisma.ingresoExterno.create({
      data: { ...ing, temporadaId: temporada.id }
    });
  }

  // 8. GASTOS
  console.log("✅ Creando gastos...");
  const gastosData = [
    { monto: 450, concepto: "Árbitros partido 15/09", categoria: "Arbitrajes", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-16") },
    { monto: 380, concepto: "Árbitros partido 22/09", categoria: "Arbitrajes", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-23") },
    { monto: 220, concepto: "Balones entrenamiento", categoria: "Material", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-10") },
    { monto: 150, concepto: "Conos y testigos", categoria: "Material", metodo: MetodoPago.EFECTIVO, fecha: new Date("2025-09-12") },
    { monto: 600, concepto: "Alquiler campo septiembre", categoria: "Instalaciones", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-30") },
    { monto: 600, concepto: "Alquiler campo octubre", categoria: "Instalaciones", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-31") },
    { monto: 180, concepto: "Cuota federación jugadores", categoria: "Federación", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-05") },
    { monto: 320, concepto: "Servicios médicos", categoria: "Sanidad", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-20") },
    { monto: 95, concepto: "Botiquín y vendas", categoria: "Sanidad", metodo: MetodoPago.EFECTIVO, fecha: new Date("2025-09-08") },
    { monto: 450, concepto: "Transporte equipo M16 tournament", categoria: "Transporte", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-19") },
    { monto: 280, concepto: "Camisetas entrenamiento", categoria: "Ropa", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-11-01") },
    { monto: 550, concepto: "Seguro responsabilidad civil", categoria: "Seguros", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-09-01") },
    { monto: 150, concepto: "Limpieza sede", categoria: "Mantenimiento", metodo: MetodoPago.EFECTIVO, fecha: new Date("2025-09-30") },
    { monto: 85, concepto: "Luz sede", categoria: "Mantenimiento", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-15") },
    { monto: 120, concepto: "Agua sede", categoria: "Mantenimiento", metodo: MetodoPago.TRANSFERENCIA, fecha: new Date("2025-10-20") },
  ];
  for (const g of gastosData) {
    await prisma.gasto.create({
      data: { ...g, temporadaId: temporada.id }
    });
  }

  console.log("✅ Seed completado: 30 socios con diferentes estados");
  console.log("   - Categorías: M6 a Senior");
  console.log("   - Algunos pagados, otros con deuda");
  console.log("   - Algunos con ropa entregada, otros sin entregar");
  console.log("   - Menores con tutores");
  console.log("   - Casos especiales (documentación)");
  console.log("   - Equipos por categoría");
  console.log("   - Eventos: partidos, torneos, reuniones, sociales");
  console.log("   - Ingresos y gastos de contabilidad");

  // ========================================
  // 12. PRODUCTOS DE TIENDA
  // ========================================
  console.log("\n🛒 Creando productos de tienda...");

  const tallasInfantil = ["Talla 4", "Talla 6", "Talla 8", "Talla 10", "Talla 12"];
  const tallasAdulto = ["XS", "S", "M", "L", "XL", "XXL"];

  const productosData = [
    { nombre: "Camiseta entrenamiento", categoria: "Camisetas", precioVenta: 18, precioCosto: 10, tipo: TipoProducto.ROPA, descripcion: "Camiseta de entrenamiento del club" },
    { nombre: "Camiseta partido", categoria: "Camisetas", precioVenta: 25, precioCosto: 15, tipo: TipoProducto.ROPA, descripcion: "Camiseta de match oficial" },
    { nombre: "Camiseta retro", categoria: "Camisetas", precioVenta: 30, precioCosto: 18, tipo: TipoProducto.ROPA, descripcion: "Camiseta histórica del club" },
    { nombre: "Sudadera con capucha", categoria: "Sudaderas", precioVenta: 35, precioCosto: 20, tipo: TipoProducto.ROPA, descripcion: "Sudadera oficial con logo" },
    { nombre: "Sudadera ligera", categoria: "Sudaderas", precioVenta: 28, precioCosto: 16, tipo: TipoProducto.ROPA, descripcion: "Sudadera sin capucha" },
    { nombre: "Chubasquero", categoria: "Chubasqueros", precioVenta: 40, precioCosto: 22, tipo: TipoProducto.ROPA, descripcion: "Cazadora impermeable" },
    { nombre: "Pantalón entrenamiento", categoria: "Pantalones", precioVenta: 22, precioCosto: 12, tipo: TipoProducto.ROPA, descripcion: "Pantalón de entrenamiento" },
    { nombre: "Calcetines rugby", categoria: "Calcetines", precioVenta: 8, precioCosto: 4, tipo: TipoProducto.ROPA, descripcion: "Calceteros oficiales" },
    { nombre: "Gorra club", categoria: "Complementos", precioVenta: 12, precioCosto: 6, tipo: TipoProducto.COMPLEMENTO, descripcion: "Gorra con bordado" },
    { nombre: "Bufanda", categoria: "Complementos", precioVenta: 15, precioCosto: 8, tipo: TipoProducto.COMPLEMENTO, descripcion: "Bufanda oficial" },
    { nombre: "Llavero", categoria: "Llaveros", precioVenta: 5, precioCosto: 2, tipo: TipoProducto.COMPLEMENTO, descripcion: "Llavero de plástico" },
    { nombre: "Bolsa Deporte", categoria: "Complementos", precioVenta: 20, precioCosto: 10, tipo: TipoProducto.COMPLEMENTO, descripcion: "Bolsa con logo del club" },
  ];

  for (const p of productosData) {
    const producto = await prisma.producto.create({ data: p });

    // Crear tallas con stock inicial
    const tallas = p.categoria === "Llaveros" || p.categoria === "Gorra club" || p.categoria === "Bufanda" || p.categoria === "Bolsa Deporte" 
      ? ["Única"] 
      : [...tallasInfantil, ...tallasAdulto];

    for (const talla of tallas) {
      await prisma.productoTalla.create({
        data: {
          productoId: producto.id,
          talla,
          stock: Math.floor(Math.random() * 30) + 5, // Stock aleatorio entre 5 y 35
        }
      });
    }
    console.log(`   ✅ ${producto.nombre} (${tallas.length} tallas)`);
  }

  console.log("✅ Productos de tienda creados");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
