import Link from "next/link";
import React from "react";

import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-1.5 sm:gap-2 group ${className}`}>
      <div className="w-8 h-8 sm:w-10 sm:h-10 relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <Image 
          src="/logos/tacodraftnobg.png" 
          alt="TacoDraft Logo" 
          fill
          sizes="(max-width: 640px) 80px, 100px"
          className="object-contain"
        />
      </div>
      <span className="font-display-md text-[20px] sm:text-[24px] font-bold text-on-surface tracking-tight group-hover:text-tertiary transition-colors duration-300">
        TacoDraft
      </span>
    </Link>
  );
}
