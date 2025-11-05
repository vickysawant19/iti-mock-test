import React from "react";
import { ClipLoader } from "react-spinners";

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <ClipLoader size={50} color={"#4F46E5"} loading={true} />
    </div>
  );
};

export default LoadingSpinner;
