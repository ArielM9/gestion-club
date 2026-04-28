// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar"; 
import { Toaster } from "sonner"
import { MobileMenuButton } from "@/components/ui/MobileMenuButton";
import { MobileMenuOverlay } from "@/components/ui/MobileMenuOverlay";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <aside className="hidden md:block w-64 shrink-0">
        <Sidebar session={session} />
      </aside>
      
      <MobileMenuOverlay session={session} />
      
      <MobileMenuButton />
      
      <main className="flex-1 bg-[#f8fafc] p-4 md:p-6 lg:p-8 xl:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}