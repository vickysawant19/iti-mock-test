import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ChevronDown, Check, X } from "lucide-react";

/**
 * CustomSelectData
 * @param {Object} props
 * // ...props JSDoc omitted for brevity
 */
function CustomSelectData({
  label,
  options = [],
  value = null,
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

  // Memoized selected option lookup
  const selectedOption = useMemo(
    () => options.find((opt) => opt?.[valueKey] === value?.[valueKey]),
    [options, value, valueKey]
  );

  // Memoized filtered options
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return options.filter((opt) => {
      const text = String(opt[labelKey] || "").toLowerCase();
      return text.includes(term);
    });
  }, [options, searchTerm, labelKey]);

  // Handlers
  const handleSelectOption = useCallback(
    (opt) => {
      onChange(opt);
      setSearchTerm("");
      setIsOpen(false);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  const toggleDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  const getOptionLabel = useCallback(
    (opt) => (renderOptionLabel ? renderOptionLabel(opt) : opt[labelKey]),
    [renderOptionLabel, labelKey]
  );

  // Close on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Memoize option list rendering
  const renderOptions = useMemo(
    () => (
      <ul className="py-1 overflow-y-auto max-h-60" role="listbox">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((opt) => {
            const isSelected = opt[valueKey] === value?.[valueKey];
            return (
              <li
                key={opt[valueKey]}
                role="option"
                aria-selected={isSelected}
                className={`flex items-center px-3 py-2 cursor-pointer ${
                  isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"
                }`}
                onClick={() => handleSelectOption(opt)}
              >
                <div className="flex items-center flex-1">
                  {opt[iconKey] && (
                    <span className="mr-2 text-gray-500">{opt[iconKey]}</span>
                  )}
                  {getOptionLabel(opt)}
                </div>
                {isSelected && <Check size={16} className="text-blue-600" />}
              </li>
            );
          })
        ) : (
          <li className="px-3 py-2 text-sm text-gray-500">No options found</li>
        )}
      </ul>
    ),
    [
      filteredOptions,
      value,
      valueKey,
      iconKey,
      handleSelectOption,
      getOptionLabel,
    ]
  );

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
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

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
          {renderOptions}
        </div>
      )}
    </div>
  );
}

export default React.memo(CustomSelectData);
