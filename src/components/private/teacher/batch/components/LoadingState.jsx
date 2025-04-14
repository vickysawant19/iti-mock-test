import React from "react";
import { ClipLoader } from "react-spinners";

const LoadingState = ({ size = 40, color = "#2563eb", fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <ClipLoader size={size} color={color} loading={true} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <ClipLoader size={size} color={color} loading={true} />
    </div>
  );
};

export default LoadingState;
