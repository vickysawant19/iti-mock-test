import React from "react";

export default function StatTile({ icon, label, value, onClick, accent = "text-white", compact = false }) {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04]",
        "px-3 py-2 text-left transition-all hover:bg-white/[0.08] active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/60",
        compact ? "shrink-0" : "w-full",
      ].join(" ")}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <span className={`block truncate text-[11px] font-black ${accent}`}>{value}</span>
      </span>
    </button>
  );
}
