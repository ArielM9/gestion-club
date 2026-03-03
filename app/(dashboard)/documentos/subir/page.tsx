import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import SubirDocumentosCliente from "./SubirDocumentosCliente";

export default async function SubirDocumentosPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;
  
  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA" && userRole !== "CONTABILIDAD") {
    redirect("/");
  }

  const archivos = await prisma.documentoPendiente.findMany({
    include: {
      socio: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return <SubirDocumentosCliente archivosIniciales={archivos} />;
}
