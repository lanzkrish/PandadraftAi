"use client";

import React from "react";
import { Logo } from "../brand/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/Button";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { name: "Calendar", href: "/dashboard/calendar", icon: "calendar_month" },
  { name: "Generator", href: "/dashboard/generator", icon: "auto_awesome" },
  { name: "Write Post", href: "/dashboard/write", icon: "edit_document" },
  { name: "Library", href: "/dashboard/posts", icon: "library_books" },
  { name: "Analytics", href: "/dashboard/analytics", icon: "leaderboard" },
  { name: "Subscribe", href: "/dashboard/subscribe", icon: "credit_card" },
  { name: "Settings", href: "/dashboard/settings", icon: "settings" },
];

export function SideNav({ isMobileMenuOpen, setIsMobileMenuOpen }: { isMobileMenuOpen?: boolean, setIsMobileMenuOpen?: (open: boolean) => void }) {
  const pathname = usePathname();
  const isDemo = pathname.startsWith("/demo");
  const basePath = isDemo ? "/demo/dashboard" : "/dashboard";

  const dynamicNavItems = navItems.map(item => ({
    ...item,
    href: item.href.replace("/dashboard", basePath)
  }));

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 glass-panel bg-surface md:bg-transparent border-l-0 border-t-0 border-b-0 flex flex-col p-4 gap-2 z-40 transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex flex-col gap-1 mb-8 px-2 mt-4">
        <Logo />
        <span className="font-label-md text-label-md text-on-surface-variant mt-2 ml-1">
          Premium AI SaaS
        </span>
      </div>
      <nav className="flex flex-col gap-2 flex-grow">
        {dynamicNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-out font-label-md text-label-md ${
                isActive
                  ? "glass-card text-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:bg-white/30 dark:hover:bg-white/5 hover:translate-x-1"
              }`}
              onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-outline-variant/20">
        <Button className="w-full" variant="primary">
          Upgrade to Pro
        </Button>
      </div>
    </aside>
  );
}
