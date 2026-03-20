'use client';

import DesktopSidebar from './DesktopSidebar';
import DesktopTopBar from './DesktopTopBar';

export default function DesktopShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex bg-[#0a0a0a]">
      {/* Sidebar */}
      <DesktopSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <DesktopTopBar />

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
