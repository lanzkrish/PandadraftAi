import React from "react";
import { Logo } from "../brand/Logo";

export function TopNav() {
  return (
    <nav className="md:hidden glass-nav w-full flex justify-between items-center px-4 h-16">
      <Logo />
      <div className="flex items-center gap-4">
        <button className="scale-95 active:scale-90 transition-transform hover:text-primary duration-200">
          <span className="material-symbols-outlined text-on-surface-variant">search</span>
        </button>
        <button className="scale-95 active:scale-90 transition-transform hover:text-primary duration-200">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
        <div className="w-8 h-8 rounded-full border border-outline-variant/30 bg-primary-container overflow-hidden">
          {/* Placeholder Avatar */}
          <div className="w-full h-full bg-gradient-to-tr from-secondary to-primary opacity-50"></div>
        </div>
      </div>
    </nav>
  );
}
