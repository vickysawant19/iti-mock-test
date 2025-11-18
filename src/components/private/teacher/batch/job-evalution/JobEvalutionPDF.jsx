import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { addDays, format } from "date-fns";

/* -------------------------
   Register fonts (Roboto)
   ------------------------- */
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: "bold",
    },
  ],
});

/* -------------------------
   Styles
   ------------------------- */
const styles = StyleSheet.create({
  page: {
    padding: 16,
    fontFamily: "Roboto",
    fontSize: 8,
    paddingLeft: 18,
    paddingRight: 18,
  },

  /* Header */
  headerSection: {
    width: "100%",
    fontSize: 9,
    border: "2px solid black",
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 6,
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: "bold",
  },
  headerSubtitle: {
    textAlign: "center",
    fontSize: 9,
    marginBottom: 4,
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },

  /* Two-column layout */
  rowContainer: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  leftColumn: {
    width: "38%",
    flexDirection: "column",
  },
  rightColumn: {
    width: "62%",
    flex: 1,
  },

  /* Images */
  imagePlaceholder: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000",
    width: "100%",
    minHeight: 60,
    maxHeight: 120,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    marginBottom: 6,
  },
  imageWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
  },

  /* Eval Table */
  evalTableContainer: {
    marginTop: 4,
  },
  evalTable: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    fontSize: 8,
  },
  evalTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderColor: "#000",
    fontWeight: "bold",
  },
  evalTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 10,
    alignItems: "center",
  },
  evalTableCell: {
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#000",
    textAlign: "center",
  },
  evalLastTableCell: {
    padding: 3,
    textAlign: "center",
  },

  /* Student marks table */
  table: {
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
    fontWeight: "bold",
    minHeight: 18,
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
    alignItems: "center",
  },
  tableCell: {
    padding: 3,
    borderRightWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
    textAlign: "center",
    overflow: "hidden",
  },
  lastTableCell: {
    padding: 3,
    textAlign: "center",
    overflow: "hidden",
  },

  /* Signature area */
  signatureSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderColor: "#000",
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 2,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  signatureBlock: {
    width: "33%",
    textAlign: "center",
    fontSize: 7,
  },

  /* small helpers */
  smallText: { fontSize: 7 },
});

/* -------------------------
   Helpers
   ------------------------- */

/**
 * chunk(array, size) -> split array into pages
 */
const chunk = (array = [], size = 24) => {
  if (!Array.isArray(array) || size <= 0) return [];
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
};

/**
 * getImageLayout(count)
 * returns columns and rows for a compact grid
 */
const getImageLayout = (count) => {
  if (!count || count <= 0) return { columns: 1, rows: 1 };
  if (count === 1) return { columns: 1, rows: 1 };
  if (count === 2) return { columns: 2, rows: 1 };
  if (count <= 4) return { columns: 2, rows: Math.ceil(count / 2) };
  if (count <= 6) return { columns: 3, rows: Math.ceil(count / 3) };
  const cols = Math.ceil(Math.sqrt(count));
  return { columns: cols, rows: Math.ceil(count / cols) };
};

/* -------------------------
   Student data generator
   - uses studentsMap (Map or object-like) and moduleData
   - checks attendance in next 7 days from module startDate
   ------------------------- */
