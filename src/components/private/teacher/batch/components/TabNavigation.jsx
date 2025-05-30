import React from "react";

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="bg-white rounded-lg shadow-xs dark:bg-gray-800 dark:border dark:border-gray-700">
      <div className="overflow-x-auto">
        <div className="flex space-x-1 p-2 min-w-max">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === id
                  ? "bg-blue-600 text-white shadow-md dark:bg-blue-700"
                  : "hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;
