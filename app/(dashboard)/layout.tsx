// app/(dashboard)/layout.tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import { Toaster } from "sonner"
import { MobileMenuButton } from "@/components/ui/MobileMenuButton";
import { MobileMenuOverlay } from "@/components/ui/MobileMenuOverlay";
import { isDemoMode } from "@/lib/demo";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // In demo mode, middleware lets unauthenticated traffic through. The
    // first request has no session, so we bounce to /api/demo/init which
    // signs the demo admin in and redirects back. After that, the session
    // cookie is set and subsequent loads have a valid session.
    if (isDemoMode()) {
      redirect("/api/demo/init?return=/");
    }
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