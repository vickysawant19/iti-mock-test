import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming shadcn's utility function is available

/**
 * CustomSelectData with shadcn styling and dark mode support
 * @param {Object} props
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
                className={cn(
                  "flex items-center px-3 py-2 cursor-pointer",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground hover:text-foreground",
                  "dark:text-slate-200 dark:hover:bg-slate-800"
                )}
                onClick={() => handleSelectOption(opt)}
              >
                <div className="flex items-center flex-1">
                  {opt[iconKey] && (
                    <span className="mr-2 text-muted-foreground dark:text-slate-400">
                      {opt[iconKey]}
                    </span>
                  )}
                 
                 { getOptionLabel(opt)}
                </div>
                {isSelected && (
                  <Check size={16} className="text-primary dark:text-primary" />
                )}
              </li>
            );
          })
        ) : (
          <li className="px-3 py-2 text-sm text-muted-foreground dark:text-slate-400">
            No options found
          </li>
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
    <div className={cn("relative w-full", className)} ref={selectRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground dark:text-slate-200 mb-1">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex items-center justify-between w-full p-2.5 px-3 rounded-md cursor-pointer",
          "border transition-colors",
          "bg-background dark:bg-slate-900",
          disabled
            ? "bg-muted cursor-not-allowed dark:bg-slate-800"
            : "hover:border-primary/50 dark:hover:border-primary/50",
          error ? "border-destructive" : "border-input dark:border-slate-700",
          isOpen
            ? "border-primary ring-2 ring-primary/20 dark:ring-primary/20"
            : ""
        )}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        role="combobox"
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption[iconKey] && (
                <span className="mr-2 text-muted-foreground dark:text-slate-400">
                  {selectedOption[iconKey]}
                </span>
              )}
              <span className="truncate dark:text-slate-200">
               {getOptionLabel(selectedOption)}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground dark:text-slate-400">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center">
          {clearable && selectedOption && (
            <button
              type="button"
              className="p-1 mr-1 text-muted-foreground hover:text-foreground dark:text-slate-400 dark:hover:text-slate-200"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={18}
            className={cn(
              "text-muted-foreground dark:text-slate-400 transition-transform duration-200",
              isOpen ? "transform rotate-180" : ""
            )}
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive dark:text-red-400">
          {error}
        </p>
      )}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 rounded-md shadow-lg border border-input bg-popover dark:bg-slate-900 dark:border-slate-700">
          {options.length > 8 && (
            <div className="sticky top-0 p-2 bg-background dark:bg-slate-900 border-b border-input dark:border-slate-700">
              <input
                type="text"
                className="w-full p-2 text-sm rounded-sm bg-background dark:bg-slate-800 border border-input dark:border-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
