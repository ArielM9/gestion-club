export interface CargoData {
  id: string;
  monto: number;
  concepto: string;
  fecha: Date;
}

export interface AbonoData {
  id: string;
  monto: number;
  motivo: string | null;
  fecha: Date;
}

export interface DocumentoData {
  id: string;
  tipo: string;
  filename: string;
  storagePath: string;
  concepto: string | null;
  createdAt?: string;
  temporada: { nombre: string };
}

export interface InscripcionData {
  id: string;
  federado: boolean;
  temporada: { nombre: string; activa: boolean };
}

export interface SocioData {
  id: string;
  nombre: string;
  apellidos: string;
  mote: string | null;
  dni: string;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: Date | null;
  sexo: string | null;
  nacionalidad: string | null;
  direccion: string | null;
  codigoPostal: string | null;
  localidad: string | null;
  nombreTutor: string | null;
  dniTutor: string | null;
  telefonoTutor: string | null;
  observaciones: string | null;
  tallaRopa: string | null;
  categoriaId: string | null;
  activo: boolean;
  categoria: { id: string; nombre: string } | null;
  cargos: CargoData[];
  abonos: AbonoData[];
  documentos: DocumentoData[];
  inscripciones: InscripcionData[];
}

export interface CategoriaBasic {
  id: string;
  nombre: string;
}

export interface JugadorPageProps {
  socio: SocioData;
  categorias: CategoriaBasic[];
  temporadaActiva?: string;
}
