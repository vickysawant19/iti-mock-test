import { Document, Page, View, Text, Font } from "@react-pdf/renderer";

import PdfHeader from "../components/PdfHeader";
import { styles } from "./Styles";
import PdfStudentInfo from "../components/PdfStudentInfo";

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

const TraineeLeaveRecordPDF = ({ data }) => {
  // Calculate percentage for a specific month
  const calculatePercentage = (attendanceData) => {
    if (!attendanceData || attendanceData.possibleDays === 0) {
      return "-";
    }
    const percentage =
      (attendanceData.presentDays / attendanceData.possibleDays) * 100;
    return isNaN(percentage) ? "-" : `${Math.round(percentage)}%`;
  };

  return (
    <Document>
      {data?.pages?.map((pageData, index) => (
        <Page key={index} size="LEGAL" style={styles.page}>
          {/* Header Section */}
          <PdfHeader
            collageName={data.collageName}
            heading={"TRAINEE LEAVE RECORD"}
            styles={styles}
          />

          {/* Student Details Section */}
          <PdfStudentInfo data={data} yearRange={pageData.yearRange} />

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
                    <Text>{pageData?.data[month]?.possibleDays || ""}</Text>
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
                    <Text>{pageData?.data[month]?.presentDays || ""}</Text>
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
                    <Text>{pageData?.data[month]?.sickLeave}</Text>
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
                    <Text>{pageData?.data[month]?.casualLeave}</Text>
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
                    <Text>{calculatePercentage(pageData?.data[month])}</Text>
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
