import React from "react";
import InteractiveAvatar from "@/components/components/InteractiveAvatar";

export const DiaryPageHeader = React.memo(({
  profile,
  subtitle,
  title,
  extraId,
  batchName,
  activeTab,
  onTabChange,
  badgeText,
  gradient = "from-blue-600 to-purple-600",
}) => {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-4 sm:p-5 text-white shadow-xs mb-3`}>
      <div className="absolute top-[-80px] right-[-60px] w-[260px] h-[260px] rounded-full bg-white/10 blur-xl" />
      <div className="absolute bottom-[-60px] left-[-60px] w-[160px] h-[160px] rounded-full bg-white/10 blur-xl" />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center flex-shrink-0">
            <InteractiveAvatar
              src={profile?.profileImage}
              fallbackText={profile?.userName?.charAt(0) || profile?.name?.charAt(0) || "U"}
              userId={profile?.userId}
              editable={false}
              className="w-12 h-12 shadow-sm border-2 border-white/30"
            />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/70 mb-0.5">
              {badgeText || "Portal"}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold leading-tight shadow-sm">
              {title || "Daily Diary"}
            </h1>
            <div className="text-xs text-white/80 mt-1 flex items-center gap-2 flex-wrap">
              <span>{profile?.userName || profile?.name || "User"}</span>
              {extraId && (
                <>
                  <span className="opacity-50">·</span>
                  <span>{extraId}</span>
                </>
              )}
              {batchName && (
                <>
                  <span className="opacity-50">·</span>
                  <span>{batchName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onTabChange && (
          <div className="flex flex-row p-1 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 self-start lg:self-auto w-full sm:w-auto">
            <button
              onClick={() => onTabChange("monthly")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === "monthly"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-white hover:bg-white/20"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => onTabChange("weekly")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === "weekly"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-white hover:bg-white/20"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => onTabChange("daily")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                activeTab === "daily"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-white hover:bg-white/20"
              }`}
            >
              Daily
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default DiaryPageHeader;
