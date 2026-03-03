export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  precioVenta: number;
  precioCosto: number | null;
  activoVenta: boolean;
  activoPedido: boolean;
  tipo: "ROPA" | "COMPLEMENTO";
}

export interface ProductoTalla {
  id: string;
  productoId: string;
  talla: string;
  stock: number;
}

export interface ProductoConStock extends Producto {
  tallas: ProductoTalla[];
}
