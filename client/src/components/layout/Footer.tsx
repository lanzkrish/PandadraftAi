import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
export function Footer() {
  return (
    <footer className="w-full py-12 px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center border-t border-outline-variant/10 bg-surface-bright relative z-10">
      <div className="flex flex-col items-center md:items-start mb-6 md:mb-0">
        <div className="mb-4 relative w-[140px] h-[40px]">
          <Image 
            src="/logos/Tacodraft-nobg.png" 
            alt="TacoDraft Logo" 
            fill
            sizes="140px"
            className="object-contain object-left"
          />
        </div>
        <div className="font-body-sm text-body-sm text-on-secondary-container mt-2">
          © {new Date().getFullYear()} TacoDraft. All rights reserved.
        </div>
        <div className="font-body-sm text-body-sm text-on-secondary-container mt-1">
          This is a product of <a href="https://trixtern.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-600 transition-colors">Trixtern Technologies</a>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-6">
        <Link href="/privacy-policy" className="font-body-sm text-body-sm text-on-secondary-container hover:text-tertiary transition-colors opacity-80 hover:opacity-100">
          Privacy Policy
        </Link>
        <Link href="/terms" className="font-body-sm text-body-sm text-on-secondary-container hover:text-tertiary transition-colors opacity-80 hover:opacity-100">
          Terms of Service
        </Link>
        <Link href="/help" className="font-body-sm text-body-sm text-on-secondary-container hover:text-tertiary transition-colors opacity-80 hover:opacity-100">
          Help Center
        </Link>
      </div>
    </footer>
  );
}
