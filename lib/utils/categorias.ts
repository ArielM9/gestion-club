export function getYear(fechaNacimiento: Date): number {
  return new Date(fechaNacimiento).getFullYear();
}

export function getYearTemporada(temporadaNombre: string): number {
  const match = temporadaNombre.match(/(\d{4})/);
  if (match) return parseInt(match[1]);
  return new Date().getFullYear();
}

export function getCategoriaPorAnoNacimiento(anoNacimiento: number, anoTemporada: number, sexo: string | null): string {
  const edadPorAno = anoTemporada - anoNacimiento;
  
  if (edadPorAno >= 18) {
    return sexo === "F" ? "Senior Femenino" : "Senior Masculino";
  }
  if (edadPorAno === 17 || edadPorAno === 16) return "M18";
  if (edadPorAno === 15 || edadPorAno === 14) return "M16";
  if (edadPorAno === 13 || edadPorAno === 12) return "M14";
  if (edadPorAno === 11 || edadPorAno === 10) return "M12";
  if (edadPorAno === 9 || edadPorAno === 8) return "M10";
  if (edadPorAno === 7 || edadPorAno === 6) return "M8";
  if (edadPorAno === 5 || edadPorAno === 4) return "M6";
  
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
    return { ano1: anoTemporada - 100, ano2: anoTemporada - 18 };
  }
  return null;
}

export function getSexoCategoria(nombre: string): "M" | "F" | null {
  if (nombre.toLowerCase().includes("masculino")) return "M";
  if (nombre.toLowerCase().includes("femenino")) return "F";
  return null;
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
  
  if (nombreCategoria === "Senior Masculino") return "M18";
  if (nombreCategoria === "Senior Femenino") return "M18";
  
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
