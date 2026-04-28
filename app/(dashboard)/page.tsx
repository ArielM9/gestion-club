import { Suspense } from "react";
import EventList from "@/components/dashboard/EventList";
import StatCards from "@/components/dashboard/SatCards";
import QuickActions from "@/components/dashboard/QuickActions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PageContainer } from "@/components/ui/PageContainer";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = session?.user?.role || "COLABORADOR";

  return (
    <PageContainer
      title="Panel de Control"
      subtitle="Resumen de actividad del club"
      maxWidth="md"
    >
      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />}>
        <StatCards />
      </Suspense>

      <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />}>
        <QuickActions userRole={userRole} />
      </Suspense>

      <div className="mt-15">
        <Suspense fallback={<div className="h-64 bg-slate-100 animate-pulse rounded-3xl " />}>
          <EventList />
        </Suspense>
      </div>
    </PageContainer>
  );
}