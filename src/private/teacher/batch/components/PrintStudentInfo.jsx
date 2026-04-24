import React from "react";
import { format } from "date-fns";

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy");
  } catch {
    return "-";
  }
};

const fieldStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "baseline",
  marginBottom: "6px",
};

const labelStyle = {
  fontWeight: "bold",
  marginRight: "6px",
  whiteSpace: "nowrap",
  fontSize: "10px",
  color: "#333",
};

const valueStyle = {
  borderBottom: "1px solid #999",
  flex: 1,
  paddingBottom: "2px",
  fontSize: "10px",
  minWidth: "100px",
  color: "#000",
};

/**
 * PrintStudentInfo (HTML version)
 * Replaces the old @react-pdf/renderer PdfStudentInfo.
 * Shows a 2-column grid of student details.
 */
const PrintStudentInfo = ({ data, yearRange }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: "24px",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid #ccc",
      }}
    >
      {/* Left column */}
      <div style={{ flex: 1 }}>
        <div style={fieldStyle}>
          <span style={labelStyle}>Name of Trainee:</span>
          <span style={valueStyle}>{data?.userName || "-"}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Date of Birth:</span>
          <span style={valueStyle}>
            {data?.DOB ? formatDate(data.DOB) : "-"}
          </span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Trade:</span>
          <span style={valueStyle}>{data?.tradeName || "-"}</span>
        </div>
      </div>

      {/* Right column */}
      <div style={{ flex: 1 }}>
        <div style={fieldStyle}>
          <span style={labelStyle}>Trainee Code:</span>
          <span style={valueStyle}>{data?.registerId || "-"}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Year:</span>
          <span style={valueStyle}>{yearRange || "-"}</span>
        </div>
        <div style={fieldStyle}>
          <span style={labelStyle}>Permanent Address:</span>
          <span style={valueStyle}>{data?.address || "-"}</span>
        </div>
      </div>
    </div>
  );
};

export default PrintStudentInfo;
