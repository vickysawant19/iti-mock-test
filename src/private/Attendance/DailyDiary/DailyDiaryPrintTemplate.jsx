import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { highlightAbsentRow } from './diaryAbsentHighlight';

const DailyDiaryPrintTemplate = forwardRef(({
  monthDays,
  diaryData,
  holidays,
  attendance,
  profile,
  batchData,
  currentMonth,
  collegeName,
  tradeName
}, ref) => {
  let totalTheoryHours = 0;
  let totalPracticalHours = 0;

  return (
    <div style={{ display: "none" }}>
      <div ref={ref} className="print-container p-8 bg-white text-black w-[210mm] mx-auto">
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 12mm; }
            body { -webkit-print-color-adjust: exact; margin: 0; background: white; }
            table { page-break-inside: auto; border-collapse: collapse; width: 100%; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            .print-container { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          `}
        </style>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase">{collegeName || "INDUSTRIAL TRAINING INSTITUTE"}</h1>
          <h2 className="text-xl font-semibold mt-1">Trade: {tradeName || "N/A"}</h2>
          <h3 className="text-lg mt-1 font-medium">Month: {format(currentMonth, "MMMM - yyyy")}</h3>
        </div>

        <div className="flex justify-between mb-4 font-bold text-sm px-2">
          <div>Instructor Name: {profile?.userName?.toUpperCase() || ""}</div>
          <div>Batch: {batchData?.BatchName || ""}</div>
        </div>

        <table className="w-full border-collapse border border-black text-[11px] text-center">
          <thead>
            <tr className="bg-gray-100 font-bold border-b border-black">
              <th className="border border-black p-1.5 w-10">Sr No</th>
              <th className="border border-black p-1.5 w-20">Date</th>
              <th className="border border-black p-1.5">Theory Topic</th>
              <th className="border border-black p-1.5 w-12">Hours</th>
              <th className="border border-black p-1.5">Practical Topic</th>
              <th className="border border-black p-1.5 w-12">Hours</th>
              <th className="border border-black p-1.5 w-24">Instructor Sign</th>
            </tr>
          </thead>
          <tbody>
            {monthDays?.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const entry = diaryData[dateKey] || {};
              const isHoliday = holidays.has(dateKey);
              const isAbsent = highlightAbsentRow(attendance.get(dateKey));

              let theory = entry.theoryWork || "";
              let practical = entry.practicalWork || "";
              
              let theoryHours = 0;
              let practicalHours = 0;

              if (isHoliday) {
                theory = "Holiday: " + (holidays.get(dateKey)?.holidayText || "");
                practical = "-";
              } else if (isAbsent) {
                theory = "Absent";
                practical = "Absent";
              } else {
                 if (theory.trim().length > 0) {
                    theoryHours = 2;
                 }
                 if (practical.trim().length > 0) {
                    practicalHours = 5;
                 }
              }
              
              totalTheoryHours += theoryHours;
              totalPracticalHours += practicalHours;

              return (
                <tr key={dateKey} className="border-b border-black">
                  <td className="border border-black p-1.5">{idx + 1}</td>
                  <td className="border border-black p-1.5">{format(day, "dd-MMM-yy")}</td>
                  <td className="border border-black p-1.5 text-left">{theory}</td>
                  <td className="border border-black p-1.5">{theoryHours > 0 ? theoryHours : "-"}</td>
                  <td className="border border-black p-1.5 text-left">{practical}</td>
                  <td className="border border-black p-1.5">{practicalHours > 0 ? practicalHours : "-"}</td>
                  <td className="border border-black p-1.5"></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Totals */}
        <div className="flex justify-end gap-12 mt-4 pr-32 font-bold text-sm">
          <div>Total Theory Hours: {totalTheoryHours}</div>
          <div>Total Practical Hours: {totalPracticalHours}</div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-24 px-8 font-bold text-sm">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            Group Instructor Sign
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-black mb-2"></div>
            Principal Sign
          </div>
        </div>
      </div>
    </div>
  );
});

export default DailyDiaryPrintTemplate;
