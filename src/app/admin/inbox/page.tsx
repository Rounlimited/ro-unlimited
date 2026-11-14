"use client";

import AdminInbox from "@/components/admin/AdminInbox";

// Full-screen mail client. The admin layout (AuthGuard) still guards this page; it just skips the
// AppShell / DesktopShell chrome for /admin/inbox.
export default function InboxPage() {
  return <AdminInbox />;
}
