import React, { forwardRef } from "react";
import PrintLayout from "../../components/PrintLayout";
import PrintHeader from "../../components/PrintHeader";
import PrintStudentInfo from "../../components/PrintStudentInfo";

/* ─── Design tokens ─── */
const ACCENT = "#1a3a5c";       // deep navy
const ACCENT_LIGHT = "#e8f0f7"; // soft blue tint for alternating rows
const HEADER_BG = "#1a3a5c";
const HEADER_TEXT = "#ffffff";
const BORDER_OUTER = "#1a3a5c";
const BORDER_INNER = "#b0c4d8";
const SECTION_LINE = "#3b82f6"; // vivid blue rule

/* ─── Table styles ─── */
const thStyle = {
  background: HEADER_BG,
  color: HEADER_TEXT,
  fontWeight: "700",
  padding: "5px 6px",
  textAlign: "center",
  fontSize: "11px",
  letterSpacing: "0.03em",
  border: `1px solid ${BORDER_OUTER}`,
  verticalAlign: "middle",
};

const tdStyle = {
  padding: "4px 6px",
  textAlign: "center",
  fontSize: "11px",
  border: `1px solid ${BORDER_INNER}`,
  verticalAlign: "middle",
  color: "#1e293b",
};

const tdLabelStyle = {
  ...tdStyle,
  textAlign: "left",
  paddingLeft: "8px",
  fontWeight: "600",
  color: ACCENT,
  background: ACCENT_LIGHT,
  fontSize: "10.5px",
  letterSpacing: "0.02em",
};

const calculatePercentage = (attendanceData) => {
  if (!attendanceData || !attendanceData.possibleDays) return "-";
  const pct = (attendanceData.presentDays / attendanceData.possibleDays) * 100;
  return isNaN(pct) ? "-" : `${Math.min(100, Math.round(pct))}%`;
};

/* ─── Section Header Component ─── */
const SectionTitle = ({ children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      margin: "12px 0 6px",
    }}
  >
    <div
      style={{
        width: "4px",
        height: "16px",
        background: SECTION_LINE,
        borderRadius: "2px",
        flexShrink: 0,
      }}
    />
    <span
      style={{
        fontWeight: "800",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: ACCENT,
      }}
    >
      {children}
    </span>
    <div
      style={{
        flex: 1,
        height: "1px",
        background: `linear-gradient(to right, ${SECTION_LINE}55, transparent)`,
      }}
    />
  </div>
);

/* ─── Shared table wrapper ─── */
const StyledTable = ({ style, children }) => (
  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
      border: `2px solid ${BORDER_OUTER}`,
      borderRadius: "4px",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </table>
);

