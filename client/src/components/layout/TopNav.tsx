"use client";

import React, { useState, useEffect, useRef } from "react";
import { Logo } from "../brand/Logo";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const isDemo = pathname.startsWith("/demo");

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, plan?: string, credits?: number, max_credits?: number, avatar_url?: string} | null>(
    isDemo ? {name: "Demo User", email: "demo@pandadraft.ai", plan: "Growth", credits: 50, max_credits: 50} : null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDemo) return;
    const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
    fetch(`${apiUrl}/api/auth/me`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const apiUrl = "" /* Proxy rewrite in next.config.ts handles backend routing */;
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="glass-nav fixed top-0 right-0 left-0 md:left-64 flex justify-between items-center px-6 h-16 z-30 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md">
      <div className="md:hidden flex-grow">
        <Logo />
      </div>
      <div className="hidden md:block flex-grow"></div>

      {user && (
        <div className="flex items-center gap-3 mr-3 bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant/30 shadow-sm select-none">
          <span className="bg-[#0071E3]/10 text-[#0071E3] font-bold font-label-md text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-md">
            {user.plan || "Free"}
          </span>
          <div className="w-px h-4 bg-outline-variant/50"></div>
          <span className="font-body-sm text-[12px] text-on-surface-variant font-medium">
            Credits: <span className="font-bold text-on-surface">{user.credits ?? 0}</span>/<span className="text-on-surface-variant/70">{user.max_credits ?? 2}</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-5">
        <button className="scale-95 active:scale-90 transition-transform hover:text-primary duration-200 relative mt-1">
          <span className="material-symbols-outlined text-on-surface-variant text-[28px]">notifications</span>
          <span className="absolute top-[2px] right-[2px] w-2.5 h-2.5 bg-error rounded-full border-2 border-surface"></span>
        </button>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-10 h-10 rounded-full border border-outline-variant/30 bg-primary-container overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer select-none shadow-sm"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : user?.name ? (
              <span className="text-primary font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-secondary to-primary opacity-50"></div>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-surface border border-outline-variant/30 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-2 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-outline-variant/20 mb-2">
                <p className="font-label-md text-label-md font-bold truncate text-on-surface">{user?.name || 'Loading...'}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">{user?.email || ''}</p>
              </div>
              <Link 
                href={isDemo ? "/demo/dashboard/settings" : "/dashboard/settings"} 
                onClick={() => setDropdownOpen(false)}
                className="px-4 py-2.5 hover:bg-surface-bright flex items-center gap-3 transition-colors font-body-md text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">settings</span>
                Settings
              </Link>
              {isDemo ? (
                <Link 
                  href="/signup"
                  className="w-full text-left px-4 py-2.5 hover:bg-primary/10 hover:text-primary flex items-center gap-3 transition-colors font-body-md text-primary font-bold"
                >
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Sign up to Save
                </Link>
              ) : (
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 hover:bg-error/10 hover:text-error flex items-center gap-3 transition-colors font-body-md text-error"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  Log out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
