import Link from "next/link";
import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tertiary to-primary flex items-center justify-center shadow-md shadow-tertiary/20 group-hover:shadow-tertiary/40 transition-all duration-300">
        <span className="text-white font-display-md text-lg font-bold">P</span>
      </div>
      <span className="font-display-md text-[24px] font-bold text-on-surface tracking-tight group-hover:text-tertiary transition-colors duration-300">
        Pandadraft
      </span>
    </Link>
  );
}
