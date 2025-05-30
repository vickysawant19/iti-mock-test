import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

const CustomSelector = ({
  selectedValue,
  onValueChange,
  options = [],
  isLoading = false,
  placeholder = "Select an option",
  displayKey = "name",
  valueKey = "id",
  icon: Icon = null,
  emptyMessage = "No options available",
  className = "",
  maxWidth = "md:max-w-md",
  renderOption = null,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get selected item display text
  const getSelectedDisplayText = () => {
    if (isLoading) return `Loading ${placeholder.toLowerCase()}...`;

    const selected = options.find(
      (item) => String(item[valueKey]) === String(selectedValue)
    );
    return selected ? selected[displayKey] : placeholder;
  };

  // Render default option item
  const defaultRenderOption = (option, isSelected) => (
    <div className="flex items-center gap-3 w-full">
      {Icon && (
        <Icon
          className={`w-4 h-4 shrink-0 ${
            isSelected
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        />
      )}
      <span className="truncate font-medium text-gray-800 dark:text-white">
        {option[displayKey]}
      </span>
    </div>
  );

  return (
    <div
      className={`relative w-full ${className} dark:bg-gray-800`}
      ref={dropdownRef}
    >
      {/* Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={isLoading || disabled}
        className={`flex items-center justify-between w-full ${maxWidth} p-3 px-4 bg-white border border-gray-200 rounded-lg shadow-sm 
          dark:bg-gray-800 dark:border-gray-700 dark:text-white
          ${
            disabled
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
          } 
          transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-800`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        type="button"
      >
        <div className="flex items-center gap-3 w-full overflow-hidden">
          {Icon && (
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          )}
          <span className="font-medium text-gray-800 truncate dark:text-white">
            {getSelectedDisplayText()}
          </span>
        </div>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500 dark:text-blue-400 shrink-0 ml-2" />
        ) : (
          <ChevronDown
            className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform shrink-0 ml-2 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && options.length > 0 && (
        <div
          className={`absolute z-50 mt-1 w-full ${maxWidth} bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden
            dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
        >
          <ul
            className="py-1 max-h-60 overflow-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent dark:scrollbar-thumb-gray-600"
            role="listbox"
          >
            {options.map((option) => {
              const optionValue = String(option[valueKey]);
              const isSelected = optionValue === String(selectedValue);

              return (
                <li
                  key={optionValue}
                  onClick={() => {
                    onValueChange(optionValue);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 cursor-pointer hover:bg-blue-50 flex items-center w-full dark:hover:bg-gray-700
                    ${
                      isSelected
                        ? "bg-blue-100 text-blue-700 dark:bg-gray-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-white"
                    }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  {renderOption
                    ? renderOption(option, isSelected)
                    : defaultRenderOption(option, isSelected)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {isOpen && options.length === 0 && !isLoading && (
        <div
          className={`absolute z-50 mt-1 w-full ${maxWidth} bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-center text-gray-500
            dark:bg-gray-800 dark:border-gray-700 dark:text-white`}
        >
          {emptyMessage}
        </div>
      )}
    </div>
  );
};

export default CustomSelector;
