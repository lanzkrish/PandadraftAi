"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullScreenPage = pathname === "/dashboard/calendar" || pathname === "/dashboard/generator" || pathname === "/dashboard/posts" || pathname === "/dashboard/write";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <TopNav />
      <SideNav />
      <main 
        className={`flex-grow md:ml-64 relative z-10 ${
          isFullScreenPage 
            ? "pt-16 h-screen flex flex-col overflow-hidden" 
            : "pt-24 px-4 md:px-gutter max-w-container-max mx-auto w-full pb-20"
        }`}
      >
        {children}
      </main>
      
      {/* Background Decorative Blur for Glassmorphism Effect */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-tertiary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-secondary/5 blur-[100px]"></div>
      </div>
    </div>
  );
}
