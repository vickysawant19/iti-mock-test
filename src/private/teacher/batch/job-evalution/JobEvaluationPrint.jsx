import React, { forwardRef, useMemo } from "react";
import { addDays, format } from "date-fns";
import PrintLayout from "../components/PrintLayout";

// ─── Helpers ────────────────────────────────────────────────────────────────
const chunk = (array = [], size = 24) => {
  if (!Array.isArray(array) || size <= 0) return [];
  const out = [];
  for (let i = 0; i < array.length; i += size)
    out.push(array.slice(i, i + size));
  return out;
};

const generateStudentData = (studentsMap, moduleData, studentAttendance) => {
  let studentsArray = [];
  if (!studentsMap) studentsArray = [];
  else if (studentsMap instanceof Map)
    studentsArray = Array.from(studentsMap.values());
  else if (Array.isArray(studentsMap)) studentsArray = studentsMap;
  else if (typeof studentsMap === "object")
    studentsArray = Object.values(studentsMap);

  const startDate = moduleData?.startDate
    ? new Date(moduleData.startDate)
    : null;

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

// ─── ModulePage (A4 Landscape with Tailwind CSS) ──────────────────────────────
const ModulePagePrint = ({
  moduleData = {},
  studentsMap,
  college = {},
  studentAttendance = {},
  rowsPerPage = 24,
  isLastModule = true,
}) => {
  const studentDataAll =
    generateStudentData(studentsMap, moduleData, studentAttendance) || [];

  // Limit to rowsPerPage (24 students) for single-page layout
  const pageRows = studentDataAll.slice(0, rowsPerPage);

  const images = Array.isArray(moduleData?.images) ? moduleData.images : [];

  const evalPoints =
    Array.isArray(moduleData?.evalutionsPoints) &&
    moduleData.evalutionsPoints.length > 0
      ? moduleData.evalutionsPoints
      : new Array(5).fill(null).map(() => ({ evaluation: "", points: "" }));

  const evalTotal = Array.isArray(moduleData?.evalutionsPoints)
    ? moduleData.evalutionsPoints.reduce(
        (acc, doc) => acc + (+doc.points || 0),
        0,
      )
    : "";

  // Calculate student table row height based on remaining space
  // A4 Landscape: 297mm x 210mm
  // Available height after header, footer, and margins
  const availableHeightForStudents = useMemo(() => {
    // Estimated heights (in px, will be converted to fit)
    const headerHeight = 80; // Header section
    const evalHeight = 140; // Evaluation points section
    const footerHeight = 60; // Signature area
    const margins = 48; // 12mm top + bottom padding
    const gaps = 24; // gaps between sections

    // Total available for student table
    const pageHeightPx = 891.89; // 210mm in px (at 96dpi)
    const availableHeight =
      pageHeightPx - (headerHeight + footerHeight + margins + gaps);

    // Calculate row height based on number of students
    const studentRowHeight = Math.floor(
      availableHeight / (pageRows.length || 1),
    );

    return {
      availableHeight,
      rowHeight: Math.min(studentRowHeight, 24), // Max 24px per row
      headerHeight,
      footerHeight,
    };
  }, [pageRows.length]);

  return (
    <div
      className="w-full bg-white text-black"
      style={{ width: "297mm", height: "210mm" }}
    >
      {/* ═══ OUTER CONTAINER: A4 Landscape with border ═══ */}
      <div
        className="h-full border-2 border-black flex flex-col p-3"
        style={{ boxSizing: "border-box" }}
      >
        {/* ═══ HEADER SECTION ═══ */}
        <div className="border border-gray-800 bg-gray-50 p-2 mb-2 shrink-0">
          {/* College Name */}
          <div className="text-center font-bold text-xs mb-0.5">
            {college.collageName || "Industrial Training Institute"}
          </div>

          {/* Title */}
          <div className="text-center font-bold text-sm uppercase mb-1">
            JOB EVALUATION REPORT
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="truncate">
              <span className="font-bold">Job No.:</span>{" "}
              {moduleData.moduleId ? moduleData.moduleId.slice(1) : "________"}
            </div>
            <div className="truncate">
              <span className="font-bold">Start Date:</span>{" "}
              {moduleData.startDate
                ? format(new Date(moduleData.startDate), "dd-MM-yyyy")
                : "________________"}
            </div>
              <div className="col-span-2 break-words whitespace-normal">
                <span className="font-bold">Job Title:</span>{" "}
                {String(moduleData.moduleName || "")}
              </div>
            <div className="truncate">
              <span className="font-bold">End Date:</span>{" "}
              {moduleData.endDate
                ? format(new Date(moduleData.endDate), "dd-MM-yyyy")
                : "________________"}
            </div>
            <div className="truncate">
              <span className="font-bold">Duration:</span>{" "}
              {moduleData.moduleDuration || "____"} Hrs
            </div>
          </div>
        </div>

        {/* ═══ MAIN CONTENT: Two-column layout ═══ */}
        <div className="flex gap-2 flex-1 min-h-0">
          {/* ─── LEFT PANEL: Images + Evaluation Points ─── */}
          <div className="w-1/3 flex flex-col gap-2 min-h-0">
            {/* Images Container */}
            <div
              className="border border-gray-800 bg-gray-50 p-1 shrink-0"
              style={{ height: "80px" }}
            >
              {images.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                  No images
                </div>
              ) : (
                <div className="flex flex-wrap gap-0.5 h-full items-start content-start">
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img?.url}
                      alt=""
                      className="object-contain p-0.5"
                      style={{
                        width: `${100 / Math.min(2, images.length)}%`,
                        maxHeight: "75px",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Evaluation Points Table */}
            <div className="border border-gray-800 flex-1 flex flex-col min-h-0 overflow-hidden">
              <table className="w-full border-collapse text-xs">
                <thead className="shrink-0">
                  <tr>
                    <th className="border border-gray-800 bg-indigo-100 font-bold p-0.5 w-1/6">
                      No.
                    </th>
                    <th className="border border-gray-800 bg-indigo-100 font-bold p-0.5 w-1/2 text-left">
                      Evaluation
                    </th>
                    <th className="border border-gray-800 bg-indigo-100 font-bold p-0.5 w-1/3">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody className="flex-1 block overflow-hidden">
                  {evalPoints.map((item, i) => (
                    <tr
                      key={i}
                      className="flex w-full"
                      style={{ height: "24px" }}
                    >
                      <td className="border border-gray-800 p-0.5 w-1/6 flex items-center justify-center text-xs">
                        {["A", "B", "C", "D", "E"][i] ?? i + 1}
                      </td>
                      <td className="border border-gray-800 p-0.5 w-1/2 flex items-center text-left text-xs truncate">
                        {item?.evaluation ?? ""}
                      </td>
                      <td className="border border-gray-800 p-0.5 w-1/3 flex items-center justify-center text-xs">
                        {item?.points ?? ""}
                      </td>
                    </tr>
                  ))}
                  <tr
                    className="flex w-full font-bold bg-indigo-100"
                    style={{ height: "24px" }}
                  >
                    <td
                      colSpan={2}
                      className="border border-gray-800 p-0.5 flex items-center justify-end pr-2 text-xs w-2/3"
                    >
                      Total:
                    </td>
                    <td className="border border-gray-800 p-0.5 w-1/3 flex items-center justify-center text-xs">
                      {evalTotal}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── RIGHT PANEL: Student Marks Table ─── */}
          <div className="w-2/3 flex flex-col border border-gray-800 min-h-0 overflow-hidden">
            <table className="w-full border-collapse text-xs">
              <thead className="shrink-0">
                <tr className="bg-indigo-100">
                  <th className="border border-gray-800 font-bold p-1 w-1/12">
                    Sr.
                  </th>
                  <th className="border border-gray-800 font-bold p-1 w-7/12 text-left">
                    Name
                  </th>
                  <th className="border border-gray-800 font-bold p-1 flex-1">
                    A
                  </th>
                  <th className="border border-gray-800 font-bold p-1 flex-1">
                    B
                  </th>
                  <th className="border border-gray-800 font-bold p-1 flex-1">
                    C
                  </th>
                  <th className="border border-gray-800 font-bold p-1 flex-1">
                    D
                  </th>
                  <th className="border border-gray-800 font-bold p-1 flex-1">
                    E
                  </th>
                  <th className="border border-gray-800 font-bold p-1 flex-1">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="block overflow-hidden flex-1">
                {pageRows.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    className="flex w-full"
                    style={{
                      height: `${availableHeightForStudents.rowHeight}px`,
                    }}
                  >
                    <td className="border border-gray-800 p-0.5 w-1/12 flex items-center justify-center text-xs overflow-hidden">
                      {row.srNo}
                    </td>
                    <td className="border border-gray-800 p-0.5 w-4/12 flex items-center text-left text-xs uppercase truncate">
                      {String(row.name).slice(0, 30)}
                    </td>
                    <td className="border border-gray-800 p-0.5 flex-1 flex items-center justify-center text-xs">
                      {row.A}
                    </td>
                    <td className="border border-gray-800 p-0.5 flex-1 flex items-center justify-center text-xs">
                      {row.B}
                    </td>
                    <td className="border border-gray-800 p-0.5 flex-1 flex items-center justify-center text-xs">
                      {row.C}
                    </td>
                    <td className="border border-gray-800 p-0.5 flex-1 flex items-center justify-center text-xs">
                      {row.D}
                    </td>
                    <td className="border border-gray-800 p-0.5 flex-1 flex items-center justify-center text-xs">
                      {row.E}
                    </td>
                    <td className="border border-gray-800 p-0.5 flex-1 flex items-center justify-center font-bold text-xs">
                      {row.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ FOOTER: Signature Area ═══ */}
        <div className="border border-gray-800 bg-gray-50 flex gap-0 shrink-0 mt-2">
          <div className="flex-1 border-r border-gray-800 flex flex-col p-1 text-center">
            <div
              className="flex-1 border-b border-gray-800 mb-0.5"
              style={{ minHeight: "20px" }}
            ></div>
            <span className="text-xs font-bold">Instructor Sign.</span>
          </div>
          <div className="flex-1 border-r border-gray-800 flex flex-col p-1 text-center">
            <div
              className="flex-1 border-b border-gray-800 mb-0.5"
              style={{ minHeight: "20px" }}
            ></div>
            <span className="text-xs font-bold">Group Sign.</span>
          </div>
          <div className="flex-1 flex flex-col p-1 text-center justify-end">
            <span className="text-xs font-bold uppercase">
              {college.collageName?.slice(0, 20) || "Institute"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * JobEvaluationPrint (HTML version)
 */
const JobEvaluationPrint = forwardRef(function JobEvaluationPrint(
  {
    studentsMap,
    college,
    selectedModule,
    allModules,
    studentAttendance,
    rowsPerPage = 24,
  },
  ref,
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
