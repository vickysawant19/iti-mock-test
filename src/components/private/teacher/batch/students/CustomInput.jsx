import React, { forwardRef } from "react";

// Helper component for form inputs
const CustomInput = forwardRef(
  ({ label, type, extraclass, required, error, ...rest }, ref) => (
    <div className={`${extraclass || ""}`}>
      <label className="block text-gray-600 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        ref={ref}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
        {...rest}
      />
      {error && (
        <p className="mt-1 text-red-500 text-sm dark:text-red-400">{error}</p>
      )}
    </div>
  )
);

export default CustomInput;
