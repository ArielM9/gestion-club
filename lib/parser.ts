import { TipoDocumento } from "@/app/generated/client/enums";


interface ParseResult {
  tipo: TipoDocumento | null;
  nombreSujeto: string | null;
  temporada: string | null;
  fechaTransaccion: string | null;
  concepto: string | null;
}

export function analizarNombreArchivo(filename: string): ParseResult {
  const name = filename.replace(/\.[^/.]+$/, ""); // Quitar extensión .pdf
  
  // 1. Caso: {DR, DJ, ER}_NombreApellido[Apellido]_20XX-20XX
  // Soporta CamelCase: JuanRobles, JuanRoblesAngulo
  const drMatch = name.match(/^(DR|DJ|ER)_([A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)?)_(\d{4}-\d{4})$/i);
  
  if (drMatch) {
    return {
      tipo: drMatch[1].toUpperCase() as TipoDocumento,
      nombreSujeto: drMatch[2],
      temporada: drMatch[3],
      fechaTransaccion: null,
      concepto: null
    };
  }

  // 2. Caso: ddmmyy_NombreApellido_Concepto
  // Concepto puede ser cualquier cosa (F, R, E, C1, C1+C2, etc.)
  // Nombre en CamelCase: JuanRobles, JuanMaria (hermanos)
  const pagoMatch = name.match(/^(\d{6})_([A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)?)_?(.+)?$/i);

  if (pagoMatch) {
    return {
      tipo: 'COMPROBANTE_PAGO',
      fechaTransaccion: pagoMatch[1],
      nombreSujeto: pagoMatch[2],
      temporada: null,
      concepto: pagoMatch[3] || null
    };
  }

  // 3. Caso: [DNI|NIE|PASAPORTE|TResidencia]_NombreApellido.pdf
  const dniMatch = name.match(/^(DNI|NIE|PASAPORTE|TResidencia)_([A-Z][a-zA-Z]+(?:[A-Z][a-zA-Z]+)?)$/i);

  if (dniMatch) {
    const prefix = dniMatch[1].toUpperCase();
    let tipo: TipoDocumento = 'DNI';
    
    if (prefix === 'TRESIDENCIA') tipo = 'AI';
    
    return {
      tipo,
      nombreSujeto: dniMatch[2],
      temporada: null,
      fechaTransaccion: null,
      concepto: null
    };
  }

  return { tipo: null, nombreSujeto: null, temporada: null, fechaTransaccion: null, concepto: null };
}