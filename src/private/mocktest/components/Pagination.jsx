import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Function to generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);

      // Add ellipsis or pages near current
      if (currentPage > 3) {
        pageNumbers.push("...");
      }

      // Add pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis if needed
      if (currentPage < totalPages - 2) {
        pageNumbers.push("...");
      }

      // Always include last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-1 sm:gap-1.5 py-2 flex-wrap">
      {/* Previous page button */}
      {currentPage > 1 && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200"
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Page numbers */}
      {pageNumbers.map((page, index) =>
        page === "..." ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 py-1 text-xs text-slate-400 dark:text-slate-500"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className={`h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg text-xs font-bold ${
              currentPage === page
                ? "bg-indigo-600 dark:bg-indigo-600 text-white shadow-2xs"
                : "border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      {/* Next page button */}
      {currentPage < totalPages && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 sm:h-8.5 sm:w-8.5 rounded-lg border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default Pagination;
