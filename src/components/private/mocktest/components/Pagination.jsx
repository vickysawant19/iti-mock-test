import React from 'react'

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
    <div className="flex justify-center gap-2 mb-6 flex-wrap">
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          className={`px-4 py-2 rounded-md transition-colors ${
            currentPage === index + 1
              ? 'bg-blue-950 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => onPageChange(index + 1)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );

export default Pagination