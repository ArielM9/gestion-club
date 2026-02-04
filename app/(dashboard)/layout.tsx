// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar"; 
import { Toaster } from "sonner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Doble seguridad: Si no hay sesión, fuera.
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <aside className="w-64 shrink-0">
        <Sidebar session={session} />
      </aside>
      <main className="flex-1 bg-[#f8fafc] p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}