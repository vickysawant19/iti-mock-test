import React from "react";
import { Calendar } from "lucide-react";

const EmptyState = ({ message }) => {
  return (
    <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow">
      <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-2" />
      <p className="text-lg">{message}</p>
    </div>
  );
};

export default EmptyState;
