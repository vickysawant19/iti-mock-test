import React from "react";

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="w-full">
      <div className="overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center space-x-1 min-w-max pb-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
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
