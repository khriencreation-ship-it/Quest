"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function DashboardMainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNotificationsPage = pathname.startsWith("/dashboard/notifications");

  return (
    <main 
      className={`flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 ${
        isNotificationsPage 
          ? "ml-24" // Only the narrow workspace switcher is visible
          : "ml-64 md:ml-[352px]" // Both sidebars are visible
      }`}
    >
      <div className="flex-1 p-8">
        {children}
      </div>
    </main>
  );
}
