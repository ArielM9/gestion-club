import { db as prisma, TipoProducto } from "@repo/db";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🛒 Creando productos de tienda...");

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
    const existente = await prisma.producto.findFirst({ where: { nombre: p.nombre } });
    if (existente) {
      console.log(`   ⏭️  ${p.nombre} ya existe`);
      continue;
    }

    const producto = await prisma.producto.create({ data: p });

    const tallas = p.categoria === "Llaveros" || p.categoria === "Gorra club" || p.categoria === "Bufanda" || p.categoria === "Bolsa Deporte" 
      ? ["Única"] 
      : [...tallasInfantil, ...tallasAdulto];

    for (const talla of tallas) {
      await prisma.productoTalla.create({
        data: {
          productoId: producto.id,
          talla,
          stock: Math.floor(Math.random() * 30) + 5,
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
