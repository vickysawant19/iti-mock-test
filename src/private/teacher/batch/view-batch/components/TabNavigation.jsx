import React from "react";
import { ChevronDown } from "lucide-react";

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => {
  const selectedTab = tabs.find(({ id }) => id === activeTab) || tabs[0];
  const SelectedIcon = selectedTab?.icon;

  return (
    <div className="w-full">
      <label className="relative block lg:hidden">
        <span className="sr-only">Choose a batch records section</span>
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-indigo-600 dark:text-indigo-400">
          {SelectedIcon && <SelectedIcon className="h-4 w-4" />}
        </span>
        <select
          value={activeTab}
          onChange={(event) => setActiveTab(event.target.value)}
          className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {tabs.map(({ id, label }) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </label>

      <div className="hidden overflow-x-auto scroll-smooth lg:block">
        <div className="flex items-center space-x-1 min-w-max pb-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? "page" : undefined}
                className={`relative group flex items-center gap-2.5 px-5 py-3 rounded-xl transition-all duration-300 ease-out
                  ${
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                <span className={`text-sm font-bold tracking-tight whitespace-nowrap`}>
                  {label}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full shadow-[0_-2px_6px_rgba(37,99,235,0.3)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
