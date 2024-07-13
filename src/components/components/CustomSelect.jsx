import React, { useState } from "react";

const CustomSelect = ({ options, value, onChangeFunc }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  const handleOptionClick = (option) => {
    setSelectedValue(option);
    setIsOpen(false);

    onChangeFunc(option);
  };

  return (
    <div className="relative w-24 rounded-xl mr-2">
      <button
        type="button"
        className="mb-4 p-2 border rounded bg-white w-full text-left capitalize"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValue}
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
