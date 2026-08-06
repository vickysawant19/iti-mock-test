import React, { forwardRef } from "react";
import { format } from "date-fns";
import { calculateAverage, calculateTotalAttendance } from "./util";
import PrintHeader from "../components/PrintHeader";
import PrintStudentInfo from "../components/PrintStudentInfo";
import PrintLayout from "../components/PrintLayout";

/* ─── Shared table cell styles ─── */
const thClass = "border-2 border-black font-bold px-1.5 py-1 text-center bg-gray-100 align-middle text-sm leading-tight";
const tdClass = "border border-gray-800 px-1.5 py-1 text-center align-middle text-sm leading-tight";
const sectionLabelClass = "font-bold text-center uppercase mb-1.5 text-base tracking-wide text-black";

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
          className={`w-full h-full bg-white text-black box-border p-4 ${
            pageIndex < data.pages.length - 1 ? "page-break" : ""
          }`}
          style={{ fontFamily: "'Roboto', Arial, sans-serif" }}
        >
          {/* Thick outer frame */}
          <div className="h-full border-[3px] border-black flex flex-col pt-4 px-6 pb-4 box-border">
            {/* ─── Header ─── */}
          <PrintHeader
            collageName={data.collageName}
            heading="PROGRESS CARD"
          />

          {/* ─── Student Info ─── */}
          <PrintStudentInfo data={data} yearRange={yearRange} />

          {/* ─── Monthly Record Table ─── */}
          <div className="mb-5 flex-1 min-h-0">
            <div className={sectionLabelClass}>Monthly Record</div>
            <table className="w-full border-collapse border-[1.5px] border-black table-fixed text-sm">
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
                  <th rowSpan={2} className={thClass}>Sr.<br />No.</th>
                  <th rowSpan={2} className={thClass}>Month</th>
                  <th rowSpan={2} className={thClass}>Theory<br />(100)</th>
                  <th rowSpan={2} className={thClass}>Practical<br />(250)</th>
                  <th colSpan={2} className={thClass}>Attendance</th>
                  <th rowSpan={2} className={thClass}>Progress<br />%</th>
                  <th colSpan={2} className={thClass}>Signature</th>
                  <th rowSpan={2} className={thClass}>Remarks</th>
                </tr>
                <tr>
                  <th className={thClass}>Possible<br />Days</th>
                  <th className={thClass}>Present<br />Days</th>
                  <th className={thClass}>Trade<br />Instructor</th>
                  <th className={thClass}>Group<br />Instructor</th>
                </tr>
              </thead>
              <tbody>
                {allRecords?.map(([month, record], index) => (
                  <tr key={index} style={{ height: "36px" }}>
                    <td className={tdClass}>{index + 1}</td>
                    <td className={tdClass}>{format(new Date(month), "MMM-yyyy")}</td>
                    <td className={tdClass}>{record.theory ?? "-"}</td>
                    <td className={tdClass}>{record.practical ?? "-"}</td>
                    <td className={tdClass}>
                      {(record.presentDays ?? 0) + (record.absentDays ?? 0) || "-"}
                    </td>
                    <td className={tdClass}>{record.presentDays || "-"}</td>
                    <td className={tdClass}>
                      {record.presentDays && record.presentDays + record.absentDays
                        ? (
                            (record.presentDays /
                              (record.presentDays + record.absentDays)) *
                            100
                          ).toFixed(1)
                        : "-"}
                    </td>
                    <td className={tdClass}></td>
                    <td className={tdClass}></td>
                    <td className={tdClass}>{record.remarks || "-"}</td>
                  </tr>
                ))}
                {/* Average row */}
                <tr
                  style={{
                    fontWeight: "bold",
                    backgroundColor: "#f0f4f8",
                    height: "38px",
                  }}
                >
                  <td className={tdClass}></td>
                  <td className={`${tdClass} font-bold`}>Average</td>
                  <td className={tdClass}>{calculateAverage(allRecords, "theory", 100)}</td>
                  <td className={tdClass}>{calculateAverage(allRecords, "practical", 250)}</td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                  <td className={tdClass}>{calculateTotalAttendance(allRecords)}</td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                  <td className={tdClass}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ─── Quarterly Tests Table ─── */}
          <div>
            <div className={sectionLabelClass}>Quarterly Tests</div>
            <table className="w-full border-collapse border-[1.5px] border-black table-fixed text-sm">
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
                  <th rowSpan={2} className={thClass}>Quart.<br />No.</th>
                  <th colSpan={3} className={thClass}>Marks</th>
                  <th rowSpan={2} className={thClass}>Character &amp;<br />Communication</th>
                  <th colSpan={3} className={thClass}>Signature</th>
                  <th rowSpan={2} className={thClass}>Remarks</th>
                </tr>
                <tr>
                  <th className={thClass}>Practical</th>
                  <th className={thClass}>Theory</th>
                  <th className={thClass}>Empl.<br />Skills</th>
                  <th className={thClass}>Trade<br />Instructor</th>
                  <th className={thClass}>Group<br />Instructor</th>
                  <th className={thClass}>Principal</th>
                </tr>
              </thead>
              <tbody>
                {data?.quarterlyTests?.map((test, index) => (
                  <tr key={index} style={{ height: "36px" }}>
                    <td className={tdClass}>Q{test.quarter || index + 1}</td>
                    <td className={tdClass}>{test.practical || "-"}</td>
                    <td className={tdClass}>{test.theory || "-"}</td>
                    <td className={tdClass}>{test.skills || "-"}</td>
                    <td className={tdClass}>{test.characterCom || "-"}</td>
                    <td className={tdClass}>{test.signature || "-"}</td>
                    <td className={tdClass}>-</td>
                    <td className={tdClass}>-</td>
                    <td className={tdClass}>{test.remarks || "-"}</td>
                  </tr>
                ))}
                {/* Average row */}
                {data?.quarterlyTests?.length > 0 && (
                  <tr style={{ fontWeight: "bold", backgroundColor: "#f0f4f8", height: "38px" }}>
                    <td className={`${tdClass} font-bold`}>Average</td>
                    <td className={tdClass}>
                      {(
                        data.quarterlyTests.reduce(
                          (sum, t) => sum + (t.practical || 0),
                          0
                        ) / data.quarterlyTests.length
                      ).toFixed(2)}
                    </td>
                    <td className={tdClass}>
                      {(
                        data.quarterlyTests.reduce(
                          (sum, t) => sum + (t.theory || 0),
                          0
                        ) / data.quarterlyTests.length
                      ).toFixed(2)}
                    </td>
                    <td className={tdClass}>
                      {(
                        data.quarterlyTests.reduce(
                          (sum, t) => sum + (t.skills || 0),
                          0
                        ) / data.quarterlyTests.length
                      ).toFixed(2)}
                    </td>
                    <td className={tdClass}></td>
                    <td className={tdClass}></td>
                    <td className={tdClass}></td>
                    <td className={tdClass}></td>
                    <td className={tdClass}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ))}
    </PrintLayout>
  );
});

export default ProgressCardPrint;
