import { Suspense } from "react";
import EventList from "@/components/dashboard/EventList";
import QuickActions from "@/components/dashboard/QuickActions";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import AlertCards from "@/components/dashboard/AlertCards";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function HomePage() {
  // Session is a serial dependency — must resolve first to know who is looking.
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userName = session?.user?.name ?? "Usuario";
  const userRole = session?.user?.role ?? "COLABORADOR";

  return (
    <div className="space-y-4 md:space-y-6">
      <Suspense
        fallback={
          <div className="h-32 bg-slate-100 animate-pulse rounded-[2rem]" />
        }
      >
        <WelcomeHeader nombre={userName} role={userRole} />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-32 bg-slate-100 animate-pulse rounded-[2rem]" />
        }
      >
        <AlertCards />
      </Suspense>

      <Suspense
        fallback={
          <div className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
        }
      >
        <QuickActions userRole={userRole} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <Suspense
            fallback={
              <div className="h-64 bg-slate-100 animate-pulse rounded-[2rem]" />
            }
          >
            <EventList />
          </Suspense>
        </div>

        <div className="lg:col-span-1">
          <Suspense
            fallback={
              <div className="h-64 bg-slate-100 animate-pulse rounded-[2rem]" />
            }
          >
            <ActivityFeed />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
