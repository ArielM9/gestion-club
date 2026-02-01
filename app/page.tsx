import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { LogoutButton } from "./components/auth/LogoutButton";
import Link from "next/link";

export default async function HomePage() {
    // El servidor lee la cookie que Better Auth guardó
    const session = await auth.api.getSession({
        headers: await headers() 
    });

    if (!session) {
        return <div>No estás logueado. Ve a /login</div>;
    }

    return (
        <main className="p-8 text-white flex flex-col gap-4">
            <h1>Bienvenido al Club, {session.user.name}</h1>
            <p>Tu rol es: {session.user.role ?? "Usuario"}</p>
            <div className="flex gap-4 ">
                <Link className="bg-blue-600 text-white p-2 rounded" href="/admin">Admin</Link>
                <Link className="bg-blue-600 text-white p-2 rounded" href="/contabilidad">Contabilidad</Link>
                <Link className="bg-blue-600 text-white p-2 rounded" href="/dashboard">Dashboard</Link>
            </div>
            
            <div className="flex top-12 right-12 absolute justify-end">
                <LogoutButton />
            </div>
        </main>

     
    );
}