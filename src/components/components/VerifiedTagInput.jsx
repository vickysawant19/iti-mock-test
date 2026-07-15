import React, { useState, useEffect, useRef } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { questionService } from "@/services/question.service";

export default function VerifiedTagInput({
  value = [],
  onChange,
  placeholder = "Search and select tags...",
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Fetch tag suggestions from DB on mount and when searchQuery changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const results = await questionService.getAllTags(searchQuery);
        // Exclude tags that are already selected
        const filtered = results.filter((tag) => !value.includes(tag));
        setSuggestions(filtered);
      } catch (err) {
        console.error("Failed to load tag suggestions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce database queries on typing
    const timeout = setTimeout(fetchSuggestions, searchQuery ? 200 : 0);
    return () => clearTimeout(timeout);
  }, [searchQuery, value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag) => {
    if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const removeTag = (tagToRemove) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        addTag(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0 && searchQuery.trim() !== "") {
        // Fallback: If suggestions exist and searchQuery matches one exactly, add it
        const exactMatch = suggestions.find(
          (s) => s.toLowerCase() === searchQuery.trim().toLowerCase()
        );
        if (exactMatch) {
          addTag(exactMatch);
        }
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Selected Tags list */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-1 animate-fade-in">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold tracking-wide transition-all duration-200 hover:scale-102 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-500 hover:bg-red-500/10 rounded-full p-0.5 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-850 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 font-medium transition-all"
          placeholder={placeholder}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isDropdownOpen && (searchQuery.trim() !== "" || suggestions.length > 0) && (
        <div className="absolute z-[100] w-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
          {suggestions.length > 0 ? (
            <div className="p-1">
              {suggestions.map((suggestion, index) => {
                const isHighlighted = index === highlightedIndex;
                return (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addTag(suggestion)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                      isHighlighted
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span>{suggestion}</span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isHighlighted
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      Select
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="py-4 px-4 text-center text-xs font-medium text-slate-400 dark:text-slate-500 select-none">
              {isLoading ? "Searching tags..." : "No matching registered tags found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
