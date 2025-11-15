import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { isAfter, addDays, format } from "date-fns";

// Register fonts (using Roboto as an example)
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

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "Roboto",
    fontSize: 8,
    paddingLeft: 30,
  },
  // SECTION 1: Header (full width)
  headerSection: {
    width: "100%",
    fontSize: 9,
    border: "2px solid black",
    paddingHorizontal: 5,
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
  },
  headerSubtitle: {
    textAlign: "center",
    fontSize: 10,
    marginBottom: 5,
    fontWeight: "bold",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  // Row container with two columns: left (40%) and right (60%)
  rowContainer: {
    flexDirection: "row",
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },

  leftColumn: {
    flexDirection: "column",
    width: "40%",
    padding: 5,
  },
  rightColumn: {
    width: "60%",
    padding: 5,
  },

  //image styles
  imagePlaceholder: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000",
    height: "50%",
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  imageWrapper: {
    height: "100%", // Fixed height for the cell (adjust as needed)
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

  // Student Marks Table (with dotted border)
  table: {
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
    minHeight: 12,
    alignItems: "center",
  },
  tableCell: {
    padding: 2,
    borderRightWidth: 1,
    borderColor: "#000",
    borderStyle: "dotted",
    textAlign: "center",
  },
  lastTableCell: {
    padding: 2,
    textAlign: "center",
  },
  // Evaluation Points Table (in left column, below image)
  evalTableContainer: {
    marginTop: 10,
  },
  evalTable: {
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    fontSize: 9,
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
    padding: 2,
    borderRightWidth: 1,
    borderColor: "#000",
    textAlign: "center",
  },
  evalLastTableCell: {
    padding: 2,
    textAlign: "center",
  },
  // SECTION 5: Signatures (full width)
  signatureSection: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderColor: "#000",
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 2,
    paddingHorizontal: 20,
  },
  signatureBlock: {
    width: "33%",
    textAlign: "center",
  },
});

// Generate student data for a specific module
const generateStudentData = (studentsMap, moduleData, studentAttendance) => {
  return Array.from({ length: 24 }, (_, i) => {
    const student = studentsMap.get(i + 1);

    // Use only the startDate from the current module
    const startDate = moduleData?.startDate;
    const referenceDate = startDate ? new Date(startDate) : null;

    // Check attendance for the next 7 days starting from the startDate.
    let isPresentInAnyDay = false;
    if (student && referenceDate) {
      for (let j = 0; j < 7; j++) {
        const checkDate = addDays(referenceDate, j);
        const dateKey = format(checkDate, "yyyy-MM-dd"); // Format the date as "YYYY-MM-DD"
        if (studentAttendance?.[student.userId]?.[dateKey] === "present") {
          isPresentInAnyDay = true;
          break;
        }
      }
    }

    let a, b, c, d, e, total;
    if (isPresentInAnyDay) {
      // If the student is present on any day, assign random marks.
      a = Math.floor(Math.random() * 10) + 10;
      b = Math.floor(Math.random() * 10) + 10;
      c = Math.floor(Math.random() * 10) + 10;
      d = Math.floor(Math.random() * 10) + 10;
      e = Math.floor(Math.random() * 10) + 10;
      total = a + b + c + d + e;
    } else {
      // Otherwise, mark as absent.
      a = b = c = d = e = 0;
      total = "AB";
    }

    return {
      srNo: (i + 1).toString(),
      name: student?.userName || "-",
      A: a.toString(),
      B: b.toString(),
      C: c.toString(),
      D: d.toString(),
      E: e.toString(),
      total: total.toString(),
    };
  });
};

// Helper function to get image layout
const getImageLayout = (count) => {
  let columns;
  if (count === 1) {
    columns = 1;
  } else if (count === 2) {
    columns = 2;
  } else if (count === 3 || count === 4) {
    columns = 2;
  } else if (count === 5 || count === 6) {
    columns = 3;
  } else {
    columns = Math.ceil(Math.sqrt(count)); // fallback for other counts
  }

  const rows = Math.ceil(count / columns);
  return { columns, rows };
};

