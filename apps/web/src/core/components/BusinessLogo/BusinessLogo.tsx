'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// gsap removed — replaced with CSS animations.
// Eliminates GSAP (~70 KB gzipped) from the business panel initial chunk.
// Entry animations use existing Tailwind keyframes; hover states use
// group-hover Tailwind classes so no JS runs on pointer events.

export function BusinessLogo() {
  return (
    <Link
      href="/business"
      className="flex items-center gap-2 cursor-pointer group"
    >
      <div className="relative flex items-center gap-2">
        {/* Logo Icon: scale-in entry, subtle float on hover */}
        <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden relative animate-[scaleIn_0.7s_cubic-bezier(0.34,1.56,0.64,1)_both] group-hover:scale-110 transition-transform duration-300 ease-out">
          <Image
            src="/icono.png"
            alt="SofLIA Academy Logo"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Logo Text: slide-in entry */}
        <span className="font-bold text-lg lg:text-xl hidden sm:inline-block text-primary animate-[slideInUp_0.6s_ease-out_0.35s_both]">
          SofLIA Academy
        </span>

        {/* Business Badge */}
        <div className="relative flex-shrink-0 animate-[scaleIn_0.6s_cubic-bezier(0.34,1.56,0.64,1)_0.6s_both] group-hover:scale-110 transition-transform duration-300 ease-out">
          {/* Glow ring — pulsing via CSS */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-md opacity-50 animate-pulse" />

          {/* Badge */}
          <div className="relative text-xs font-bold px-2.5 py-0.5 lg:px-3 lg:py-1 rounded-full italic bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg overflow-hidden whitespace-nowrap">
            <span className="relative z-10">Business</span>
            {/* Shimmer sweep */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-button-shimmer" />
          </div>
        </div>
      </div>
    </Link>
  );
}
