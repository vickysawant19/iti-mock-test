import React, { memo } from "react";
import { motion, useTransform } from "framer-motion";

function GameRoad({
  curvedRoadPath,
  coordinates = [],
  totalLevels,
  scale,
  canvasHeight,
}) {
  // Dynamically calculate stroke widths in inverse proportion to the zoom scale.
  // This keeps the road visually consistent instead of becoming extremely thick/thin.
  const strokeWidthGlow = useTransform(scale, (s) => 28 / s);
  const strokeWidthMid = useTransform(scale, (s) => 22 / s);
  const strokeWidthBase = useTransform(scale, (s) => 16 / s);
  const strokeWidthDotted = useTransform(scale, (s) => 1.8 / s);

  return (
    <svg
      viewBox={`0 0 500 ${canvasHeight}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      style={{ willChange: "transform", transform: "translateZ(0)" }}
    >
      <defs>
        <linearGradient id="roadGlowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#d946ef" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="roadBaseGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="50%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>

      <motion.path
        d={curvedRoadPath}
        fill="none"
        stroke="url(#roadGlowGrad)"
        strokeWidth={strokeWidthGlow}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-75 blur-[5px]"
      />
      <motion.path
        d={curvedRoadPath}
        fill="none"
        stroke="#6366f1"
        strokeWidth={strokeWidthMid}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-45"
      />
      <motion.path
        d={curvedRoadPath}
        fill="none"
        stroke="url(#roadBaseGrad)"
        strokeWidth={strokeWidthBase}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d={curvedRoadPath}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={strokeWidthDotted}
        strokeDasharray="5 7"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-95"
      />

      {Array.from({ length: totalLevels - 1 }).map((_, L) => {
        const nodeFrom = coordinates[L * 10 + 9];
        const nodeTo = coordinates[(L + 1) * 10];
        if (!nodeFrom || !nodeTo) return null;
        const x = nodeFrom.pixelX;
        const yStart = nodeFrom.pixelY;
        const yEnd = nodeTo.pixelY;

        return (
          <g key={`bridge-${L}`} className="opacity-95">
            <line
              x1={x - 22}
              y1={yStart - 10}
              x2={x - 22}
              y2={yEnd + 10}
              stroke="#090d16"
              strokeWidth="6"
              strokeLinecap="round"
              className="opacity-60"
            />
            <line
              x1={x + 22}
              y1={yStart - 10}
              x2={x + 22}
              y2={yEnd + 10}
              stroke="#090d16"
              strokeWidth="6"
              strokeLinecap="round"
              className="opacity-60"
            />
            <line
              x1={x}
              y1={yStart - 4}
              x2={x}
              y2={yEnd + 4}
              stroke="#1e293b"
              strokeWidth="24"
              strokeLinecap="butt"
            />
            <line
              x1={x}
              y1={yStart - 4}
              x2={x}
              y2={yEnd + 4}
              stroke="#475569"
              strokeWidth="20"
              strokeDasharray="2 4"
              strokeLinecap="butt"
            />
            <line
              x1={x - 11}
              y1={yStart - 4}
              x2={x - 11}
              y2={yEnd + 4}
              stroke="#fbbf24"
              strokeWidth="3.5"
              strokeDasharray="1 14"
            />
            <line
              x1={x + 11}
              y1={yStart - 4}
              x2={x + 11}
              y2={yEnd + 4}
              stroke="#fbbf24"
              strokeWidth="3.5"
              strokeDasharray="1 14"
            />
          </g>
        );
      })}
    </svg>
  );
}

export default memo(GameRoad);
