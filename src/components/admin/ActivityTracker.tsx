"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tracks page views and app opens for admin users.
// Fires on mount (app_open) and on every pathname change (page_view).
// Debounced to avoid duplicate logs on rapid navigation.
export default function ActivityTracker() {
  const pathname = usePathname();
  const lastLogged = useRef<string>("");
  const sessionLogged = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    async function logActivity(action: string, page?: string) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Don't log super_admin activity (they're the one watching)
      if (session.user.user_metadata?.role === "super_admin") return;

      const key = `${action}:${page || ""}`;
      if (key === lastLogged.current) return;
      lastLogged.current = key;

      try {
        await fetch("/api/admin/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: session.user.id,
            user_email: session.user.email,
            action,
            page,
            user_agent: navigator.userAgent,
          }),
        });
      } catch {
        // Non-critical — don't break the app
      }
    }

    // Log app open once per session
    if (!sessionLogged.current) {
      sessionLogged.current = true;
      logActivity("app_open", pathname);
    }

    // Log page view on navigation
    logActivity("page_view", pathname);
  }, [pathname]);

  return null; // Invisible tracker
}
