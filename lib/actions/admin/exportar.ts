"use server";

import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/server/auth-guard";

export type TipoExportacion = "socios" | "inscripciones" | "contabilidad";

export async function exportarDatosAction(tipo: TipoExportacion, temporadaId?: string) {
  await requireRole(["ADMIN", "CONTABILIDAD", "DIRECTIVA"]);
  try {
    let csvContent = "";
    let filename = "";

    switch (tipo) {
      case "socios": {
        const socios = await prisma.socio.findMany({
          where: { activo: true },
          orderBy: [{ nombre: "asc" }, { apellidos: "asc" }],
          select: {
            nombre: true,
            apellidos: true,
            dni: true,
            email: true,
            telefono: true,
            fechaNacimiento: true,
            sexo: true,
            localidad: true,
          }
        });

        const headers = ["Nombre", "Apellidos", "DNI", "Email", "Teléfono", "Fecha Nac.", "Sexo", "Localidad"];
        csvContent = headers.join(",") + "\n";
        
        csvContent += socios.map(s => [
          s.nombre,
          s.apellidos,
          s.dni,
          s.email || "",
          s.telefono || "",
          s.fechaNacimiento ? new Date(s.fechaNacimiento).toLocaleDateString("es-ES") : "",
          s.sexo || "",
          s.localidad || ""
        ].map(v => `"${v}"`).join(",")).join("\n");
        
        filename = `socios_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "inscripciones": {
        const temporada = temporadaId 
          ? await prisma.temporada.findUnique({ where: { id: temporadaId } })
          : await prisma.temporada.findFirst({ where: { activa: true } });
        
        if (!temporada) {
          return { error: "No hay temporada activa" };
        }

        const inscripciones = await prisma.inscripcion.findMany({
          where: { temporadaId: temporada.id },
          include: {
            socio: true,
            categoria: true,
            equipo: true
          }
        });

        const headers = ["Nombre", "Apellidos", "DNI", "Categoría", "Equipo", "Federado", "Temporada"];
        csvContent = headers.join(",") + "\n";
        
        csvContent += inscripciones.map(i => [
          i.socio.nombre,
          i.socio.apellidos,
          i.socio.dni,
          i.categoria.nombre,
          i.equipo?.nombre || "Sin equipo",
          i.federado ? "Sí" : "No",
          temporada.nombre
        ].map(v => `"${v}"`).join(",")).join("\n");
        
        filename = `inscripciones_${temporada.nombre.replace("/", "-")}.csv`;
        break;
      }

      case "contabilidad": {
        const temporada = temporadaId 
          ? await prisma.temporada.findUnique({ where: { id: temporadaId } })
          : await prisma.temporada.findFirst({ where: { activa: true } });
        
        if (!temporada) {
          return { error: "No hay temporada activa" };
        }

        const cargos = await prisma.cargo.findMany({
          where: { temporadaId: temporada.id },
          include: {
            socio: { select: { nombre: true, apellidos: true, dni: true } },
            abonos: true
          },
          orderBy: { fecha: "desc" }
        });

        const headers = ["Fecha", "Socio", "DNI", "Concepto", "Importe", "Abonado", "Pendiente"];
        csvContent = headers.join(",") + "\n";
        
        csvContent += cargos.map(c => {
          const totalAbonado = c.abonos.reduce((sum, a) => sum + a.monto, 0);
          const pendiente = c.monto - totalAbonado;
          return [
            new Date(c.fecha).toLocaleDateString("es-ES"),
            `${c.socio.nombre} ${c.socio.apellidos}`,
            c.socio.dni,
            c.concepto,
            c.monto.toFixed(2),
            totalAbonado.toFixed(2),
            pendiente.toFixed(2)
          ].map(v => `"${v}"`).join(",");
        }).join("\n");
        
        filename = `contabilidad_${temporada.nombre.replace("/", "-")}.csv`;
        break;
      }

      default:
        return { error: "Tipo de exportación no válido" };
    }

    return { 
      success: true, 
      data: csvContent,
      filename
    };
  } catch (error) {
    console.error("ERROR_EXPORTAR:", error);
    return { error: "Error al exportar datos" };
  }
}

export async function getTemporadasParaExport() {
  const temporadas = await prisma.temporada.findMany({
    orderBy: { fechaInicio: "desc" },
    select: { id: true, nombre: true, activa: true }
  });
  return temporadas;
}
