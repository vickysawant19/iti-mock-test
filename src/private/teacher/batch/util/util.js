import { addMonths, differenceInMonths, format } from "date-fns";

export const getMonthsArray = (
  startDate,
  endDate,
  formatStr = "MMM yy",
  baseMultiple = 12
) => {
  // Ensure we have Date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate number of months between dates (including both start and end months)
  let monthDiff = differenceInMonths(end, start) + 1;

  // Round up to the nearest multiple of baseMultiple (default 12)
  monthDiff = Math.ceil(monthDiff / baseMultiple) * baseMultiple;

  // Generate array of month names
  return Array.from({ length: monthDiff }, (_, i) => {
    const date = addMonths(start, i);
    return format(date, formatStr);
  });
};
