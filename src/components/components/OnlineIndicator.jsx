import React from "react";
import { useOnlineUsers } from "@/hooks/useOnlineUsers";

/**
 * Renders a small coloured dot indicating a user's online status.
 *
 * Props:
 *   userId  - Appwrite user $id to look up
 *   size    - 'xs' | 'sm' (default) | 'md'
 *   className - extra Tailwind classes for the wrapper span
 *
 * Colours:
 *   online  → solid green with a subtle pulse ring
 *   away    → amber/yellow
 *   offline → transparent (renders nothing)
 */
export default function OnlineIndicator({ userId, size = "sm", className = "" }) {
  const { getStatus } = useOnlineUsers();
  const status = getStatus(userId);

  if (!userId || status === "offline") return null;

  const sizeClasses = {
    xs: "w-1.5 h-1.5",
    sm: "w-2.5 h-2.5",
    md: "w-3.5 h-3.5",
  };

  const dot = sizeClasses[size] ?? sizeClasses.sm;

  if (status === "online") {
    return (
      <span
        className={`relative inline-flex ${dot} ${className}`}
        title="Online"
        aria-label="Online"
      >
        {/* Pulse ring */}
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60`}
        />
        {/* Solid dot */}
        <span
          className={`relative inline-flex rounded-full ${dot} bg-green-500 ring-1 ring-white dark:ring-gray-900`}
        />
      </span>
    );
  }

  // away
  return (
    <span
      className={`inline-flex rounded-full ${dot} bg-amber-400 ring-1 ring-white dark:ring-gray-900 ${className}`}
      title="Away"
      aria-label="Away"
    />
  );
}
