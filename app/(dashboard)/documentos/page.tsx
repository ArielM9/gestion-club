import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import DocumentosCliente from "./DocumentosCliente";

export default async function DocumentosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;
  
  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA" && userRole !== "CONTABILIDAD") {
    redirect("/");
  }

  const pendientes = await prisma.documentoPendiente.findMany({
    include: {
      socio: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <DocumentosCliente pendientesIniciales={pendientes} />;
}
