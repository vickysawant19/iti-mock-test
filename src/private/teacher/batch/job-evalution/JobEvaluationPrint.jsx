import React, { forwardRef } from "react";
import { addDays, format } from "date-fns";
import PrintLayout from "../components/PrintLayout";

/* ─── Ultra-compact styles for 24-row landscape fit ─── */
const th = {
  border: "1px solid #000",
  padding: "2px 4px",
  fontWeight: "bold",
  fontSize: "9px",
  textAlign: "center",
  backgroundColor: "#f3f4f6",
  verticalAlign: "middle",
  lineHeight: "1.1",
};

const td = {
  border: "1px solid #333",
  padding: "2px 4px",
  fontSize: "9px",
  textAlign: "center",
  verticalAlign: "middle",
  lineHeight: "1.1",
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const chunk = (array = [], size = 24) => {
  if (!Array.isArray(array) || size <= 0) return [];
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
};

const generateStudentData = (studentsMap, moduleData, studentAttendance) => {
  let studentsArray = [];
  if (!studentsMap) studentsArray = [];
  else if (studentsMap instanceof Map) studentsArray = Array.from(studentsMap.values());
  else if (Array.isArray(studentsMap)) studentsArray = studentsMap;
  else if (typeof studentsMap === "object") studentsArray = Object.values(studentsMap);

  const startDate = moduleData?.startDate ? new Date(moduleData.startDate) : null;

  return studentsArray.map((student, idx) => {
    let isPresentInAnyDay = false;
    if (student && startDate && studentAttendance) {
      for (let j = 0; j < 7; j++) {
        const dateKey = format(addDays(startDate, j), "yyyy-MM-dd");
        if (studentAttendance?.[student.userId]?.[dateKey] === "present") {
          isPresentInAnyDay = true;
          break;
        }
      }
    }

    let a, b, c, d, e, total;
    if (isPresentInAnyDay) {
      a = Math.floor(Math.random() * 10) + 10;
      b = Math.floor(Math.random() * 10) + 10;
      c = Math.floor(Math.random() * 10) + 10;
      d = Math.floor(Math.random() * 10) + 10;
      e = Math.floor(Math.random() * 10) + 10;
      total = a + b + c + d + e;
    } else {
      a = b = c = d = e = 0;
      total = "AB";
    }

    return {
      id: student?.userId ?? `student-${idx}`,
      srNo: (idx + 1).toString(),
      name: student?.userName ?? "-",
      A: a.toString(),
      B: b.toString(),
      C: c.toString(),
      D: d.toString(),
      E: e.toString(),
      total: total.toString(),
    };
  });
};

// ─── ModulePage (Compact version for 24 rows) ──────────────────────────────
const ModulePagePrint = ({
  moduleData = {},
  studentsMap,
  college = {},
  studentAttendance = {},
  rowsPerPage = 24,
  isLastModule = true,
}) => {
  const studentDataAll = generateStudentData(studentsMap, moduleData, studentAttendance) || [];
  const pages = chunk(studentDataAll, rowsPerPage);

  const images = Array.isArray(moduleData?.images) ? moduleData.images : [];

  const evalPoints =
    Array.isArray(moduleData?.evalutionsPoints) && moduleData.evalutionsPoints.length > 0
      ? moduleData.evalutionsPoints
      : new Array(5).fill(null).map(() => ({ evaluation: "", points: "" }));

  const evalTotal = Array.isArray(moduleData?.evalutionsPoints)
    ? moduleData.evalutionsPoints.reduce((acc, doc) => acc + (+doc.points || 0), 0)
    : "";

  const renderPage = (pageRows, pageIndex, totalPages) => (
    <div
      key={`page-${pageIndex}`}
      className={
        pageIndex < totalPages - 1 || !isLastModule ? "page-break" : ""
      }
      style={{
        /* Ultra-tight padding to fit 24 rows in 210mm height */
        padding: "10px 15px 10px 40px",
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
      {/* ─── Ultra-compact Header ─── */}
      <div
        style={{
          border: "1.5px solid #000",
          padding: "4px 8px",
          marginBottom: "6px",
        }}
      >
        <div style={{ textAlign: "center", fontSize: "11px", fontWeight: "bold" }}>
          {college.collageName || "Industrial Training Institute"}
        </div>
        <div style={{ textAlign: "center", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "2px" }}>
          JOB EVALUATION REPORT
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "1px" }}>
          <span><b>Job No.:</b> {moduleData.moduleId ? moduleData.moduleId.slice(1) : "________"}</span>
          <span><b>Date of Starting:</b> {moduleData.startDate || "________________"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "1px" }}>
          <span style={{ maxWidth: "65%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <b>Job title:</b> {moduleData.moduleName || "________________________________"}
          </span>
          <span><b>Date of Finish:</b> {moduleData.endDate || "________________"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
          <span><b>Time:</b> {moduleData.moduleDuration || "____"} Hrs.</span>
          <span style={{ fontSize: "8px" }}>Page {pageIndex + 1} / {totalPages}</span>
        </div>
      </div>

      {/* ─── Two-column content ─── */}
      <div style={{ display: "flex", gap: "10px", flex: 1 }}>
        {/* Left: images + eval table */}
        <div style={{ width: "32%" }}>
          {/* Images - Very compact */}
          <div
            style={{
              border: "1px solid #000",
              height: "55px",
              overflow: "hidden",
              display: "flex",
              flexWrap: "wrap",
              marginBottom: "6px",
              backgroundColor: "#fafafa",
            }}
          >
            {images.length === 0 ? (
              <div style={{ width: "100%", textAlign: "center", padding: "10px", fontSize: "8px", color: "#666" }}>
                No images
              </div>
            ) : (
              images.map((img, i) => (
                <img
                  key={i}
                  src={img?.url}
                  alt=""
                  style={{
                    width: `${100 / Math.ceil(Math.sqrt(images.length))}%`,
                    maxHeight: "55px",
                    objectFit: "contain",
                    padding: "1px",
                  }}
                />
              ))
            )}
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
            <thead>
              <tr>
                <th style={{ ...th, width: "15%", fontSize: "8px" }}>No.</th>
                <th style={{ ...th, width: "65%", textAlign: "left", fontSize: "8px" }}>Evaluation Point</th>
                <th style={{ ...th, width: "20%", fontSize: "8px" }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {evalPoints.map((item, i) => (
                <tr key={i} style={{ height: "18px" }}>
                  <td style={{ ...td, fontSize: "8px" }}>{["A","B","C","D","E","F"][i] ?? i+1}</td>
                  <td style={{ ...td, textAlign: "left", fontSize: "8px" }}>{item?.evaluation ?? ""}</td>
                  <td style={{ ...td, fontSize: "8px" }}>{item?.points ?? ""}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold", backgroundColor: "#f0f4f8", height: "18px" }}>
                <td colSpan={2} style={{ ...td, fontSize: "8px" }}>Total</td>
                <td style={{ ...td, fontSize: "8px" }}>{evalTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Right: student marks table (The main part) */}
        <div style={{ flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", border: "1px solid #000" }}>
            <thead>
              <tr>
                <th style={{ ...th, width: "7%" }}>Sr.</th>
                <th style={{ ...th, width: "45%", textAlign: "left" }}>Name of Trainee</th>
                <th style={{ ...th, width: "8%" }}>A</th>
                <th style={{ ...th, width: "8%" }}>B</th>
                <th style={{ ...th, width: "8%" }}>C</th>
                <th style={{ ...th, width: "8%" }}>D</th>
                <th style={{ ...th, width: "8%" }}>E</th>
                <th style={{ ...th, width: "8%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr key={row.id ?? i} style={{ height: "18.5px" }}>
                  <td style={td}>{row.srNo}</td>
                  <td style={{ ...td, textAlign: "left", textTransform: "uppercase", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {String(row.name).slice(0, 38)}
                  </td>
                  <td style={td}>{row.A}</td>
                  <td style={td}>{row.B}</td>
                  <td style={td}>{row.C}</td>
                  <td style={td}>{row.D}</td>
                  <td style={td}>{row.E}</td>
                  <td style={{ ...td, fontWeight: "bold" }}>{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Signature area ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          border: "1.5px solid #000",
          borderTop: "none",
          padding: "4px 10px",
          marginTop: "6px",
          backgroundColor: "#fafafa",
        }}
      >
        <div style={{ width: "32%", textAlign: "center" }}>
          <div style={{ borderBottom: "1px solid #000", height: "18px", marginBottom: "2px" }}></div>
          <span style={{ fontSize: "8px", fontWeight: "bold" }}>Instructor Signature</span>
        </div>
        <div style={{ width: "32%", textAlign: "center" }}>
          <div style={{ borderBottom: "1px solid #000", height: "18px", marginBottom: "2px" }}></div>
          <span style={{ fontSize: "8px", fontWeight: "bold" }}>Group Instructor Signature</span>
        </div>
        <div style={{ width: "32%", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ fontSize: "8px", fontWeight: "bold", textTransform: "uppercase", lineHeight: "1" }}>
            {college.collageName || "Industrial Training Institute"}
          </span>
        </div>
      </div>
    </div>
  );

  if (pages.length === 0) return renderPage([], 0, 1);
  return <>{pages.map((pageRows, i) => renderPage(pageRows, i, pages.length))}</>;
};

/**
 * JobEvaluationPrint (HTML version)
 */
const JobEvaluationPrint = forwardRef(function JobEvaluationPrint(
  { studentsMap, college, selectedModule, allModules, studentAttendance, rowsPerPage = 24 },
  ref
) {
  const modulesToRender =
    Array.isArray(allModules) && allModules.length > 0
      ? allModules
      : [selectedModule];

  return (
    <PrintLayout ref={ref} pageSize="a4" orientation="landscape">
      {modulesToRender.map((module, idx) => (
        <ModulePagePrint
          key={`module-${idx}`}
          moduleData={module || {}}
          studentsMap={studentsMap}
          college={college || {}}
          studentAttendance={studentAttendance || {}}
          rowsPerPage={rowsPerPage}
          isLastModule={idx === modulesToRender.length - 1}
        />
      ))}
    </PrintLayout>
  );
});

export default JobEvaluationPrint;
