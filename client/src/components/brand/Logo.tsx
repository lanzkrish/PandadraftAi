import Link from "next/link";
import React from "react";

import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="w-10 h-10 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <Image 
          src="/Minimal_Vector_AI_Panda_Logo-removebg-preview.png" 
          alt="Pandadraft Logo" 
          fill
          className="object-contain"
        />
      </div>
      <span className="font-display-md text-[24px] font-bold text-on-surface tracking-tight group-hover:text-tertiary transition-colors duration-300">
        Pandadraft
      </span>
    </Link>
  );
}
