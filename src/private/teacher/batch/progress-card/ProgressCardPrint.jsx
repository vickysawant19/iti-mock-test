import React, { forwardRef } from "react";
import { format } from "date-fns";
import { calculateAverage, calculateTotalAttendance } from "./util";
import PrintHeader from "../components/PrintHeader";
import PrintStudentInfo from "../components/PrintStudentInfo";
import PrintLayout from "../components/PrintLayout";

/* ─── Shared table cell styles ─── */
const th = {
  border: "1.5px solid #000",
  padding: "5px 6px",
  fontWeight: "bold",
  fontSize: "10px",
  textAlign: "center",
  backgroundColor: "#f3f4f6",
  verticalAlign: "middle",
  lineHeight: "1.4",
};

const td = {
  border: "1px solid #333",
  padding: "5px 6px",
  fontSize: "10px",
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: "1.4",
};

const sectionLabel = {
  fontWeight: "bold",
  textAlign: "center",
  textTransform: "uppercase",
  marginBottom: "6px",
  fontSize: "11px",
  letterSpacing: "0.5px",
};

/**
 * ProgressCardPrint (HTML version)
 * forwardRef so ProgressCards.jsx can pass the ref to useReactToPrint.
 */
const ProgressCardPrint = forwardRef(function ProgressCardPrint({ data }, ref) {
  if (!data) return null;

  return (
    <PrintLayout ref={ref} pageSize="a4" orientation="portrait">
      {data.pages.map(({ data: allRecords, yearRange }, pageIndex) => (
        <div
          key={pageIndex}
          className={pageIndex < data.pages.length - 1 ? "page-break" : ""}
          style={{
            /* Generous margins: more on left for binding/filing */
            padding: "28px 32px 28px 44px",
            fontFamily: "'Roboto', Arial, sans-serif",
            fontSize: "10px",
            minHeight: "100vh",
            backgroundColor: "white",
            color: "black",
            boxSizing: "border-box",
          }}
        >
          {/* ─── Header ─── */}
          <PrintHeader
            collageName={data.collageName}
            heading="PROGRESS CARD"
          />

          {/* ─── Student Info ─── */}
          <PrintStudentInfo data={data} yearRange={yearRange} />

          {/* ─── Monthly Record Table ─── */}
          <div style={{ marginBottom: "20px" }}>
            <div style={sectionLabel}>Monthly Record</div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                border: "1.5px solid #000",
              }}
            >
              <colgroup>
                <col style={{ width: "5%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "9%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} style={th}>Sr.<br />No.</th>
                  <th rowSpan={2} style={th}>Month</th>
                  <th rowSpan={2} style={th}>Theory<br />(100)</th>
                  <th rowSpan={2} style={th}>Practical<br />(250)</th>
                  <th colSpan={2} style={th}>Attendance</th>
                  <th rowSpan={2} style={th}>Progress<br />%</th>
                  <th colSpan={2} style={th}>Signature</th>
                  <th rowSpan={2} style={th}>Remarks</th>
                </tr>
                <tr>
                  <th style={th}>Possible<br />Days</th>
                  <th style={th}>Present<br />Days</th>
                  <th style={th}>Trade<br />Instructor</th>
                  <th style={th}>Group<br />Instructor</th>
                </tr>
              </thead>
              <tbody>
                {allRecords?.map(([month, record], index) => (
                  <tr key={index} style={{ height: "28px" }}>
                    <td style={td}>{index + 1}</td>
                    <td style={td}>{format(new Date(month), "MMM-yyyy")}</td>
                    <td style={td}>{record.theory ?? "-"}</td>
                    <td style={td}>{record.practical ?? "-"}</td>
                    <td style={td}>
                      {(record.presentDays ?? 0) + (record.absentDays ?? 0) || "-"}
                    </td>
                    <td style={td}>{record.presentDays || "-"}</td>
                    <td style={td}>
                      {record.presentDays && record.presentDays + record.absentDays
                        ? (
                            (record.presentDays /
                              (record.presentDays + record.absentDays)) *
                            100
                          ).toFixed(1)
                        : "-"}
                    </td>
                    <td style={td}></td>
                    <td style={td}></td>
                    <td style={td}>{record.remarks || "-"}</td>
                  </tr>
                ))}
                {/* Average row */}
                <tr
                  style={{
                    fontWeight: "bold",
                    backgroundColor: "#f0f4f8",
                    height: "30px",
                  }}
                >
                  <td style={td}></td>
                  <td style={{ ...td, fontWeight: "bold" }}>Average</td>
                  <td style={td}>{calculateAverage(allRecords, "theory", 100)}</td>
                  <td style={td}>{calculateAverage(allRecords, "practical", 250)}</td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}>{calculateTotalAttendance(allRecords)}</td>
                  <td style={td}></td>
                  <td style={td}></td>
                  <td style={td}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ─── Quarterly Tests Table ─── */}
          <div>
            <div style={sectionLabel}>Quarterly Tests</div>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                border: "1.5px solid #000",
              }}
            >
              <colgroup>
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th rowSpan={2} style={th}>Quart.<br />No.</th>
                  <th colSpan={3} style={th}>Marks</th>
                  <th rowSpan={2} style={th}>Character &amp;<br />Communication</th>
                  <th colSpan={3} style={th}>Signature</th>
                  <th rowSpan={2} style={th}>Remarks</th>
                </tr>
                <tr>
                  <th style={th}>Practical</th>
                  <th style={th}>Theory</th>
                  <th style={th}>Empl.<br />Skills</th>
                  <th style={th}>Trade<br />Instructor</th>
                  <th style={th}>Group<br />Instructor</th>
                  <th style={th}>Principal</th>
                </tr>
              </thead>
              <tbody>
                {data?.quarterlyTests?.map((test, index) => (
                  <tr key={index} style={{ height: "30px" }}>
                    <td style={td}>Q{test.quarter || index + 1}</td>
                    <td style={td}>{test.practical || "-"}</td>
                    <td style={td}>{test.theory || "-"}</td>
                    <td style={td}>{test.skills || "-"}</td>
                    <td style={td}>{test.characterCom || "-"}</td>
                    <td style={td}>{test.signature || "-"}</td>
                    <td style={td}>-</td>
                    <td style={td}>-</td>
                    <td style={td}>{test.remarks || "-"}</td>
                  </tr>
                ))}
                {/* Average row */}
                {data?.quarterlyTests?.length > 0 && (
                  <tr style={{ fontWeight: "bold", backgroundColor: "#f0f4f8", height: "30px" }}>
                    <td style={{ ...td, fontWeight: "bold" }}>Average</td>
                    <td style={td}>
                      {(
                        data.quarterlyTests.reduce(
                          (sum, t) => sum + (t.practical || 0),
                          0
                        ) / data.quarterlyTests.length
                      ).toFixed(2)}
                    </td>
                    <td style={td}>
                      {(
                        data.quarterlyTests.reduce(
                          (sum, t) => sum + (t.theory || 0),
                          0
                        ) / data.quarterlyTests.length
                      ).toFixed(2)}
                    </td>
                    <td style={td}>
                      {(
                        data.quarterlyTests.reduce(
                          (sum, t) => sum + (t.skills || 0),
                          0
                        ) / data.quarterlyTests.length
                      ).toFixed(2)}
                    </td>
                    <td style={td}></td>
                    <td style={td}></td>
                    <td style={td}></td>
                    <td style={td}></td>
                    <td style={td}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </PrintLayout>
  );
});

export default ProgressCardPrint;
