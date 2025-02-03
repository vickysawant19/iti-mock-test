import React from 'react';

const Pagination = ({ currentPage, onPageChange }) => {
  const pageNumbers = [];
  
  // Generate page numbers (you can adjust the logic to show more pages if needed)
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handlePageClick = (page) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex justify-center mt-4">
      <ul className="flex space-x-2">
        {pageNumbers.map((page) => (
          <li
            key={page}
            onClick={() => handlePageClick(page)}
            className={`cursor-pointer px-4 py-2 rounded-full text-sm ${
              page === currentPage
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {page}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Pagination;
