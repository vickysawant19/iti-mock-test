import React from "react";
import { format } from "date-fns";
import { Clock, CheckCircle, XCircle } from "lucide-react";

const getStatusColor = (status) => {
  switch (status) {
    case "present":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
    case "absent":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
    case "late":
      return "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30";
    default:
      return "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800";
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case "present":
      return <CheckCircle size={16} />;
    case "absent":
      return <XCircle size={16} />;
    case "late":
      return <Clock size={16} />;
    default:
      return null;
  }
};

const AttendanceCard = ({ record, isHoliday, holidayText }) => {
  if (isHoliday) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-slate-900 dark:text-white">
            {format(new Date(record.date), "dd MMM yyyy")}
          </p>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Holiday
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 italic">
          {holidayText || "Public Holiday"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-slate-900 dark:text-white">
          {format(new Date(record.date), "dd MMM yyyy")}
        </p>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
          {getStatusIcon(record.status)}
          <span className="capitalize">{record.status}</span>
        </span>
      </div>
      
      {record.remarks && (
        <div className="text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">
          <p className="font-medium mb-1">Remarks:</p>
          <p>{record.remarks}</p>
        </div>
      )}
      <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span>Marked At: {record.$updatedAt ? format(new Date(record.$updatedAt), "hh:mm a") : "-"}</span>
      </div>
    </div>
  );
};

export default AttendanceCard;
