import React, { forwardRef, useMemo } from "react";
import { format } from "date-fns";
import PrintLayout from "../components/PrintLayout";

/**
 * Dynamic JSON-driven Job Evaluation Report — A4 Landscape (297mm × 210mm)
 *
 * Font scale:
 *   College name   →  text-lg  (24 px)
 *   Report title   →  text-xs   (18 px)
 *   Everything else (table cells, labels, signatures) → text-xs (16 px) UNIFORM
 *
 * Layout behaviour:
 *   • Student rows STRETCH to fill all remaining vertical space on the page.
 *   • Evaluation Points table is pinned to the BOTTOM of the left column
 *     (just above the signature section).
 *   • studentsPerPage = 30 → keeps all students on as few pages as possible.
 */

// ─── Utilities ────────────────────────────────────────────────────────────────

const formatDate = (dateStr) => {
  if (!dateStr) return "________";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : format(d, "dd-MM-yyyy");
  } catch {
    return dateStr;
  }
};

const paginate = (students = [], perPage = 30) => {
  if (!students.length) return [[]];
  const pages = [];
  for (let i = 0; i < students.length; i += perPage)
    pages.push(students.slice(i, i + perPage));
  return pages;
};

// ─── Report Header ─────────────────────────────────────────────────────────────

const ReportHeader = ({ institute, job, isCompact = false }) => {
  if (isCompact) {
    return (
      <div className="border border-black bg-gray-50 px-3 py-1 mb-1 shrink-0">
        <p className="text-center font-bold text-lg leading-tight mb-0.5">
          {institute?.name || "Government Industrial Training Institute"}
        </p>
        <p className="text-center font-bold text-xs uppercase tracking-wider">
          JOB EVALUATION REPORT (Continued)
        </p>
      </div>
    );
  }

  return (
    <div className="border border-black bg-gray-50 px-3 py-1.5 mb-1 shrink-0">
      {/* College name — LARGEST */}
      <p className="text-center font-bold text-lg leading-tight mb-0.5">
        {institute?.name || "Government Industrial Training Institute"}
      </p>

      <p className="text-center font-bold text-sm uppercase tracking-widest mb-1">
        JOB EVALUATION REPORT
      </p>

      {/* Job details — UNIFORM text-xs */}
      <div className="flex gap-8 text-xs">
        <div className="flex-1 space-y-0.5">
          <div className="flex">
            <span className="font-bold w-20 shrink-0">Job No.:</span>
            <span className="ml-1">{job?.number || "________"}</span>
          </div>
          <div className="flex items-start">
            <span className="font-bold w-20 shrink-0">Job Title:</span>
            <span className="ml-1 break-words whitespace-normal">{job?.title || "________________________________"}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-20 shrink-0">Time:</span>
            <span className="ml-1">{job?.time || "____"} Hrs.</span>
          </div>
        </div>
        <div className="space-y-0.5 shrink-0">
          <div className="flex">
            <span className="font-bold w-36 shrink-0">Date of Starting:</span>
            <span className="ml-1">{formatDate(job?.startDate)}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-36 shrink-0">Date of Finish:</span>
            <span className="ml-1">{formatDate(job?.endDate)}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-36 shrink-0">Page:</span>
            <span className="ml-1">{job?.page || "____"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Evaluation Points Table ───────────────────────────────────────────────────
// Sits at the BOTTOM of the left column (parent uses justify-end).

const EvaluationPointsTable = ({ evaluationPoints = [] }) => {
  const totalMarks = useMemo(
    () => evaluationPoints.reduce((sum, p) => sum + (Number(p.marks) || 0), 0),
    [evaluationPoints],
  );

  return (
    <div className="border border-black">
      <table
        className="w-full border-collapse text-xs"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: "32px" }} />
          <col />
          <col style={{ width: "44px" }} />
        </colgroup>
        <thead>
          <tr className="bg-blue-100">
            <th className="border border-black font-bold px-1 py-0.5 text-center">Code</th>
            <th className="border border-black font-bold px-1 py-0.5 text-left">Evaluation Point</th>
            <th className="border border-black font-bold px-1 py-0.5 text-center">Marks</th>
          </tr>
        </thead>
        <tbody>
          {evaluationPoints.map((point, idx) => (
            <tr key={`eval-${idx}`}>
              <td className="border border-black px-1 py-0.5 text-center font-bold">
                {point.code || String.fromCharCode(65 + idx)}
              </td>
              <td className="border border-black px-1 py-0.5 text-left truncate">
                {point.title || ""}
              </td>
              <td className="border border-black px-1 py-0.5 text-center">
                {point.marks ?? 0}
              </td>
            </tr>
          ))}
          <tr className="bg-blue-100 font-bold">
            <td colSpan={2} className="border border-black px-1 py-0.5 text-right pr-2">
              Total:
            </td>
            <td className="border border-black px-1 py-0.5 text-center">{totalMarks}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ─── Student Evaluation Table ──────────────────────────────────────────────────
// Rows STRETCH to fill all remaining vertical space via the height:1px CSS trick.
// The outer div and the <table> are both height:100%, and each <tr> gets
// height:1px — browsers expand them equally to fill the table.

const StudentEvaluationTable = ({ students = [], evaluationPoints = [] }) => {
  const codes = useMemo(
    () => evaluationPoints.map((p, idx) => p.code || String.fromCharCode(65 + idx)),
    [evaluationPoints],
  );

  const srW    = "5%";
  const totalW = "8%";
  const scoreW = `${Math.floor(47 / Math.max(1, codes.length))}%`;
  const nameW  = `${100 - 5 - 8 - Math.floor(47 / Math.max(1, codes.length)) * codes.length}%`;

  return (
    // flex-1 + h-full makes this div fill the right column completely
    <div
      className="border border-black flex-1 overflow-hidden"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <table
        className="w-full border-collapse text-xs"
        style={{ tableLayout: "fixed", height: "100%", flex: 1 }}
      >
        <colgroup>
          <col style={{ width: srW }} />
          <col style={{ width: nameW }} />
          {codes.map((code) => (
            <col key={`col-${code}`} style={{ width: scoreW }} />
          ))}
          <col style={{ width: totalW }} />
        </colgroup>

        <thead>
          <tr className="bg-blue-100">
            <th className="border border-black font-bold px-1 py-0.5 text-center">Sr.</th>
            <th className="border border-black font-bold px-1 py-0.5 text-left pl-2">
              Name of Trainee
            </th>
            {codes.map((code, idx) => (
              <th
                key={`th-${code}`}
                className="border border-black font-bold px-1 py-0.5 text-center"
                title={evaluationPoints[idx]?.title || ""}
              >
                {code}
              </th>
            ))}
            <th className="border border-black font-bold px-1 py-0.5 text-center">Total</th>
          </tr>
        </thead>

        {/* height:100% + height:1px on each tr = rows share all available space */}
        <tbody style={{ height: "100%" }}>
          {students.map((student, idx) => (
            <tr
              key={`student-${student.sr ?? idx}`}
              style={{ height: "1px" }}  // expands evenly to fill tbody
            >
              <td className="border border-black px-1 py-0.5 text-center align-middle">
                {student.sr ?? idx + 1}
              </td>
              <td className="border border-black px-1 py-0.5 text-left pl-2 uppercase truncate align-middle">
                {String(student.name || "").slice(0, 40)}
              </td>
              {codes.map((code) => (
                <td
                  key={`score-${student.sr}-${code}`}
                  className="border border-black px-1 py-0.5 text-center align-middle"
                >
                  {student.scores?.[code] ??
                    student.scores?.[code.toLowerCase()] ??
                    "—"}
                </td>
              ))}
              <td className="border border-black px-1 py-0.5 text-center font-bold align-middle">
                {student.total ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Signature Section ─────────────────────────────────────────────────────────

const SignatureSection = ({
  signatures = ["Instructor Signature", "Group Instructor Signature", "Principal"],
}) => (
  <div className="border border-black bg-gray-50 flex shrink-0 mt-1 h-14">
    {signatures.map((sig, idx) => (
      <div
        key={`sig-${idx}`}
        className={`flex-1 flex flex-col justify-end items-center px-2 py-1 text-xs font-bold${
          idx < signatures.length - 1 ? " border-r border-black" : ""
        }`}
      >
        <div className="border-t border-black w-full mb-1" />
        <span className="text-center">{sig}</span>
      </div>
    ))}
  </div>
);

// ─── Page Content ──────────────────────────────────────────────────────────────

const PageContent = ({
  data,
  studentsPage,
  pageIndex,
  totalPages,
  isCompactHeader = false,
}) => {
  const { institute, job, evaluationPoints, signatures } = data;

  const signaturesArr = Array.isArray(signatures)
    ? signatures
    : ["Instructor Signature", "Group Instructor Signature", "Principal"];

  return (
    <div className="w-full h-full bg-white text-black box-border p-4">
      {/* Thick outer frame */}
      <div className="h-full border-[3px] border-black flex flex-col p-2 box-border">

        {/* Header — fixed height */}
        <ReportHeader institute={institute} job={job} isCompact={isCompactHeader} />

        {/* ── Two-column body — flex-1 takes ALL remaining space ── */}
        <div className="flex gap-2 flex-1 min-h-0 pt-2">
          
          {/* LEFT column — justify-end pushes eval table to bottom */}
          <div className="w-96 shrink-0 flex flex-col justify-end overflow-hidden">
            
            {job?.images && job.images.length > 0 && (
              <div className="flex-1 flex flex-col gap-2 pb-2 min-h-0 overflow-hidden justify-center pr-2">
                {job.images.slice(0, 2).map((imgUrl, idx) => (
                  <div key={idx} className="flex-1 w-full border border-gray-300 bg-gray-50 rounded flex flex-col items-center justify-center overflow-hidden relative">
                    <img src={imgUrl} alt={`Job Diagram ${idx + 1}`} className="absolute inset-0 w-full h-full object-contain p-1" />
                  </div>
                ))}
              </div>
            )}

            <div className="pr-2">
              <EvaluationPointsTable evaluationPoints={evaluationPoints || []} />
            </div>
          </div>

          {/* RIGHT column — student table fills the full height */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <StudentEvaluationTable
              students={studentsPage}
              evaluationPoints={evaluationPoints || []}
            />
          </div>
        </div>

        {/* Footer — fixed height */}
        <div className="shrink-0 mt-4">
          <SignatureSection signatures={signaturesArr} />
        </div>
      </div>
    </div>
  );
};

// ─── Main Export ───────────────────────────────────────────────────────────────

const JobEvaluationPrintDynamic = forwardRef(function JobEvaluationPrintDynamic(
  { data = {}, studentsPerPage = 30 },
  ref,
) {
  if (!data || !Array.isArray(data.students)) {
    return (
      <div className="p-8 text-center text-red-600 text-xs">
        Error: Invalid or missing data. Please provide a valid JSON object.
      </div>
    );
  }

  const pages = useMemo(
    () => paginate(data.students, studentsPerPage),
    [data.students, studentsPerPage],
  );

  return (
    <PrintLayout ref={ref} pageSize="a4" orientation="landscape">
      {pages.map((pageStudents, pageIndex) => (
        <PageContent
          key={`page-${pageIndex}`}
          data={data}
          studentsPage={pageStudents}
          pageIndex={pageIndex}
          totalPages={pages.length}
          isCompactHeader={pageIndex > 0}
        />
      ))}
    </PrintLayout>
  );
});

export default JobEvaluationPrintDynamic;
