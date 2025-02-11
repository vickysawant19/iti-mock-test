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
      <button
        type="button"
        className="mb-4 p-2 border rounded bg-white flex gap-2 items-center justify-between w-full text-left capitalize px-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-500">{icon}</span>
        {selectedValue}
        <span
          className={`transition-transform duration-300 transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          {isOpen ? <FaChevronDown /> : <FaChevronDown />}
        </span>
      </button>
      {isOpen && (
        <ul className="absolute bg-white border rounded w-full mt-1 z-10 capitalize">
          {options.map((option) => (
            <li
              key={option}
              className="p-2 cursor-pointer hover:bg-gray-200"
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
