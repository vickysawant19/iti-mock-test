import React, { useState } from "react";
import { FaArrowDown, FaChevronDown, FaChevronUp } from "react-icons/fa";

const CustomSelect = ({ icon, options, value, onChangeFunc }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleOptionClick = (option) => {
    setSelectedValue(option);
    setIsOpen(false);

    onChangeFunc(option);
  };

  return (
    <div className="relative rounded-xl mr-2">
      {/* Dropdown Button */}
      <button
        type="button"
        className="mb-4 p-2 border rounded-sm bg-white dark:bg-gray-800 flex gap-2 items-center justify-between w-full text-left capitalize px-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-500 dark:text-gray-400">{icon}</span>
        <span className="text-gray-800 dark:text-gray-100">
          {selectedValue}
        </span>
        <span
          className={`transition-transform duration-300 transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          {isOpen ? <FaChevronDown /> : <FaChevronDown />}
        </span>
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <ul className="absolute bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-sm w-full mt-1 z-10 capitalize">
          {options.map((option) => (
            <li
              key={option}
              className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
              onClick={(e) => {
                handleOptionClick(option);
              }}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomSelect;
