import React, { forwardRef } from "react";
import PrintLayout from "../components/PrintLayout";
import PrintHeader from "../components/PrintHeader";
import PrintStudentInfo from "../components/PrintStudentInfo";

const th = {
  border: "1.5px solid #000",
  padding: "4px 2px",
  fontWeight: "bold",
  fontSize: "9px",
  textAlign: "center",
  backgroundColor: "#f3f4f6",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  lineHeight: "1.1",
};

const td = {
  border: "1px solid #333",
  padding: "4px 2px",
  fontSize: "9px",
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: "1.1",
};

const sectionTitle = {
  fontWeight: "bold",
  textTransform: "uppercase",
  fontSize: "10px",
  marginBottom: "4px",
  marginTop: "10px",
  letterSpacing: "0.5px",
};

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
          className={pageIndex < data.pages.length - 1 ? "page-break" : ""}
          style={{
            /* Adjusted for Portrait fit */
            padding: "20px 24px 20px 44px",
            fontFamily: "'Roboto', Arial, sans-serif",
            fontSize: "9px",
            backgroundColor: "white",
            color: "black",
            minHeight: "100vh",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PrintHeader
            collageName={data.collageName}
            heading="TRAINEE LEAVE RECORD"
          />

          <PrintStudentInfo data={data} yearRange={pageData.yearRange} />

          {/* ─── Attendance Details ─── */}
          <div style={sectionTitle}>Attendance Details</div>
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
                <th style={{ ...th, width: "16%" }}>Months</th>
                {pageData.months.map((month, i) => (
                  <th key={i} style={{ ...th, width: "7%", fontSize: "8px" }}>
                    {month.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Possible Days */}
              <tr>
                <td style={{ ...td, fontWeight: "bold", textAlign: "left", paddingLeft: "4px", fontSize: "8px" }}>
                  Possible Days
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} style={td}>
                    {pageData?.data[month]?.possibleDays || ""}
                  </td>
                ))}
              </tr>
              {/* Present Days */}
              <tr>
                <td style={{ ...td, fontWeight: "bold", textAlign: "left", paddingLeft: "4px", fontSize: "8px" }}>
                  Present Days
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} style={td}>
                    {pageData?.data[month]?.presentDays || ""}
                  </td>
                ))}
              </tr>
              {/* Sick Leave */}
              <tr>
                <td style={{ ...td, fontWeight: "bold", textAlign: "left", paddingLeft: "4px", fontSize: "8px" }}>
                  Sick Leave
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} style={td}>
                    {pageData?.data[month]?.sickLeave ?? ""}
                  </td>
                ))}
              </tr>
              {/* Casual Leave */}
              <tr>
                <td style={{ ...td, fontWeight: "bold", textAlign: "left", paddingLeft: "4px", fontSize: "8px" }}>
                  Casual Leave
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} style={td}>
                    {pageData?.data[month]?.casualLeave ?? ""}
                  </td>
                ))}
              </tr>
              {/* Percentage */}
              <tr style={{ backgroundColor: "#f0f4f8" }}>
                <td style={{ ...td, fontWeight: "bold", textAlign: "left", paddingLeft: "4px", fontSize: "8px" }}>
                  Percentage %
                </td>
                {pageData.months.map((month, i) => (
                  <td key={i} style={{ ...td, fontSize: "8px" }}>
                    {calculatePercentage(pageData?.data[month])}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* ─── Casual Leave Record ─── */}
          <div style={sectionTitle}>Casual Leave Record</div>
          <table
            style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              marginBottom: "10px",
              border: "1.5px solid #000",
            }}
          >
            <thead>
              <tr>
                {["Sr.", "Date", "Reason", "CI", "GI",
                  "Sr.", "Date", "Reason", "CI", "GI"].map(
                  (h, i) => <th key={i} style={{ ...th, fontSize: "8px" }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ height: "24px" }}>
                  <td style={td}>{12 - i}</td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}>{6 - i}</td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ─── Medical Leave Record ─── */}
          <div style={sectionTitle}>Medical Leave Record</div>
          <table
            style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              marginBottom: "10px",
              border: "1.5px solid #000",
            }}
          >
            <thead>
              <tr>
                {["Date", "From To", "Days", "Reason", "Order",
                  "Trai.", "Inst.", "G.I."].map((h, i) => (
                  <th key={i} style={{ ...th, fontSize: "8px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} style={{ ...td, height: "24px" }}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ─── Meeting with Parents ─── */}
          <div style={sectionTitle}>Meeting with Parents</div>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse",
            border: "1.5px solid #000",
          }}>
            <thead>
              <tr>
                {["Sr.", "Reason", "Report",
                  "Par.", "Ins.", "GI", "Pri."].map(
                  (h, i) => <th key={i} style={{ ...th, fontSize: "8px" }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td style={{ ...td, height: "24px" }}>{i + 1}</td>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} style={{ ...td, height: "24px" }}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </PrintLayout>
  );
});

export default TraineeLeaveRecordPrint;