/**
 * TraineeLeaveRecordPrint — Modern redesign (HTML/Tailwind-free inline styles)
 * All data bindings and logic preserved exactly.
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
          style={{
            width: "100%",
            height: "100%",
            background: "#ffffff",
            color: "#1e293b",
            boxSizing: "border-box",
            padding: "20px 24px",
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            pageBreakAfter:
              pageIndex < data.pages.length - 1 ? "always" : "auto",
          }}
        >
          {/* ── Outer frame with accent top border ── */}
          <div
            style={{
              height: "100%",
              border: `2px solid ${BORDER_OUTER}`,
              borderTop: `5px solid ${ACCENT}`,
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
              padding: "16px 20px 16px",
              boxSizing: "border-box",
              background: "#ffffff",
            }}
          >
            {/* Header */}
            <PrintHeader
              collageName={data.collageName}
              heading="TRAINEE LEAVE RECORD"
            />

            {/* Student Info */}
            <PrintStudentInfo data={data} yearRange={pageData.yearRange} sessionName={pageData.sessionName} />

            {/* ─── Attendance Details ─── */}
            <SectionTitle>Attendance Details</SectionTitle>
            <StyledTable style={{ marginBottom: "4px" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: "16%", textAlign: "left", paddingLeft: "8px" }}>
                    Months
                  </th>
                  {pageData.months.map((month, i) => (
                    <th key={i} style={{ ...thStyle, width: "7%" }}>
                      {month.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Possible Days", key: "possibleDays", fmt: (v) => v || "" },
                  { label: "Present Days",  key: "presentDays",  fmt: (v) => v || "" },
                  { label: "Sick Leave",    key: "sickLeave",    fmt: (v) => v ?? "" },
                  { label: "Casual Leave",  key: "casualLeave",  fmt: (v) => v ?? "" },
                ].map(({ label, key, fmt }, rowIdx) => (
                  <tr
                    key={label}
                    style={{ background: rowIdx % 2 === 0 ? "#f8fafd" : "#ffffff" }}
                  >
                    <td style={tdLabelStyle}>{label}</td>
                    {pageData.months.map((month, i) => (
                      <td key={i} style={tdStyle}>
                        {fmt(pageData?.data[month]?.[key])}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Percentage row — highlighted */}
                <tr style={{ background: "#dbeafe" }}>
                  <td
                    style={{
                      ...tdLabelStyle,
                      background: "#bfdbfe",
                      color: "#1e40af",
                    }}
                  >
                    Percentage %
                  </td>
                  {pageData.months.map((month, i) => (
                    <td
                      key={i}
                      style={{
                        ...tdStyle,
                        fontWeight: "700",
                        fontSize: "10.5px",
                        color: "#1e40af",
                      }}
                    >
                      {calculatePercentage(pageData?.data[month])}
                    </td>
                  ))}
                </tr>
              </tbody>
            </StyledTable>

            {/* ─── Casual Leave Record ─── */}
            <SectionTitle>Casual Leave Record</SectionTitle>
            <StyledTable style={{ marginBottom: "4px" }}>
              <thead>
                <tr>
                  {["Sr.", "Date", "Reason", "CI", "GI",
                    "Sr.", "Date", "Reason", "CI", "GI"].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // CL table: 12 slots numbered 12 down to 1, split into two columns of 6
                  const CL_TOTAL = 12;
                  const CL_PER_COL = 6;
                  const clData = data.clRecords || [];
                  // left column: Sr 12..7, right column: Sr 6..1
                  return Array.from({ length: CL_PER_COL }).map((_, rowIdx) => {
                    const leftSr  = CL_TOTAL - rowIdx;           // 12,11,10,9,8,7
                    const rightSr = CL_PER_COL - rowIdx;         // 6,5,4,3,2,1
                    const leftEntry  = clData.find((_, i) => i === (CL_TOTAL - leftSr));   // clData[0..5]
                    const rightEntry = clData.find((_, i) => i === (CL_PER_COL - rightSr)); // clData[6..11] → re-index
                    // simpler: left = clData at position (rowIdx), right = clData at position (CL_PER_COL + rowIdx)
                    const lEntry = clData[rowIdx] || null;
                    const rEntry = clData[CL_PER_COL + rowIdx] || null;
                    return (
                      <tr key={rowIdx} style={{ height: "24px", background: rowIdx % 2 === 0 ? "#f8fafd" : "#ffffff" }}>
                        {/* Left half */}
                        <td style={{ ...tdStyle, fontWeight: "700", color: ACCENT }}>{leftSr}</td>
                        <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "6px" }}>{lEntry?.date || ""}</td>
                        <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "6px", fontSize: "9.5px" }}>{lEntry?.reason || ""}</td>
                        <td style={tdStyle}></td>
                        <td style={tdStyle}></td>
                        {/* Right half */}
                        <td style={{ ...tdStyle, fontWeight: "700", color: ACCENT }}>{rightSr}</td>
                        <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "6px" }}>{rEntry?.date || ""}</td>
                        <td style={{ ...tdStyle, textAlign: "left", paddingLeft: "6px", fontSize: "9.5px" }}>{rEntry?.reason || ""}</td>
                        <td style={tdStyle}></td>
                        <td style={tdStyle}></td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </StyledTable>

            {/* ─── Medical (Sick) Leave Record ─── */}
            <SectionTitle>Medical Leave Record</SectionTitle>
            <StyledTable style={{ marginBottom: "4px" }}>
              <thead>
                <tr>
                  {["Sr.", "From", "To", "Days", "Reason / Diagnosis",
                    "Order", "Trai.", "Inst.", "G.I."].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const SL_ROWS = 4;
                  const slData = data.slRecords || [];
                  return Array.from({ length: Math.max(SL_ROWS, slData.length) }).map((_, i) => {
                    const spell = slData[i] || null;
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#f8fafd" : "#ffffff" }}>
                        <td style={{ ...tdStyle, height: "26px", fontWeight: "700", color: ACCENT }}>{i + 1}</td>
                        <td style={{ ...tdStyle, height: "26px" }}>{spell?.from || ""}</td>
                        <td style={{ ...tdStyle, height: "26px" }}>{spell?.to || ""}</td>
                        <td style={{ ...tdStyle, height: "26px", fontWeight: spell ? "700" : "400" }}>
                          {spell ? `${spell.days}d` : ""}
                        </td>
                        <td style={{ ...tdStyle, height: "26px", textAlign: "left", paddingLeft: "6px" }}></td>
                        <td style={{ ...tdStyle, height: "26px" }}></td>
                        <td style={{ ...tdStyle, height: "26px" }}></td>
                        <td style={{ ...tdStyle, height: "26px" }}></td>
                        <td style={{ ...tdStyle, height: "26px" }}></td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </StyledTable>

            {/* ─── Meeting with Parents ─── */}
            <SectionTitle>Meeting with Parents</SectionTitle>
            <StyledTable>
              <thead>
                <tr>
                  {["Sr.", "Reason", "Report",
                    "Par.", "Ins.", "GI", "Pri."].map((h, i) => (
                    <th key={i} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr
                    key={i}
                    style={{ background: i % 2 === 0 ? "#f8fafd" : "#ffffff" }}
                  >
                    <td style={{ ...tdStyle, height: "26px", fontWeight: "600", color: ACCENT }}>
                      {i + 1}
                    </td>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} style={{ ...tdStyle, height: "26px" }}></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </StyledTable>
          </div>
        </div>
      ))}
    </PrintLayout>
  );
});

export default TraineeLeaveRecordPrint;