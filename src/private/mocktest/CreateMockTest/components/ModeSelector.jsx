import React from "react";
import { useFormContext } from "react-hook-form";
import { Book, Layers } from "lucide-react";

export function ModeSelector() {
  const { watch, setValue } = useFormContext();
  const currentMode = watch("mode");

  const modes = [
    { id: "subject", label: "Subject Based", icon: Book, desc: "Select a single subject" },
    { id: "module",  label: "Module Based",  icon: Layers, desc: "Select specific modules" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Creation Mode</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          
          return (
            <div
              key={mode.id}
              onClick={() => setValue("mode", mode.id)}
              className={`
                cursor-pointer rounded-xl border p-4 transition-all duration-200 
                flex flex-col items-center text-center gap-2
                ${isActive 
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400 ring-2 ring-blue-600/20" 
                  : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }
              `}
            >
              <div className={`p-2 rounded-full ${isActive ? "bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className={`font-medium ${isActive ? "text-blue-700 dark:text-blue-300" : "text-gray-900 dark:text-gray-100"}`}>
                  {mode.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {mode.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
