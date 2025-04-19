import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * CustomSelectData - A customizable dropdown select component with dynamic keys support
 * 
 * @param {Object} props
 * @param {string} props.label - Label for the select field
 * @param {Array} props.options - Array of option objects
 * @param {any} props.value - Currently selected value object
 * @param {Function} props.onChange - Callback function when selection changes
 * @param {string} props.placeholder - Placeholder text when no option is selected
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {boolean} props.clearable - Whether the selected option can be cleared
 * @param {string} props.error - Error message to display
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.valueKey - Key to use for option values (default: "value")
 * @param {string} props.labelKey - Key to use for option labels (default: "label")
 * @param {string} props.iconKey - Key to use for option icons (default: "icon")
 * @param {Function} props.renderOptionLabel - Custom function to render option label (receives option object)
 */
export default function CustomSelectData({
  label,
  options = [],
  value = {},
  onChange,
  placeholder = "Select an option",
  disabled = false,
  clearable = false,
  error,
  className = "",
  valueKey = "value",
  labelKey = "label",
  iconKey = "icon",
  renderOptionLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);
  
  // Find the currently selected option
  const selectedOption = options.find(option => option?.[valueKey] === value?.[valueKey]);

  // Filter options based on search term - use either custom renderer or standard label for search
  const filteredOptions = options.filter(option => {
    const searchText = renderOptionLabel 
      ? String(renderOptionLabel(option)).toLowerCase() 
      : String(option[labelKey] || '').toLowerCase();
    return searchText.includes(searchTerm.toLowerCase());
  });
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle option selection
  const handleSelectOption = (option) => {
    onChange(option);
    setSearchTerm("");
    setIsOpen(false);
  };
  
  // Handle clearing the selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Get the displayed label for an option
  const getOptionLabel = (option) => {
    if (renderOptionLabel) {
      return renderOptionLabel(option);
    }
    return option[labelKey];
  };
  
  return (
    <div className={`relative w-full ${className}`} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div
        className={`flex items-center justify-between w-full p-2.5 px-3 bg-white border rounded-md cursor-pointer ${
          disabled ? "bg-gray-100 cursor-not-allowed" : "hover:border-blue-500"
        } ${error ? "border-red-500" : "border-gray-300"} ${
          isOpen ? "border-blue-500 ring-2 ring-blue-100" : ""
        }`}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        role="combobox"
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption[iconKey] && (
                <span className="mr-2 text-gray-500">
                  {selectedOption[iconKey]}
                </span>
              )}
              <span className="truncate">{getOptionLabel(selectedOption)}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        
        <div className="flex items-center">
          {clearable && selectedOption && (
            <button
              type="button"
              className="p-1 mr-1 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown 
            size={18} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`} 
          />
        </div>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {options.length > 8 && (
            <div className="sticky top-0 p-2 bg-white border-b border-gray-100">
              <input
                type="text"
                className="w-full p-2 text-sm border border-gray-300 rounded"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          
          <ul 
            className="py-1 overflow-y-auto max-h-60" 
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option[valueKey]}
                  className={`flex items-center px-3 py-2 cursor-pointer ${
                    option[valueKey] === value?.[valueKey]
                      ? "bg-blue-50 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectOption(option)}
                  role="option"
                  aria-selected={option[valueKey] === value?.[valueKey]}
                >
                  <div className="flex items-center flex-1">
                    {option[iconKey] && (
                      <span className="mr-2 text-gray-500">{option[iconKey]}</span>
                    )}
                    {getOptionLabel(option)}
                  </div>
                  
                  {option[valueKey] === value?.[valueKey] && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-gray-500">
                No options found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}