const generateStudentData = (studentsMap, moduleData, studentAttendance) => {
  // normalize studentsMap -> array of students
  let studentsArray = [];
  if (!studentsMap) studentsArray = [];
  else if (studentsMap instanceof Map) {
    studentsArray = Array.from(studentsMap.values());
  } else if (Array.isArray(studentsMap)) {
    studentsArray = studentsMap;
  } else if (typeof studentsMap === "object") {
    // object with numeric keys or userIds
    studentsArray = Object.values(studentsMap);
  }

  const startDate = moduleData?.startDate ? new Date(moduleData.startDate) : null;

  return studentsArray.map((student, idx) => {
    const srNo = (idx + 1).toString();
    let isPresentInAnyDay = false;
    if (student && startDate && studentAttendance) {
      for (let j = 0; j < 7; j++) {
        const checkDate = addDays(startDate, j);
        const dateKey = format(checkDate, "yyyy-MM-dd");
        if (
          studentAttendance?.[student.userId] &&
          studentAttendance[student.userId][dateKey] === "present"
        ) {
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
      srNo,
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

/* -------------------------
   ModulePage component
   - Renders one module as one or multiple PDF pages (pagination inside)
   ------------------------- */

const ModulePage = ({
  moduleData = {},
  studentsMap,
  college = {},
  studentAttendance = {},
  rowsPerPage = 24,
  containerHeight = 350,
  minRowHeight = 14,
}) => {
  // generate base student data array
  const studentDataAll = generateStudentData(studentsMap, moduleData, studentAttendance) || [];

  // paginate
  const pages = chunk(studentDataAll, rowsPerPage);

  // images layout
  const images = Array.isArray(moduleData?.images) ? moduleData.images : [];
  const { columns: imgCols, rows: imgRows } = getImageLayout(images.length);
  const imageWidthPercent = `${100 / Math.max(1, imgCols)}%`;
  const imageHeightPercent = `${100 / Math.max(1, imgRows)}%`;

  // evaluation points (fallback to 5 blanks)
  const evalPoints =
    Array.isArray(moduleData?.evalutionsPoints) && moduleData.evalutionsPoints.length > 0
      ? moduleData.evalutionsPoints
      : new Array(5).fill(null).map(() => ({ evaluation: "", points: "" }));

  // safe total for eval points (if provided)
  const evalTotal = Array.isArray(moduleData?.evalutionsPoints)
    ? moduleData.evalutionsPoints.reduce((acc, doc) => acc + (+doc.points || 0), 0)
    : "";

  return (
    <>
      {/* Render one Page per 'pages' element */}
      {pages.length === 0 ? (
        // If no students, still render a single page with header + empty table
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>
              {college.collageName || "Industrial Training Institute"}
            </Text>
            <Text style={styles.headerSubtitle}>JOB EVALUATION REPORT</Text>
            <View style={styles.headerRow}>
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text style={{ fontWeight: "bold" }}>Job No.: </Text>
                <Text>{moduleData.moduleId ? moduleData.moduleId.slice(1) : "________"}</Text>
              </View>
              <View style={{ display: "flex", flexDirection: "row" }}>
                <Text style={{ fontWeight: "bold" }}>Date of Starting:</Text>
                <Text style={{ marginLeft: 6 }}>{moduleData.startDate || "________________"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rowContainer}>
            <View style={styles.leftColumn}>
              <View style={styles.imagePlaceholder}>
                {/* empty placeholder */}
              </View>

              <View style={styles.evalTableContainer}>
                <Text style={{ textAlign: "center", fontWeight: "bold", marginBottom: 4, fontSize: 8 }}>
                  Evaluation Points
                </Text>
                <View style={styles.evalTable}>
                  <View style={styles.evalTableHeader}>
                    <Text style={[styles.evalTableCell, { width: "10%" }]}>No.</Text>
                    <Text style={[styles.evalTableCell, { width: "80%", textAlign: "left", paddingLeft: 3 }]}>
                      Point
                    </Text>
                    <Text style={[styles.evalLastTableCell, { width: "10%" }]}>Score</Text>
                  </View>
                  {evalPoints.map((item, idx) => (
                    <View key={`empty-ev-${idx}`} style={styles.evalTableRow}>
                      <Text style={[styles.evalTableCell, { width: "10%", fontWeight: "bold" }]}>
                        {["A", "B", "C", "D", "E", "F"][idx] ?? idx + 1}
                      </Text>
                      <Text style={[styles.evalTableCell, { width: "80%", textAlign: "left", paddingLeft: 3 }]}>{item.evaluation}</Text>
                      <Text style={[styles.evalLastTableCell, { width: "10%" }]}>{item.points}</Text>
                    </View>
                  ))}

                  <View style={styles.evalTableRow}>
                    <Text style={[styles.evalTableCell, { width: "90%", fontWeight: "bold" }]}>
                      Total
                    </Text>
                    <Text style={[styles.evalLastTableCell, { width: "10%" }]}>{evalTotal}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.rightColumn}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, { width: "8%" }]}>Sr. No.</Text>
                  <Text style={[styles.tableCell, { width: "42%", textAlign: "left", paddingLeft: 4 }]}>
                    Name
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>A</Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>B</Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>C</Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>D</Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>E</Text>
                  <Text style={[styles.lastTableCell, { width: "10%", fontWeight: "bold" }]}>Total</Text>
                </View>

                {/* empty note */}
                <View style={[styles.tableRow, { minHeight: 60, alignItems: "center", justifyContent: "center" }]}>
                  <Text>No students available</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.signatureSection}>
            <View style={styles.signatureBlock}>
              <Text>Instructor Signature </Text>
            </View>
            <Text style={styles.signatureBlock}>Group Instructor Signature</Text>
            <Text style={styles.signatureBlock}>
              {college.collageName || "Industrial Training Institute"}
            </Text>
          </View>
        </Page>
      ) : (
        pages.map((pageRows, pageIndex) => {
          // compute rowHeight for this page (clamped)
          const rowsOnThisPage = Math.max(1, pageRows.length);
          const rawRowHeight = containerHeight / rowsOnThisPage;
          const rowHeight = Math.max(minRowHeight, Math.round(rawRowHeight));

          // scale font slightly to rowHeight for readability (within bounds)
          const baseFontSize = Math.max(6, Math.min(9, Math.round(rowHeight * 0.35)));

          return (
            <Page size="A4" orientation="landscape" style={styles.page} key={`page-${pageIndex}`}>
              {/* Header repeated on each page */}
              <View style={styles.headerSection}>
                <Text style={styles.headerTitle}>{college.collageName || "Industrial Training Institute"}</Text>
                <Text style={styles.headerSubtitle}>JOB EVALUATION REPORT</Text>

                <View style={styles.headerRow}>
                  <View style={{ display: "flex", flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Job No.: </Text>
                    <Text>{moduleData.moduleId ? moduleData.moduleId.slice(1) : "________"}</Text>
                  </View>

                  <View style={{ display: "flex", flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Date of Starting:</Text>
                    <Text style={{ marginLeft: 6 }}>{moduleData.startDate || "________________"}</Text>
                  </View>
                </View>

                <View style={styles.headerRow}>
                  <View style={{ display: "flex", flexDirection: "row", width: "75%", overflow: "hidden" }}>
                    <Text style={{ fontWeight: "bold" }}>Job title: </Text>
                    <Text style={{ flex: 1, overflow: "hidden" }} numberOfLines={1}>
                      {moduleData.moduleName || "________________________________"}
                    </Text>
                  </View>

                  <View style={{ display: "flex", flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Date of Finish:</Text>
                    <Text style={{ marginLeft: 6 }}>{moduleData.endDate || "________________"}</Text>
                  </View>
                </View>

                <View style={styles.headerRow}>
                  <View style={{ display: "flex", flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Time: </Text>
                    <Text>{`${moduleData.moduleDuration || "________________"}`} Hrs.</Text>
                  </View>

                  {/* page number */}
                  <View>
                    <Text style={{ fontSize: 7 }}>Page {pageIndex + 1} / {pages.length}</Text>
                  </View>
                </View>
              </View>

              {/* Two column content */}
              <View style={styles.rowContainer}>
                <View style={styles.leftColumn}>
                  <View style={styles.imagePlaceholder}>
                    {images.length === 0 && (
                      <View style={{ width: "100%", textAlign: "center", padding: 6 }}>
                        <Text>No images</Text>
                      </View>
                    )}
                    {images.map((img, idx) => (
                      <View
                        key={`img-${idx}`}
                        style={[
                          styles.imageWrapper,
                          {
                            width: imageWidthPercent,
                            height: imageHeightPercent,
                            padding: 2,
                          },
                        ]}
                      >
                        {/* if img.url missing, leave placeholder empty */}
                        {img?.url ? <Image src={img.url} style={styles.image} /> : <Text>—</Text>}
                      </View>
                    ))}
                  </View>

                  <View style={styles.evalTableContainer}>
                    <Text style={{ textAlign: "center", fontWeight: "bold", marginBottom: 4, fontSize: 8 }}>
                      Evaluation Points
                    </Text>
                    <View style={styles.evalTable}>
                      <View style={styles.evalTableHeader}>
                        <Text style={[styles.evalTableCell, { width: "10%" }]}>No.</Text>
                        <Text style={[styles.evalTableCell, { width: "80%", textAlign: "left", paddingLeft: 3 }]}>
                          Point
                        </Text>
                        <Text style={[styles.evalLastTableCell, { width: "10%" }]}>Score</Text>
                      </View>

                      {(Array.isArray(moduleData?.evalutionsPoints) ? moduleData.evalutionsPoints : evalPoints).map(
                        (item, idx) => (
                          <View key={`ev-${idx}`} style={styles.evalTableRow}>
                            <Text style={[styles.evalTableCell, { width: "10%", fontWeight: "bold" }]}>
                              {["A", "B", "C", "D", "E", "F"][idx] ?? idx + 1}
                            </Text>
                            <Text style={[styles.evalTableCell, { width: "80%", textAlign: "left", paddingLeft: 3 }]}>
                              {item?.evaluation ?? ""}
                            </Text>
                            <Text style={[styles.evalLastTableCell, { width: "10%" }]}>{item?.points ?? ""}</Text>
                          </View>
                        )
                      )}

                      <View style={styles.evalTableRow}>
                        <Text style={[styles.evalTableCell, { width: "90%", fontWeight: "bold" }]}>Total</Text>
                        <Text style={[styles.evalLastTableCell, { width: "10%" }]}>{evalTotal}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <View style={styles.table}>
                    <View style={[styles.tableHeader, { minHeight: 18 }]}>
                      <Text style={[styles.tableCell, { width: "8%" }]}>Sr. No.</Text>
                      <Text style={[styles.tableCell, { width: "42%", textAlign: "left", paddingLeft: 4 }]}>
                        Name
                      </Text>
                      <Text style={[styles.tableCell, { width: "10%" }]}>A</Text>
                      <Text style={[styles.tableCell, { width: "10%" }]}>B</Text>
                      <Text style={[styles.tableCell, { width: "10%" }]}>C</Text>
                      <Text style={[styles.tableCell, { width: "10%" }]}>D</Text>
                      <Text style={[styles.tableCell, { width: "10%" }]}>E</Text>
                      <Text style={[styles.lastTableCell, { width: "10%", fontWeight: "bold" }]}>Total</Text>
                    </View>

                    {pageRows.map((row, rIdx) => (
                      <View
                        key={row.id ?? `r-${pageIndex}-${rIdx}`}
                        style={[
                          styles.tableRow,
                          { height: rowHeight, minHeight: minRowHeight, fontSize: baseFontSize },
                        ]}
                      >
                        <Text style={[styles.tableCell, { width: "8%" }]}>{row.srNo}</Text>

                        <Text
                          style={[
                            styles.tableCell,
                            { width: "42%", textAlign: "left", paddingLeft: 4, textTransform: "uppercase" },
                          ]}
                          numberOfLines={1}
                        >
                          {String(row.name).slice(0, 35)}
                        </Text>

                        <Text style={[styles.tableCell, { width: "10%" }]}>{row.A}</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>{row.B}</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>{row.C}</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>{row.D}</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>{row.E}</Text>

                        <Text style={[styles.lastTableCell, { width: "10%", fontWeight: "bold" }]}>{row.total}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.signatureSection}>
                <View style={styles.signatureBlock}>
                  <Text>Instructor Signature </Text>
                </View>
                <Text style={styles.signatureBlock}>Group Instructor Signature</Text>
                <Text style={styles.signatureBlock}>
                  {college.collageName || "Industrial Training Institute"}
                </Text>
              </View>
            </Page>
          );
        })
      )}
    </>
  );
};

/* -------------------------
   Main Document (exports)
   - Accepts multiple modules or a single selectedModule
   ------------------------- */
const JobEvaluationReportPDF = ({
  studentsMap,
  college,
  selectedModule,
  allModules,
  studentAttendance,
  rowsPerPage = 24,
}) => {
  const modulesToRender = Array.isArray(allModules) && allModules.length > 0 ? allModules : [selectedModule];

  return (
    <Document>
      {modulesToRender.map((module, idx) => (
        <ModulePage
          key={`module-${idx}`}
          moduleData={module || {}}
          studentsMap={studentsMap}
          college={college || {}}
          studentAttendance={studentAttendance || {}}
          rowsPerPage={rowsPerPage}
        />
      ))}
    </Document>
  );
};

export default JobEvaluationReportPDF;