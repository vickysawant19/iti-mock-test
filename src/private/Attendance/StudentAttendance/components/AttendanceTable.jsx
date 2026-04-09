import React from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const getStatusClasses = (status) => {
  switch (status) {
    case "present":
      return "bg-emerald-50 text-emerald-600 border-emerald-200";
    case "absent":
      return "bg-rose-50 text-rose-600 border-rose-200";
    case "late":
      return "bg-amber-50 text-amber-600 border-amber-200";
    case "holiday":
      return "bg-amber-50 text-amber-600 border-amber-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
};

const getStatusDotColor = (status) => {
  switch (status) {
    case "present": return "bg-emerald-500";
    case "absent": return "bg-rose-500";
    case "late": return "bg-amber-500";
    case "holiday": return "bg-amber-500";
    default: return "bg-slate-400";
  }
};

const AttendanceTable = ({ attendanceRecords, holidays }) => {

  const allRecords = [];
  
  // Combine logic to show holidays in the table if they fall between min and max date of records
  // For simplicity based on prompt, let's just map the attendanceRecords (the user's design shows mostly attendance with some absent).
  
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
        <p className="text-slate-500 text-sm font-medium">No attendance data found for this period.</p>
      </div>
    );
  }

  // Sort by date desc
  const sortedRecords = [...attendanceRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse text-[13px] table-fixed min-w-[500px]">
        <colgroup>
           <col className="w-[100px]" />
           <col className="w-auto" />
           <col className="w-[100px]" />
           <col className="w-[110px]" />
        </colgroup>
        <thead>
          <tr>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">Date</th>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">Remarks</th>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">Time In</th>
            <th className="bg-[#f8fafc] dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold px-4 py-2.5 text-[11px] uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9] dark:divide-slate-800">
          {sortedRecords.map((record) => {
            const isHoliday = holidays?.has(record.date);
            const holidayText = holidays?.get(record.date);
            
            const dateObj = new Date(record.date);
            const dateFmt = format(dateObj, "dd MMM");
            const dayFmt = format(dateObj, "EEE");

            if (isHoliday) {
              return (
                <tr key={record.$id || record.date} className="hover:bg-[#fafbff] dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2.5 border-t border-[#f1f5f9] dark:border-slate-800">
                     <div className="font-bold text-[13px] text-slate-900 dark:text-white">{dateFmt}</div>
                     <div className="text-[10px] text-slate-400">{dayFmt}</div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 truncate">
                     {holidayText || "Public Holiday"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-500">—</td>
                  <td className="px-4 py-2.5">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusClasses("holiday")}`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor("holiday")}`} />
                       Holiday
                     </span>
                  </td>
                </tr>
              );
            }

            return (
               <tr key={record.$id || record.date} className="hover:bg-[#fafbff] dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-2.5 border-t border-[#f1f5f9] dark:border-slate-800">
                     <div className="font-bold text-[13px] text-slate-900 dark:text-white">{dateFmt}</div>
                     <div className="text-[10px] text-slate-400">{dayFmt}</div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300 truncate">
                     {record.remarks || "-"}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-slate-500 truncate">
                     {record.$updatedAt ? format(new Date(record.$updatedAt), "h:mm a") : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                     <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${getStatusClasses(record.status)}`}>
                       <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getStatusDotColor(record.status)}`} />
                       <span className="capitalize">{record.status}</span>
                     </span>
                  </td>
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
