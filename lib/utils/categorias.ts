export function getYear(fechaNacimiento: Date): number {
  return new Date(fechaNacimiento).getFullYear();
}

export function getYearTemporada(fechaInicio: Date): number {
  return new Date(fechaInicio).getFullYear();
}

export function getCategoriaPorAnoNacimiento(anoNacimiento: number, anoTemporada: number, sexo: string | null): string {
  const edadPorAno = anoTemporada - anoNacimiento;
  
  // Senior: 22+ años
  if (edadPorAno >= 22) {
    return sexo === "F" ? "Senior Femenino" : "Senior Masculino";
  }
  // M22: 20-21 años
  if (edadPorAno === 20 || edadPorAno === 21) return "M22";
  // M20: 18-19 años
  if (edadPorAno === 18 || edadPorAno === 19) return "M20";
  // M18: 16-17 años
  if (edadPorAno === 16 || edadPorAno === 17) return "M18";
  // M16: 14-15 años
  if (edadPorAno === 14 || edadPorAno === 15) return "M16";
  // M14: 12-13 años
  if (edadPorAno === 12 || edadPorAno === 13) return "M14";
  // M12: 10-11 años
  if (edadPorAno === 10 || edadPorAno === 11) return "M12";
  // M10: 8-9 años
  if (edadPorAno === 8 || edadPorAno === 9) return "M10";
  // M8: 6-7 años
  if (edadPorAno === 6 || edadPorAno === 7) return "M8";
  // M6: 4-5 años
  if (edadPorAno === 4 || edadPorAno === 5) return "M6";
  
  return "";
}

export function getAnosNacimientoCategoria(nombreCategoria: string, anoTemporada: number): { ano1: number; ano2: number } | null {
  const match = nombreCategoria.match(/M(\d+)/);
  if (match) {
    const edadMinima = parseInt(match[1]);
    return {
      ano1: anoTemporada - edadMinima - 1,
      ano2: anoTemporada - edadMinima
    };
  }
  if (nombreCategoria === "Senior Masculino" || nombreCategoria === "Senior Femenino") {
    return { ano1: anoTemporada - 100, ano2: anoTemporada - 22 };
  }
  return null;
}

export function getSexoCategoria(nombre: string): "M" | "F" | null {
  if (nombre.toLowerCase().includes("masculino")) return "M";
  if (nombre.toLowerCase().includes("femenino")) return "F";
  return null;
}

/**
 * M20 y M22 tienen precios propios de ficha federativa,
 * pero para cuota de club se considerada Senior.
 * Esta función devuelve la categoría de Senior equivalente.
 */
export function getCategoriaSeniorEquivalente(categoriaNombre: string, sexo: string | null): string {
  if (categoriaNombre === "M20" || categoriaNombre === "M22") {
    return sexo === "F" ? "Senior Femenino" : "Senior Masculino";
  }
  return categoriaNombre;
}

export function getCategoriaAnterior(nombreCategoria: string): string | null {
  const ordenCategorias = [
    "M6", "M8", "M10", "M12", "M14", "M16", "M18", 
    "Senior Masculino", "Senior Femenino"
  ];
  
  const match = nombreCategoria.match(/M(\d+)/);
  if (match) {
    const edadMinima = parseInt(match[1]);
    const nuevaEdad = edadMinima - 2;
    if (nuevaEdad >= 6) {
      return `M${nuevaEdad}`;
    }
    return null;
  }
  
  // Senior no puede aceptar jugadores de segundo año de M18
  if (nombreCategoria === "Senior Masculino") return null;
  if (nombreCategoria === "Senior Femenino") return null;
  
  return null;
}

export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad;
}
