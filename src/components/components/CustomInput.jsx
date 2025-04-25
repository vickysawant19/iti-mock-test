import React, { forwardRef } from "react";

const CustomInput = forwardRef(
  ({ label, extraclass, required, ...props }, ref) => {
    return (
      <div className={extraclass}>
        <label className="block text-gray-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
          {...props}
        />
      </div>
    );
  }
);

export default CustomInput;
