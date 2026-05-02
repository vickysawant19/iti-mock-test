import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { highlightAbsentRow } from './diaryAbsentHighlight';
import { DEFAULT_PRINT_CONFIG } from './PrintConfigModal';

const DailyDiaryPrintTemplate = forwardRef((
  {
    monthDays,
    diaryData,
    holidays,
    attendance,
    profile,
    batchData,
    currentMonth,
    collegeName,
    tradeName,
    printConfig = DEFAULT_PRINT_CONFIG,
  },
  ref
) => {
  const cfg = printConfig;

  let totalTheoryHours    = 0;
  let totalPracticalHours = 0;
  let totalCombinedHours  = 0;

  // Build col widths: only for visible cols
  // We'll use a simple approach — just render <col> spans dynamically

  return (
    <div style={{ display: 'none' }}>
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
          <h1 className="text-2xl font-bold uppercase">{collegeName || 'INDUSTRIAL TRAINING INSTITUTE'}</h1>
          <h2 className="text-xl font-semibold mt-1">Trade: {tradeName || 'N/A'}</h2>
          <h3 className="text-lg mt-1 font-medium">Month: {format(currentMonth, 'MMMM - yyyy')}</h3>
        </div>

        <div className="flex justify-between mb-4 font-bold text-sm px-2">
          <div>Instructor Name: {profile?.userName?.toUpperCase() || ''}</div>
          <div>Batch: {batchData?.BatchName || ''}</div>
        </div>

        <table className="w-full border-collapse border border-black text-[11px] text-center">
          <thead>
            <tr className="bg-gray-100 font-bold border-b border-black">
              {cfg.srNo           && <th className="border border-black p-1.5 w-8">Sr</th>}
              <th className="border border-black p-1.5 w-20">Date</th>
              {cfg.day            && <th className="border border-black p-1.5 w-12">Day</th>}
              {cfg.theoryTopic    && <th className="border border-black p-1.5">Theory Topic</th>}
              {cfg.theoryHours    && <th className="border border-black p-1.5 w-10">T.Hrs</th>}
              {cfg.practicalTopic && <th className="border border-black p-1.5">Practical Topic</th>}
              {cfg.practicalNos   && <th className="border border-black p-1.5 w-14">Pract. No.</th>}
              {cfg.practicalHours && <th className="border border-black p-1.5 w-10">P.Hrs</th>}
              {cfg.combinedHours  && <th className="border border-black p-1.5 w-10">Hours</th>}
              {cfg.extraWork      && <th className="border border-black p-1.5">Extra Work</th>}
              {cfg.remarks        && <th className="border border-black p-1.5 w-16">Remarks</th>}
              {cfg.instrSign      && <th className="border border-black p-1.5 w-20">Instr. Sign</th>}
            </tr>
          </thead>
          <tbody>
            {monthDays?.map((day, idx) => {
              const dateKey   = format(day, 'yyyy-MM-dd');
              const entry     = diaryData[dateKey] || {};
              const isHoliday = holidays.has(dateKey);
              const isAbsent  = highlightAbsentRow(attendance.get(dateKey));

              let theory    = entry.theoryWork    || '';
              let practical = entry.practicalWork  || '';
              let practNos  = Array.isArray(entry.practicalNumbers)
                ? entry.practicalNumbers.join(', ')
                : (entry.practicalNumbers || '');
              let extra     = entry.extraWork || '';
              let remarks   = entry.remarks   || '';

              let theoryHrs    = 0;
              let practicalHrs = 0;

              if (isHoliday) {
                const hlabel = 'Holiday: ' + (holidays.get(dateKey)?.holidayText || '');
                theory    = hlabel;
                practical = '-';
                extra     = '';
                remarks   = 'Holiday';
                practNos  = '';
              } else if (isAbsent) {
                theory    = 'Absent';
                practical = 'Absent';
                extra     = '';
                remarks   = 'Absent';
                practNos  = '';
              } else {
                if (theory.trim().length > 0)    theoryHrs    = 2;
                if (practical.trim().length > 0) practicalHrs = 5;
              }

              totalTheoryHours    += theoryHrs;
              totalPracticalHours += practicalHrs;
              totalCombinedHours  += theoryHrs + practicalHrs;

              const combinedHrs = theoryHrs + practicalHrs;
              const dayLabel    = format(day, 'EEE'); // Mon, Tue...

              return (
                <tr key={dateKey} className="border-b border-black">
                  {cfg.srNo           && <td className="border border-black p-1.5">{idx + 1}</td>}
                  <td className="border border-black p-1.5">{format(day, 'dd-MMM-yy')}</td>
                  {cfg.day            && <td className="border border-black p-1.5">{dayLabel}</td>}
                  {cfg.theoryTopic    && <td className="border border-black p-1.5 text-left">{theory}</td>}
                  {cfg.theoryHours    && <td className="border border-black p-1.5">{theoryHrs > 0 ? theoryHrs : '-'}</td>}
                  {cfg.practicalTopic && <td className="border border-black p-1.5 text-left">{practical}</td>}
                  {cfg.practicalNos   && <td className="border border-black p-1.5 text-left">{practNos}</td>}
                  {cfg.practicalHours && <td className="border border-black p-1.5">{practicalHrs > 0 ? practicalHrs : '-'}</td>}
                  {cfg.combinedHours  && <td className="border border-black p-1.5">{combinedHrs > 0 ? combinedHrs : '-'}</td>}
                  {cfg.extraWork      && <td className="border border-black p-1.5 text-left">{extra}</td>}
                  {cfg.remarks        && <td className="border border-black p-1.5 text-left">{remarks}</td>}
                  {cfg.instrSign      && <td className="border border-black p-1.5"></td>}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Footer Totals */}
        <div className="flex justify-end gap-10 mt-4 pr-4 font-bold text-sm flex-wrap">
          {cfg.theoryHours && !cfg.combinedHours && (
            <div>Total Theory Hours: {totalTheoryHours}</div>
          )}
          {cfg.practicalHours && !cfg.combinedHours && (
            <div>Total Practical Hours: {totalPracticalHours}</div>
          )}
          {cfg.combinedHours && (
            <div>Total Hours: {totalCombinedHours}</div>
          )}
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

DailyDiaryPrintTemplate.displayName = 'DailyDiaryPrintTemplate';
export default DailyDiaryPrintTemplate;
