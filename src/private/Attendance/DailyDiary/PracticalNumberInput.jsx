import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export function PracticalNumberInput({ value, onChange, placeholder, disabled, className }) {
  const [inputValue, setInputValue] = useState("");
  
  // Cleanly establish the numbers list safely checking type.
  const numbers = typeof value === "string" 
      ? value.split(",").map(v => v.trim()).filter(Boolean) 
      : Array.isArray(value) ? value : [];

  const addNumber = () => {
    const val = inputValue.trim().replace(/,/g, '');
    if (!val) return;
    
    // Check duplicates before inserting to block duplicate entries natively
    if (!numbers.includes(val)) {
      const newNumbers = [...numbers, val];
      onChange(newNumbers.join(", "));
    }
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    // Intercept delimiters directly and flush entry instantly
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addNumber();
    } else if (e.key === 'Backspace' && !inputValue && numbers.length > 0) {
      e.preventDefault();
      // Remove last tag safely when user presses backspace in an empty textbox
      const newNumbers = [...numbers];
      newNumbers.pop();
      onChange(newNumbers.join(", "));
    }
  };

  const removeNumber = (indexToRemove) => {
    const newNumbers = numbers.filter((_, idx) => idx !== indexToRemove);
    onChange(newNumbers.join(", "));
  };

  return (
    <div className={`flex flex-wrap gap-1 p-1 border rounded-md bg-transparent min-h-[40px] items-center focus-within:ring-1 focus-within:ring-ring ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ""}`}>
      {numbers.map((num, idx) => (
        <span key={idx} className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 rounded-md transition-all">
          {num}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeNumber(idx)}
              className="hover:text-green-900 dark:hover:text-green-200 focus:outline-none flex items-center justify-center p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addNumber}
          className="flex-1 border-0 bg-transparent ring-0 focus-visible:ring-0 shadow-none p-1 min-w-[30px] h-7 text-sm"
          placeholder={numbers.length === 0 ? placeholder : ""}
        />
      )}
    </div>
  );
}
