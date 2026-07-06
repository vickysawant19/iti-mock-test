import React from "react";

export default function LevelShield({ level }) {
  return (
    <div className="relative flex h-full w-full select-none items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id="goldGradShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE58F" />
            <stop offset="50%" stopColor="#F6C453" />
            <stop offset="100%" stopColor="#D48806" />
          </linearGradient>
          <radialGradient id="purpleShieldGradShield" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0A7FF" />
            <stop offset="70%" stopColor="#A020F0" />
            <stop offset="100%" stopColor="#5B0E91" />
          </radialGradient>
          <linearGradient id="glossGradShield" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d="M 50 2 L 53 10 L 61 10 L 55 15 L 57 23 L 50 18 L 43 23 L 45 15 L 39 10 L 47 10 Z" fill="#F6C453" stroke="#D48806" strokeWidth="0.7" />

        <path d="M 28 35 C 10 25, 4 48, 18 58 C 8 52, 6 62, 20 64 C 10 62, 12 72, 26 68" fill="none" stroke="url(#goldGradShield)" strokeWidth="4" strokeLinecap="round" />
        <path d="M 72 35 C 90 25, 96 48, 82 58 C 92 52, 94 62, 80 64 C 90 62, 88 72, 74 68" fill="none" stroke="url(#goldGradShield)" strokeWidth="4" strokeLinecap="round" />

        <path d="M 32 24 L 68 24 Q 74 24 72 38 L 64 74 Q 50 88 50 88 Q 50 88 36 74 L 28 38 Q 26 24 32 24 Z" fill="url(#purpleShieldGradShield)" stroke="url(#goldGradShield)" strokeWidth="3.5" />
        <path d="M 32 24 L 68 24 Q 74 24 72 38 L 50 50 L 28 38 Q 26 24 32 24 Z" fill="url(#glossGradShield)" pointerEvents="none" />

        <circle cx="34" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
        <circle cx="66" cy="30" r="1.5" fill="#FFFFFF" opacity="0.8" className="animate-pulse" />
        <circle cx="50" cy="78" r="1" fill="#FFFFFF" opacity="0.6" />

        <text x="50" y="44" textAnchor="middle" fill="#F6C453" fontSize="9" fontWeight="800" fontFamily="Poppins, sans-serif" letterSpacing="0.8">LEVEL</text>
        <text x="50" y="70" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontWeight="900" fontFamily="Poppins, sans-serif" filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.5))">{level}</text>
      </svg>
    </div>
  );
}
