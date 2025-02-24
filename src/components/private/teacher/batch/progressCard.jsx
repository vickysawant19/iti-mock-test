import React, { useState, useEffect } from "react";
import { addMonths, compareAsc, format, isAfter, parse } from "date-fns";
import { Printer } from "lucide-react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  pdf,
  PDFDownloadLink,
} from "@react-pdf/renderer";



// Register fonts for PDF
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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 10,
  },
  header: {
    marginBottom: 5,
    textAlign: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 12,
  },

  section: {
    marginBottom: 1,
  },
  grid: {
    flexDirection: "row",
    marginBottom: 10,
  },
  gridItem: {
    flex: 1,
    paddingHorizontal: 10,
  },
  labelTop: {
    fontWeight: "bold",
    marginRight: 5,
  },
  label: {
    fontWeight: "bold",
    marginRight: 5,
    textAlign: "center",
    textTransform: "uppercase",
  },
  table: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#000",
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    height: "7rem",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 25,
  },
  tableCell: {
    borderRightWidth: 1,
    textAlign: "center",
    borderColor: "#000",
    justifyContent: "center",
  },
  tableCellLast: {
    padding: 4,
    justifyContent: "center",
    textAlign: "center",
  },
  tableCellHeader: {
    padding: 4,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: "#000",
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
  },
  tableCellHeaderLast: {
    padding: 4,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    borderTopWidth: 1,
  },
  subHeaderContainer: {
    borderRightWidth: 1,
    borderColor: "#000",
  },
  subHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  subCell: {
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 1,
    flex: 1,
    textAlign: "center",
  },
  lastSubCell: {
    padding: 4,
    flex: 1,
    textAlign: "center",
  },

  // Modified styles for nested headers
  nestedColumn: {
    borderRightWidth: 1,
    borderColor: "#000",
    fontWeight: "bold",
  },
  nestedColumnLast: {
    borderRightWidth: 0,
  },
  nestedHeader: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "#000",
    padding: 4,
    backgroundColor: "#f3f4f6",
    textAlign: "center",
  },
  nestedContent: {
    flexDirection: "row",
    flex: 1,
  },
  nestedCell: {
    flex: 1,
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  nestedCellLast: {
    flex: 1,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
});

