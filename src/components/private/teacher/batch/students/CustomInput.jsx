import React, { forwardRef } from "react";

// Helper component for form inputs
const CustomInput = forwardRef(
  ({ label, type, extraclass, required, error, ...rest }, ref) => (
    <div className={`${extraclass || ""}`}>
      <label className="block text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        ref={ref}
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"
        {...rest}
      />
      {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
    </div>
  )
);

export default CustomInput;
