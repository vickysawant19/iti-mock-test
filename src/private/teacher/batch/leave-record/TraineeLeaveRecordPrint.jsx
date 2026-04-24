import React, { forwardRef } from "react";
import PrintLayout from "../components/PrintLayout";
import PrintHeader from "../components/PrintHeader";
import PrintStudentInfo from "../components/PrintStudentInfo";

/* ─── Shared table cell styles ─── */
const thClass = "border-2 border-black font-bold px-1.5 py-1 text-center bg-gray-100 align-middle text-sm leading-tight";
const tdClass = "border border-gray-800 px-1.5 py-1 text-center align-middle text-sm leading-tight";
const sectionTitleClass = "font-bold text-center uppercase mb-1.5 mt-2.5 text-base tracking-wide text-black";

const calculatePercentage = (attendanceData) => {
  if (!attendanceData || !attendanceData.possibleDays) return "-";
  const pct = (attendanceData.presentDays / attendanceData.possibleDays) * 100;
  return isNaN(pct) ? "-" : `${Math.round(pct)}%`;
};

/**
 * TraineeLeaveRecordPrint (HTML version)
 * Replaces old @react-pdf/renderer TranieeLeaveRecordPDF.
 * Now using A4 Portrait as requested.
 */
const TraineeLeaveRecordPrint = forwardRef(function TraineeLeaveRecordPrint(
  { data },
  ref
) {
  if (!data) return null;

  return (
    <PrintLayout ref={ref} pageSize="a4" orientation="portrait">
      {data?.pages?.map((pageData, pageIndex) => (
        <div
          key={pageIndex}
          className={`w-full h-full bg-white text-black box-border p-4 ${
            pageIndex < data.pages.length - 1 ? "page-break" : ""
          }`}
          style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
        >
          {/* Thick outer frame */}
          <div className="h-full border-[3px] border-black flex flex-col pt-4 px-6 pb-4 box-border">
          <PrintHeader
            collageName={data.collageName}
            heading="TRAINEE LEAVE RECORD"
          />

          <PrintStudentInfo data={data} yearRange={pageData.yearRange} />

          {/* ─── Attendance Details ─── */}
          <div className={sectionTitleClass}>Attendance Details</div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              marginBottom: "10px",
              border: "1.5px solid #000",
            }}
          >
            <thead>
              <tr>
                <th className={`${thClass} w-[16%]`}>Months</th>
                {pageData.months.map((month, i) => (
                  <th key={i} className={`${thClass} w-[7%] text-xs`}>
                    {month.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Possible Days */}
              <tr>
                <td className={`${tdClass} font-bold text-left pl-1 text-xs`}>
                  Possible Days
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} className={tdClass}>
                    {pageData?.data[month]?.possibleDays || ""}
                  </td>
                ))}
              </tr>
              {/* Present Days */}
              <tr>
                <td className={`${tdClass} font-bold text-left pl-1 text-xs`}>
                  Present Days
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} className={tdClass}>
                    {pageData?.data[month]?.presentDays || ""}
                  </td>
                ))}
              </tr>
              {/* Sick Leave */}
              <tr>
                <td className={`${tdClass} font-bold text-left pl-1 text-xs`}>
                  Sick Leave
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} className={tdClass}>
                    {pageData?.data[month]?.sickLeave ?? ""}
                  </td>
                ))}
              </tr>
              {/* Casual Leave */}
              <tr>
                <td className={`${tdClass} font-bold text-left pl-1 text-xs`}>
                  Casual Leave
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} className={tdClass}>
                    {pageData?.data[month]?.casualLeave ?? ""}
                  </td>
                ))}
              </tr>
              {/* Percentage */}
              <tr style={{ backgroundColor: "#f0f4f8" }}>
                <td className={`${tdClass} font-bold text-left pl-1 text-xs`}>
                  Percentage %
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} className={`${tdClass} text-xs`}>
                    {calculatePercentage(pageData?.data[month])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* ─── Casual Leave Record ─── */}
          <div className={sectionTitleClass}>Casual Leave Record</div>
          <table className="w-full border-collapse mb-2 border-[1.5px] border-black">
            <thead>
              <tr>
                {["Sr.", "Date", "Reason", "CI", "GI",
                  "Sr.", "Date", "Reason", "CI", "GI"].map(
                  (h, i) => <th key={i} className={`${thClass} text-xs`}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="h-[26px]">
                  <td className={tdClass}>{12 - i}</td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                  <td className={tdClass}>{6 - i}</td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ─── Medical Leave Record ─── */}
          <div className={sectionTitleClass}>Medical Leave Record</div>
          <table className="w-full border-collapse mb-2 border-[1.5px] border-black">
            <thead>
              <tr>
                {["Date", "From To", "Days", "Reason", "Order",
                  "Trai.", "Inst.", "G.I."].map((h, i) => (
                  <th key={i} className={`${thClass} text-xs`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className={`${tdClass} h-[26px]`}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ─── Meeting with Parents ─── */}
          <div className={sectionTitleClass}>Meeting with Parents</div>
          <table className="w-full border-collapse border-[1.5px] border-black">
            <thead>
              <tr>
                {["Sr.", "Reason", "Report",
                  "Par.", "Ins.", "GI", "Pri."].map(
                  (h, i) => <th key={i} className={`${thClass} text-xs`}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className={`${tdClass} h-[26px]`}>{i + 1}</td>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className={`${tdClass} h-[26px]`}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      ))}
    </PrintLayout>
  );
});

export default TraineeLeaveRecordPrint;
