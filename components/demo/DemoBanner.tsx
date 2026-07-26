"use client";

import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";

const STORAGE_KEY = "demo-banner-dismissed";

/**
 * Fixed banner shown at the top of every page when running in demo mode.
 * Communicates that data resets nightly and that the instance is read/write
 * but ephemeral. Dismissible for the current browser session only.
 */
export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage may be unavailable in private mode — fall back to visible
    }
  }, []);

  function handleDismiss() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  // Avoid hydration mismatch: render nothing on the server pass, then decide.
  if (!mounted || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 bg-amber-400 text-slate-900 border-b border-amber-500 shadow-sm"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 py-2 text-sm font-bold">
        <div className="flex items-center gap-2 min-w-0">
          <Info size={16} className="shrink-0" aria-hidden />
          <span className="truncate">
            Esto es una demo. Los datos se borran cada madrugada.
          </span>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso de demo"
          className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-amber-500/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
