import React from "react";
import devtLogo from "@/assets/dvet-logo.png";
import bodhChinha from "@/assets/bodh-chinha.png";

/**
 * PrintHeader (HTML version)
 * Replaces the old @react-pdf/renderer PdfHeader.
 * Renders two logos flanking the college name and document heading.
 */
const PrintHeader = ({ heading, collageName }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "2px solid #000",
        paddingBottom: "10px",
        marginBottom: "10px",
      }}
    >
      {/* Left Logo (DVET) */}
      <img
        src={devtLogo}
        alt="DVET Logo"
        style={{ width: "64px", height: "64px", objectFit: "contain" }}
      />

      {/* Center Text */}
      <div style={{ flex: 1, textAlign: "center", padding: "0 15px" }}>
        <div
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            textTransform: "uppercase",
            marginBottom: "6px",
            letterSpacing: "0.5px",
            lineHeight: "1.2",
          }}
        >
          {collageName}
        </div>
        <div 
          style={{ 
            fontSize: "16px", 
            fontWeight: "bold", 
            textTransform: "uppercase",
            color: "#333" 
          }}
        >
          {heading}
        </div>
      </div>

      {/* Right Logo (Bodh Chinha) */}
      <img
        src={bodhChinha}
        alt="Bodh Chinha"
        style={{ width: "64px", height: "64px", objectFit: "contain" }}
      />
    </div>
  );
};

export default PrintHeader;
