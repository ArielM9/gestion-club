import prisma from "./lib/prisma";

async function test() {
  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  console.log("Usuarios encontrados:", usuarios.length);
  console.log(
    usuarios.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
    }))
  );
}

test();
