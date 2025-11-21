import { format } from "date-fns";

export const calculateTotalAttendance = (monthlyRecordArray) => {
  if (!monthlyRecordArray || monthlyRecordArray.length === 0) {
    return "-";
  }

  let totalPresentDays = 0;
  let totalDays = 0;

  // Loop through all month records and accumulate the days
  monthlyRecordArray.forEach(([month, record]) => {
    // Only count months where record exists and has attendance data
    if (
      record &&
      typeof record.presentDays === "number" &&
      typeof record.absentDays === "number"
    ) {
      totalPresentDays += record.presentDays;
      totalDays += record.presentDays + record.absentDays;
    }
  });

  // Calculate overall percentage if we have any days to count
  if (totalDays === 0) {
    return "-"; // No attendance data available
  }

  const overallPercentage = (totalPresentDays / totalDays) * 100;
  return overallPercentage.toFixed(2) + "%";
};

export const calculateAverage = (monthlyRecordArray, key, outoff) => {
  if (!monthlyRecordArray || monthlyRecordArray.length === 0) {
    return "-";
  }

  let total = 0;
  let count = 0;

  // Loop through all month records and accumulate the days
  monthlyRecordArray.forEach(([month, record]) => {
    // Only count months where record exists and has attendance data
    if (record && record[key]) {
      total += parseInt(record[key]);
      count += 1;
    }
  });

  // Calculate overall percentage if we have any days to count
  if (total === 0) {
    return "-"; // No attendance data available
  }

  const overallPercentage = (total / (count * outoff)) * 100;
  return overallPercentage.toFixed(2) + "%";
};

export const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy");
  } catch {
    return "-";
  }
};
