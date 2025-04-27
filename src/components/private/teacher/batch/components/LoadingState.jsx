import React from "react";
import { ClipLoader } from "react-spinners";

const LoadingState = ({ size = 40, color = "#2563eb", fullPage = false }) => {
  const loaderColor = color || (fullPage ? "#2563eb" : "#2563eb");

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-white dark:bg-gray-900">
        <ClipLoader size={size} color={loaderColor} loading={true} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-white dark:bg-gray-800">
      <ClipLoader size={size} color={loaderColor} loading={true} />
    </div>
  );
};

export default LoadingState;
