"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Tracks page views and app opens for admin users.
// Debounced — waits 500ms before logging to avoid rapid-fire on navigation.
// Caches session to avoid repeated auth calls.
export default function ActivityTracker() {
  const pathname = usePathname();
  const lastLogged = useRef<string>("");
  const sessionLogged = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const cachedUser = useRef<{ id: string; email: string; role: string } | null>(null);

  useEffect(() => {
    // Cache session on first mount
    if (!cachedUser.current) {
      createClient().auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          cachedUser.current = {
            id: session.user.id,
            email: session.user.email || "",
            role: session.user.user_metadata?.role || "admin",
          };
        }
      });
    }
  }, []);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const user = cachedUser.current;
      if (!user || user.role === "super_admin") return;

      const action = sessionLogged.current ? "page_view" : "app_open";
      if (!sessionLogged.current) sessionLogged.current = true;

      const key = `${action}:${pathname}`;
      if (key === lastLogged.current) return;
      lastLogged.current = key;

      fetch("/api/admin/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          action,
          page: pathname,
          user_agent: navigator.userAgent,
        }),
      }).catch(() => {});
    }, 500);

    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [pathname]);

  return null;
}