const ProgressCardPDF = ({
  student,
  monthlyRecords = {},
  quarterlyTests = [],
  batch
}) => {
  if (!student) return null;

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch {
      return "-";
    }
  };

  const endDate = addMonths(batch.start_date, 11);
  let currentDate = new Date(batch.start_date);

  const completeRecords = {};

  while (!isAfter(currentDate, endDate)) {
    const monthKey = format(currentDate, "MMMM yyyy");
    completeRecords[monthKey] = monthlyRecords[monthKey] || {}; // Keep existing or add empty
    currentDate = addMonths(currentDate, 1);
  }
  // Extract months from monthlyRecords object and sort them chronologically
  const sortedMonthlyRecords = Object.entries(completeRecords).sort((a, b) => {
    const monthsOrder = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthA = a[0].split("-")[0];
    const monthB = b[0].split("-")[0];
    return monthsOrder.indexOf(monthA) - monthsOrder.indexOf(monthB);
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            DIRECTORATE OF VOCATIONAL EDUCATION & TRAINING
          </Text>
          <Text style={styles.headerSubtitle}>
            Industrial Training Institute, Dodamarg
          </Text>
          <Text style={[styles.headerTitle, { marginTop: 10 }]}>
            PROGRESS CARD
          </Text>
        </View>

        {/* Student Details Section */}
        <View style={styles.section}>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text>
                <Text style={styles.labelTop}>Name of Trainee:</Text>
                {student.userName || "-"}
              </Text>
              <Text>
                <Text style={styles.labelTop}>Date of Birth:</Text>
                {student.DOB ? formatDate(student.DOB) : "-"}
              </Text>
              <Text>
                <Text style={styles.labelTop}>Trade:</Text>
                {student.trade || "-"}
              </Text>
              <Text>
                <Text style={styles.labelTop}>Edu. Qual.:</Text>
                {student.educationQualification || "-"}
              </Text>
              <Text>
                <Text style={styles.labelTop}>Stipend:</Text>
                {student.stipend ? "YES" : "NO"}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text>
                <Text style={styles.labelTop}>Trainee Code:</Text>
                {student.registerId || "-"}
              </Text>
              <Text>
                <Text style={styles.labelTop}>CMD Rec. No.:</Text>
                {student.cmdRecordNumber || "-"}
              </Text>
              <Text>
                <Text style={styles.labelTop}>Permanent Address:</Text>
                {student.address || "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Monthly Record Table */}
        <View style={styles.table}>
          <Text
            style={[
              styles.label,
              { marginBottom: 5, marginLeft: 4, textAlign: "center" },
            ]}
          >
            Monthly Record
          </Text>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCellHeader, { width: "5%" }]}>
              <Text>Sr. No.</Text>
            </View>
            <View style={[styles.tableCellHeader, { width: "10%" }]}>
              <Text>Month</Text>
            </View>
            <View style={[styles.tableCellHeader, { width: "10%" }]}>
              <Text>Theory (100)</Text>
            </View>
            <View style={[styles.tableCellHeader, { width: "10%" }]}>
              <Text>Practical (250)</Text>
            </View>
            <View style={[styles.nestedColumn, { width: "15%" }]}>
              <View style={styles.nestedHeader}>
                <Text>Attendance</Text>
              </View>
              <View style={styles.nestedContent}>
                <View style={[styles.subCell, {}]}>
                  <Text>Possible Days</Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>Present</Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCellHeader, { width: "10%" }]}>
              <Text>Progress %</Text>
            </View>
            <View style={[styles.nestedColumn, { width: "20%" }]}>
              <View style={styles.nestedHeader}>
                <Text>Signature</Text>
              </View>
              <View style={styles.nestedContent}>
                <View style={styles.subCell}>
                  <Text>Trade Instructor</Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>Group Instructor</Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCellHeaderLast, { width: "20%" }]}>
              <Text>Remarks</Text>
            </View>
          </View>

          {sortedMonthlyRecords.map(([month, record], index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "5%" }]}>
                <Text>{index + 1}</Text>
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text>{format(month, "MMM-yyyy")}</Text>
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text>{record.theory ? `${record.theory}/100` : "-"}</Text>
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text>
                  {record.practical ? `${record.practical}/250` : "-"}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  {
                    width: "15%",
                    borderRightWidth: 1,
                    flexDirection: "row",
                  },
                ]}
              >
                <View style={[styles.subCell, { borderRightWidth: 1 }]}>
                  <Text>{record.presentDays + record.absentDays || "-"}</Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>{record.presentDays || "-"}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "10%", textAlign: "center" },
                ]}
              >
                <Text>
                  {record.presentDays && record.presentDays + record.absentDays
                    ? (
                        (record.presentDays /
                          (record.presentDays + record.absentDays)) *
                        100
                      ).toFixed(2)
                    : "-"}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "20%", flexDirection: "row" },
                ]}
              >
                <View style={styles.subCell}>
                  <Text>{}</Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>{}</Text>
                </View>
              </View>
              <View style={[styles.tableCellLast, { width: "10%" }]}>
                <Text>{record.remarks || "-"}</Text>
              </View>
            </View>
          ))}

          {/* Average Row */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: "5%" }]}>
              <Text></Text>
            </View>
            <View style={[styles.tableCell, { width: "10%" }]}>
              <Text>Average</Text>
            </View>
            <View style={[styles.tableCell, { width: "10%" }]}>
              <Text></Text>
            </View>
            <View style={[styles.tableCell, { width: "10%" }]}>
              <Text></Text>
            </View>
            <View
              style={[styles.tableCell, { width: "15%", flexDirection: "row" }]}
            >
              <View style={styles.subCell}>
                <Text></Text>
              </View>
              <View style={styles.lastSubCell}>
                <Text></Text>
              </View>
            </View>
            <View style={[styles.tableCell, { width: "10%" }]}>
              <Text>
                {Object.entries(monthlyRecords).length > 0
                  ? (
                      Object.entries(monthlyRecords).reduce(
                        (sum, [_, record]) => {
                          const progress =
                            record.presentDays &&
                            record.presentDays + record.absentDays
                              ? (record.presentDays /
                                  (record.presentDays + record.absentDays)) *
                                100
                              : 0;
                          return sum + progress;
                        },
                        0
                      ) / Object.entries(monthlyRecords).length
                    ).toFixed(2)
                  : "-"}
              </Text>
            </View>
            <View
              style={[styles.tableCell, { width: "20%", flexDirection: "row" }]}
            >
              <View style={styles.subCell}></View>
              <View style={styles.lastSubCell}></View>
            </View>

            <View style={[styles.tableCellLast, { width: "10%" }]}></View>
          </View>
        </View>

        {/* Quarterly Tests Table */}
        <View style={styles.table}>
          <Text style={[styles.label, { marginBottom: 5, marginLeft: 4 }]}>
            QUARTERLY TESTS
          </Text>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCellHeader, { width: "10%" }]}>
              <Text>Quart. No.</Text>
            </View>
            <View style={[styles.nestedColumn, { width: "30%" }]}>
              <View style={[styles.nestedHeader]}>
                <Text>Marks</Text>
              </View>
              <View style={styles.nestedContent}>
                <View style={styles.subCell}>
                  <Text>Practical</Text>
                </View>
                <View style={styles.subCell}>
                  <Text>Theory</Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>Empl. Skills</Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCellHeader, { width: "15%" }]}>
              <Text>Character & Communication</Text>
            </View>
            <View style={[styles.nestedColumn, { width: "30%" }]}>
              <View style={[styles.nestedHeader]}>
                <Text>Signature</Text>
              </View>
              <View style={styles.nestedContent}>
                <View style={styles.subCell}>
                  <Text>Trade Instructor</Text>
                </View>
                <View style={styles.subCell}>
                  <Text>Group Instructor</Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>Principal</Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCellHeaderLast, { width: "15%" }]}>
              <Text>Remarks</Text>
            </View>
          </View>

          {quarterlyTests.map((test, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text>Q{test.quarter}</Text>
              </View>
              <View style={[styles.tableCell, { width: "30%" }]}>
                <View style={{ flexDirection: "row" }}>
                  <View style={styles.subCell}>
                    <Text>{test.practical || "-"}</Text>
                  </View>
                  <View style={styles.subCell}>
                    <Text>{test.theory || "-"}</Text>
                  </View>
                  <View style={styles.lastSubCell}>
                    <Text>{test.skills || "-"}</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.tableCell, { width: "15%" }]}>
                <Text>{test.characterCom || "-"}</Text>
              </View>
              <View style={[styles.tableCell, { width: "30%" }]}>
                <View style={{ flexDirection: "row" }}>
                  <View style={styles.subCell}>
                    <Text>{test.signature || "-"}</Text>
                  </View>
                  <View style={styles.subCell}>
                    <Text>-</Text>
                  </View>
                  <View style={styles.lastSubCell}>
                    <Text>-</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.tableCellLast, { width: "15%" }]}>
                <Text>{test.remarks || "-"}</Text>
              </View>
            </View>
          ))}

          {/* Average Row for Quarterly Tests */}
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, { width: "10%" }]}>
              <Text>Average</Text>
            </View>
            <View style={[styles.tableCell, { width: "30%" }]}>
              <View style={{ flexDirection: "row" }}>
                <View style={styles.subCell}>
                  <Text>
                    {quarterlyTests.length > 0
                      ? (
                          quarterlyTests.reduce(
                            (sum, test) => sum + (test.practical || 0),
                            0
                          ) / quarterlyTests.length
                        ).toFixed(2)
                      : "-"}
                  </Text>
                </View>
                <View style={styles.subCell}>
                  <Text>
                    {quarterlyTests.length > 0
                      ? (
                          quarterlyTests.reduce(
                            (sum, test) => sum + (test.theory || 0),
                            0
                          ) / quarterlyTests.length
                        ).toFixed(2)
                      : "-"}
                  </Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>
                    {quarterlyTests.length > 0
                      ? (
                          quarterlyTests.reduce(
                            (sum, test) => sum + (test.skills || 0),
                            0
                          ) / quarterlyTests.length
                        ).toFixed(2)
                      : "-"}
                  </Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCell, { width: "15%" }]}>
              <Text></Text>
            </View>
            <View style={[styles.tableCell, { width: "30%" }]}>
              <View style={{ flexDirection: "row" }}>
                <View style={styles.subCell}>
                  <Text></Text>
                </View>
                <View style={styles.subCell}>
                  <Text></Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text></Text>
                </View>
              </View>
            </View>
            <View style={[styles.tableCellLast, { width: "15%" }]}>
              <Text></Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const ProgressCard = ({ studentProfiles = [], stats, isLoading, batchData }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  if (isLoading) return <div>Loading...</div>;

  useEffect(() => {
    const generatePreview = async () => {
      if (!selectedStudent) {
        setPdfUrl("");
        return;
      }

      try {
        const blob = await pdf(
          <ProgressCardPDF
          batch={batchData}
            student={selectedStudent}
            monthlyRecords={
              stats.find((item) => item.userId === selectedStudent.userId)
                ?.monthlyAttendance || {}
            }
            quarterlyTests={selectedStudent.quarterlyTests || []}
          />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error("Error generating PDF:", error);
        setPdfUrl("");
      }
    };

    generatePreview();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [selectedStudent, stats]);

  return (
    <div className="w-full max-w-4xl mx-auto ">
      <div className="mb-4 flex justify-between items-center ">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-[280px] flex justify-between items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            <span className="text-gray-700">
              {selectedStudent ? selectedStudent.userName : "Select student"}
            </span>
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
              {studentProfiles.map((student) => (
                <div
                  key={student.userId}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedStudent(student);
                    setIsDropdownOpen(false);
                  }}
                >
                  {student.userName}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedStudent && (
          <PDFDownloadLink
            document={
              <ProgressCardPDF
                batch={batchData}
                student={selectedStudent}
                monthlyRecords={
                  stats.find((item) => item.userId === selectedStudent.userId)
                    ?.monthlyAttendance || {}
                }
                quarterlyTests={selectedStudent.quarterlyTests || []}
              />
            }
            fileName={`progress-card-${selectedStudent.userName}.pdf`}
            className="flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {({ loading }) => (
              <>
                <Printer className="h-4 w-4" />
                {loading ? "Generating PDF..." : "Download PDF"}
              </>
            )}
          </PDFDownloadLink>
        )}
      </div>

      <div className="overflow-hidden border rounded-lg shadow-sm">
        {selectedStudent ? (
          pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[842px] border-0"
              title="Progress Card Preview"
            />
          ) : (
            <div className="w-full h-[842px] flex items-center justify-center">
              <p className="text-gray-500">Generating preview...</p>
            </div>
          )
        ) : (
          <div className="w-full h-[842px] flex items-center justify-center bg-white">
            <p className="text-gray-500">
              Select a student to view their progress card
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressCard;
