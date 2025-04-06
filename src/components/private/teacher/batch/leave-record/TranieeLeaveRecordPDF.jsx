import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

import { addMonths, differenceInMonths, format } from "date-fns";

import devtLogo from "../../../../../assets/dvet-logo.png";
import bodhChinha from "../../../../../assets/bodh-chinha.png";

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

Font.registerHyphenationCallback((word) => {
  return [word];
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 10,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingVertical: 5,
  },
  logoContainer: {
    width: 70,
    height: 70,
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  header: {
    textAlign: "center",
    maxWidth: "70%",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  headerSubtitle: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    width: "100%",
  },
  section: {
    marginBottom: 10,
  },
  studentDetailsSection: {
    paddingVertical: 5,
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
  valueText: {
    marginLeft: 5,
  },
  boldText: {
    fontWeight: "bold",
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
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#000",
    minHeight: 25,
  },
  tableRowLast: {
    flexDirection: "row",
    minHeight: 25,
  },
  tableCell: {
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 4,
    textAlign: "center",
    justifyContent: "center",
  },
  tableCellHeader: {
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#000",
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    textAlign: "center",
  },
  tableCellHeaderLast: {
    padding: 4,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    textAlign: "center",
  },
  tableCellLast: {
    padding: 4,
    textAlign: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  percentageRow: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
  },
});

const TraineeLeaveRecordPDF = ({ batch, student, leaveRecords }) => {
  // Process monthly attendance records
  const processAttendanceRecords = (leaveRecords, batch) => {
    // Convert monthly attendance into a structured format
    let attendanceMap = {};

    if (leaveRecords?.monthlyAttendance) {
      Object.entries(leaveRecords.monthlyAttendance).forEach(
        ([dateStr, data]) => {
          try {
            // Format the month key
            const month = format(new Date(dateStr), "MMM yy");
            attendanceMap[month] = {
              possibleDays: data.absentDays + data.presentDays,
              presentDays: data.presentDays,
              sickLeave: 0,
              casualLeave: 0,
            };
          } catch (error) {
            console.error(`Error processing date: ${dateStr}`, error);
          }
        }
      );
    }

    // Get all months between start and end date
    const getMonthsArray = (startDate, endDate, formatStr = "MMM yy") => {
      // Ensure we have Date objects
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Calculate number of months between dates (including both start and end months)
      const monthDiff = differenceInMonths(end, start) + 1;

      // Generate array of month names
      return Array.from({ length: monthDiff }, (_, i) => {
        const date = addMonths(start, i);
        return format(date, formatStr); // 'MMM' gives "Jan", "Feb", etc.
      });
    };

    // Get all months from batch start to end date
    const allMonths = getMonthsArray(batch.start_date, batch.end_date);

    // Create complete attendance object with all months (including empty ones)
    const completeAttendance = allMonths.reduce((acc, month) => {
      acc[month] = attendanceMap[month] || {
        possibleDays: "",
        presentDays: "",
        sickLeave: "",
        casualLeave: "",
        percent: "",
      };
      return acc;
    }, {});

    // Create pages with 12 months per page
    const monthsPerPage = 12;
    const pages = [];

    for (let i = 0; i < allMonths.length; i += monthsPerPage) {
      const pageMonths = allMonths.slice(i, i + monthsPerPage);
      const pageData = {};

      pageMonths.forEach((month) => {
        pageData[month] = completeAttendance[month];
      });

      pages.push({
        months: pageMonths,
        data: pageData,
        yearRange: `${format(
          addMonths(new Date(batch.start_date), i),
          "MMMM yyyy"
        )} to ${format(
          addMonths(
            new Date(batch.start_date),
            Math.min(
              i + 11,
              differenceInMonths(
                new Date(batch.end_date),
                new Date(batch.start_date)
              )
            )
          ),
          "MMMM yyyy"
        )}`,
      });
    }

    return {
      completeAttendance,
      pages,
    };
  };

  // Calculate percentage for a specific month
  const calculatePercentage = (attendanceData) => {
    if (!attendanceData || attendanceData.possibleDays === 0) {
      return "-";
    }
    const percentage =
      (attendanceData.presentDays / attendanceData.possibleDays) * 100;
    return isNaN(percentage) ? "-" : `${Math.round(percentage)}%`;
  };

  // Usage example
  const processStudentData = (student, leaveRecords, batch) => {
    if (!student) return null;

    // Get attendance data and pages
    const { completeAttendance, pages } = processAttendanceRecords(
      leaveRecords,
      batch
    );

    // Create default data structure
    const defaultData = {
      attendance: completeAttendance,
      pages: pages,
      stipend: "Yes",
      casualLeaveRecords: [],
      medicalLeaveRecords: [],
      parentMeetings: [],
    };

    // Merge with provided data or use defaults
    return { ...student, ...defaultData };
  };
  const data = processStudentData(student, leaveRecords, batch);
  return (
    <Document>
      {data.pages.map((pageData) => (
        <Page size="LEGAL" style={styles.page}>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            {/* Left Logo (DVET) */}
            <View style={styles.logoContainer}>
              <Image style={styles.logo} src={devtLogo} />
            </View>

            {/* Center Text */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { textAlign: "center" }]}>
                {data.collageName}
              </Text>
              <Text style={styles.headerSubtitle}>TRAINEE LEAVE RECORD</Text>
            </View>

            {/* Right Logo (Bodh Chinha) */}
            <View style={styles.logoContainer}>
              <Image style={styles.logo} src={bodhChinha} />
            </View>
          </View>

          {/* Student Details Section */}
          <View style={styles.studentDetailsSection}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text>
                  <Text style={styles.boldText}>Trainee Name: </Text>
                  {data.userName}
                </Text>
                <Text>
                  <Text style={styles.boldText}>Trade: </Text>
                  {data.tradeName}
                </Text>
                <Text>
                  <Text style={styles.boldText}>Exam Seat No.: </Text>
                  {data.registerId}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text>
                  <Text style={styles.boldText}>Year: </Text>
                  {pageData.yearRange}
                </Text>
                <Text>
                  <Text style={styles.boldText}>Address: </Text>
                  {data.address}
                </Text>
                <Text>
                  <Text style={styles.boldText}>Stipend: </Text>
                  {data.stipend}/No
                </Text>
              </View>
            </View>
          </View>

          {/* Attendance Details Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ATTENDANCE DETAILS</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={[styles.tableCellHeader, { width: "16%" }]}>
                  <Text>Months</Text>
                </View>
                {pageData.months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === pageData.months.length - 1
                        ? [styles.tableCellHeaderLast, { width: "7%" }]
                        : [styles.tableCellHeader, { width: "7%" }]
                    }
                  >
                    <Text>{month}</Text>
                  </View>
                ))}
              </View>

              {/* Possible Days */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { width: "16%" }]}>
                  <Text>Possible Days</Text>
                </View>
                {pageData.months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === pageData.months.length - 1
                        ? [styles.tableCellLast, { width: "7%" }]
                        : [styles.tableCell, { width: "7%" }]
                    }
                  >
                    <Text>
                      {data.attendance[month]
                        ? data.attendance[month].possibleDays
                        : ""}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Present Days */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { width: "16%" }]}>
                  <Text>Present Days</Text>
                </View>
                {pageData.months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === pageData.months.length - 1
                        ? [styles.tableCellLast, { width: "7%" }]
                        : [styles.tableCell, { width: "7%" }]
                    }
                  >
                    <Text>
                      {data.attendance[month]
                        ? data.attendance[month].presentDays
                        : ""}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Sick Leave */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { width: "16%" }]}>
                  <Text>Sick Leave</Text>
                </View>
                {pageData.months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === pageData.months.length - 1
                        ? [styles.tableCellLast, { width: "7%" }]
                        : [styles.tableCell, { width: "7%" }]
                    }
                  >
                    <Text>
                      {data.attendance[month]
                        ? data.attendance[month].sickLeave
                        : ""}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Casual Leave */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { width: "16%" }]}>
                  <Text>Casual Leave C.L.</Text>
                </View>
                {pageData.months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === pageData.months.length - 1
                        ? [styles.tableCellLast, { width: "7%" }]
                        : [styles.tableCell, { width: "7%" }]
                    }
                  >
                    <Text>
                      {data.attendance[month]
                        ? data.attendance[month].casualLeave
                        : ""}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Percentage Row */}
              <View style={[styles.tableRowLast, styles.percentageRow]}>
                <View style={[styles.tableCell, { width: "16%" }]}>
                  <Text>Percentage %</Text>
                </View>
                {pageData.months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === pageData.months.length - 1
                        ? [styles.tableCellLast, { width: "7%" }]
                        : [styles.tableCell, { width: "7%" }]
                    }
                  >
                    <Text>{calculatePercentage(data.attendance[month])}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Casual Leave Record */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CASUAL LEAVE RECORD</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCellHeader, { width: "5%" }]}>
                  <Text>Sr. No.</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Date</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "15%" }]}>
                  <Text>Reason</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Sign C.I.</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Sign G.I.</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "5%" }]}>
                  <Text>Sr. No.</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Date</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "15%" }]}>
                  <Text>Reason</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Sign C.I.</Text>
                </View>
                <View style={[styles.tableCellHeaderLast, { width: "10%" }]}>
                  <Text>Sign G.I.</Text>
                </View>
              </View>

              {/* Create 6 pairs of rows (12 entries) */}
              {Array.from({ length: 6 }).map((_, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                  {/* Left side entry */}
                  <View style={[styles.tableCell, { width: "5%" }]}>
                    <Text>{12 - rowIndex}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>

                  {/* Right side entry */}
                  <View style={[styles.tableCell, { width: "5%" }]}>
                    <Text>{6 - rowIndex}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCellLast, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Medical Leave Record */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEDICAL LEAVE RECORD</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCellHeader, { width: "15%" }]}>
                  <Text>Date</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>From To</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Total Days</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "20%" }]}>
                  <Text>Reason</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Order No</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Trainee Sign.</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>Instr. Sign</Text>
                </View>
                <View style={[styles.tableCellHeaderLast, { width: "15%" }]}>
                  <Text>G.I. Sign</Text>
                </View>
              </View>

              {/* Create 3 empty rows for medical leave records */}
              {Array.from({ length: 3 }).map((_, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "20%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCellLast, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Meeting with Parents */}
          <View style={[styles.section, {}]}>
            <Text style={styles.sectionTitle}>MEETING WITH PARENTS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={[styles.tableCellHeader, { width: "5%" }]}>
                  <Text>Sr. No.</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "15%" }]}>
                  <Text>Reason To Meet</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "25%" }]}>
                  <Text>Report to Parents</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "15%" }]}>
                  <Text>Parent Sign</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "15%" }]}>
                  <Text>Instr. Sign</Text>
                </View>
                <View style={[styles.tableCellHeader, { width: "10%" }]}>
                  <Text>G.I. Sign</Text>
                </View>
                <View style={[styles.tableCellHeaderLast, { width: "15%" }]}>
                  <Text>Principal Sign</Text>
                </View>
              </View>

              {/* Create 5 empty rows for parent meetings */}
              {Array.from({ length: 4 }).map((_, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={[styles.tableCell, { width: "5%" }]}>
                    <Text>{index + 1}</Text>
                  </View>
                  <View style={[styles.tableCell, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "25%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCell, { width: "10%" }]}>
                    <Text></Text>
                  </View>
                  <View style={[styles.tableCellLast, { width: "15%" }]}>
                    <Text></Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default TraineeLeaveRecordPDF;