// Component for a single module page
const ModulePage = ({
  moduleData,
  studentsMap,
  college,
  studentAttendance,
}) => {
  const studentData = generateStudentData(
    studentsMap,
    moduleData,
    studentAttendance
  );

  const images = moduleData?.images || [];
  const { columns, rows } = getImageLayout(images.length);
  const imageWidthPercent = `${100 / rows}%`;
  const imageHeightPercent = `${100 / columns}%`;

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* SECTION 1: Header */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>
          {college.collageName || "Industrial Training Institute"}
        </Text>
        <Text style={styles.headerSubtitle}>JOB EVALUATION REPORT</Text>
        <View style={styles.headerRow}>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <Text style={{ fontWeight: "bold" }}>Job No.: </Text>
            <Text>{`${
              moduleData.moduleId ? moduleData.moduleId.slice(1) : "________"
            }`}</Text>
          </View>
          <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
            <Text style={{ fontWeight: "bold" }}>Date of Starting:</Text>
            <Text>{moduleData.startDate || "________________"}</Text>
          </View>
        </View>
        <View style={[styles.headerRow, {}]}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              width: "80%",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>Job title: </Text>
            <Text style={{ width: "90%" }}>{`${
              moduleData.moduleName || "________________________________"
            }`}</Text>
          </View>
          <View style={{ display: "flex", flexDirection: "row", gap: 5 }}>
            <Text style={{ fontWeight: "bold" }}>Date of Finish:</Text>
            <Text>{moduleData.endDate || "________________"}</Text>
          </View>
        </View>
        <View style={styles.headerRow}>
          <View style={{ display: "flex", flexDirection: "row" }}>
            <Text style={{ fontWeight: "bold" }}>Time: </Text>
            <Text>
              {`${moduleData.moduleDuration || "________________"}`} Hrs.
            </Text>
          </View>
        </View>
      </View>

      {/* SECTION 2 & 3: Two Columns */}
      <View style={styles.rowContainer}>
        <View style={styles.leftColumn}>
          <View style={[styles.imagePlaceholder, { padding: 2 }]}>
            {images.map((img, index) => (
              <View
                key={index}
                style={[
                  styles.imageWrapper,
                  {
                    padding: 1,
                    width: imageWidthPercent,
                    height: imageHeightPercent,
                  },
                ]}
              >
                <Image src={img.url} style={styles.image} />
              </View>
            ))}
          </View>
          <View style={styles.evalTableContainer}>
            <Text
              style={{
                textAlign: "center",
                fontWeight: "bold",
                marginBottom: 5,
              }}
            >
              Evaluation Points
            </Text>
            <View style={styles.evalTable}>
              <View style={styles.evalTableHeader}>
                <Text style={[styles.evalTableCell, { width: "10%" }]}>
                  No.
                </Text>
                <Text style={[styles.evalTableCell, { width: "80%" }]}>
                  Point
                </Text>
                <Text style={[styles.evalLastTableCell, { width: "10%" }]}>
                  Score
                </Text>
              </View>
              {moduleData?.evalutionsPoints
                ? moduleData.evalutionsPoints.map((item, idx) => (
                    <View key={idx} style={styles.evalTableRow}>
                      <Text
                        style={[
                          styles.evalTableCell,
                          { width: "10%", fontWeight: "bold" },
                        ]}
                      >
                        {Array.from(["A", "B", "C", "D", "E", "F"])[idx]}
                      </Text>
                      <Text
                        style={[
                          styles.evalTableCell,
                          {
                            width: "80%",
                            textAlign: "left",
                            paddingHorizontal: 10,
                          },
                        ]}
                      >
                        {item.evaluation}
                      </Text>
                      <Text
                        style={[styles.evalLastTableCell, { width: "10%" }]}
                      >
                        {item.points}
                      </Text>
                    </View>
                  ))
                : Array(5)
                    .fill(0)
                    .map((item, idx) => (
                      <View key={idx} style={styles.evalTableRow}>
                        <Text
                          style={[
                            styles.evalTableCell,
                            { width: "10%", fontWeight: "bold" },
                          ]}
                        >
                          {Array.from(["A", "B", "C", "D", "E", "F"])[idx]}
                        </Text>
                        <Text
                          style={[styles.evalTableCell, { width: "80%" }]}
                        ></Text>
                        <Text
                          style={[styles.evalLastTableCell, { width: "10%" }]}
                        ></Text>
                      </View>
                    ))}
              <View style={styles.evalTableRow}>
                <Text
                  style={[
                    styles.evalTableCell,
                    { width: "90%", fontWeight: "bold" },
                  ]}
                >
                  Total
                </Text>
                <Text style={[styles.evalLastTableCell, { width: "10%" }]}>
                  {moduleData?.evalutionPoints
                    ? moduleData.evalutionPoints.reduce(
                        (acc, doc) => (acc += +doc.points),
                        0
                      )
                    : ""}
                </Text>
              </View>
            </View>
          </View>
        </View>
        {/* Right Column (60%): Student Marks Table */}
        <View style={styles.rightColumn}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { width: "15%" }]}>Sr. No.</Text>
              <Text style={[styles.tableCell, { minWidth: "40%" }]}>Name</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>A</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>B</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>C</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>D</Text>
              <Text style={[styles.tableCell, { width: "15%" }]}>E</Text>
              <Text
                style={[
                  styles.lastTableCell,
                  { width: "15%", fontWeight: "bold" },
                ]}
              >
                Total
              </Text>
            </View>
            {studentData.map((row, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {row.srNo}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { minWidth: "40%", textTransform: "uppercase" },
                  ]}
                >
                  {row.name}
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {row.A}
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {row.B}
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {row.C}
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {row.D}
                </Text>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  {row.E}
                </Text>
                <Text
                  style={[
                    styles.lastTableCell,
                    { width: "15%", fontWeight: "bold" },
                  ]}
                >
                  {row.total}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* SECTION 5: Signatures */}
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
};

const JobEvaluationReportPDF = ({
  studentsMap,
  college,
  selectedModule,
  allModules,
  studentAttendance,
}) => {
  const modulesToRender =
    Array.isArray(allModules) && allModules.length > 0
      ? allModules
      : [selectedModule];

  return (
    <Document>
      {modulesToRender.map((module, index) => (
        <ModulePage
          key={`module-${index}`}
          moduleData={module}
          studentsMap={studentsMap}
          college={college}
          studentAttendance={studentAttendance}
        />
      ))}
    </Document>
  );
};

export default JobEvaluationReportPDF;
