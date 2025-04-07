import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";

import devtLogo from "../../../../../assets/dvet-logo.png";
import bodhChinha from "../../../../../assets/bodh-chinha.png";
import { format } from "date-fns";
import { calculateAverage, calculateTotalAttendance, formatDate } from "./util";

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
    paddingBottom: 5,
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
    flex: 1,
    textAlign: "center",
    maxWidth: "70%",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    width: "100%",
    alignSelf: "center",
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },

  section: {
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
    height: "6rem",
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
    padding: 3,
    flex: 1,
    textAlign: "center",
  },
  lastSubCell: {
    padding: 3,
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

const ProgressCardPDF = ({ data }) => {
  if (!data) return <Document></Document>;

  return (
    <Document>
      {data?.pages.map((allRecords, index) => (
        <Page size="A4" style={styles.page} key={index}>
          {/* Header Section with logos properly positioned */}
          <View style={styles.headerContainer}>
            {/* Left Logo (DVET) */}
            <View style={styles.logoContainer}>
              <Image style={styles.logo} src={devtLogo} />
            </View>

            {/* Center Text */}
            <View style={styles.header}>
              {/* <Text style={styles.headerTitle}>
              DIRECTORATE OF VOCATIONAL EDUCATION & TRAINING
            </Text> */}
              <Text style={[styles.headerTitle]}>
                {data?.collageName || ""}
              </Text>
              <Text style={styles.progressTitle}>PROGRESS CARD</Text>
            </View>

            {/* Right Logo (Bodh Chinha) */}
            <View style={styles.logoContainer}>
              <Image style={styles.logo} src={bodhChinha} />
            </View>
          </View>

          {/* Student Details Section */}
          <View style={styles.section}>
            <View style={styles.grid}>
              <View style={styles.gridItem}>
                <Text>
                  <Text style={styles.labelTop}>Name of Trainee:</Text>
                  {data?.userName || "-"}
                </Text>
                <Text>
                  <Text style={styles.labelTop}>Date of Birth:</Text>
                  <Text>{data?.DOB ? formatDate(data?.DOB) : "-"}</Text>
                </Text>
                <Text>
                  <Text style={styles.labelTop}>Trade:</Text>
                  {data?.tradeName || "-"}
                </Text>
                <Text>
                  <Text style={styles.labelTop}>Edu. Qual.:</Text>
                  {data?.educationQualification || "-"}
                </Text>
                <Text>
                  <Text style={styles.labelTop}>Stipend:</Text>
                  {data?.stipend ? "YES" : "YES"}
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text>
                  <Text style={styles.labelTop}>Trainee Code:</Text>
                  {data?.registerId || "-"}
                </Text>
                <Text>
                  <Text style={styles.labelTop}>CMD Rec. No.:</Text>
                  {data?.cmdRecordNumber || "-"}
                </Text>
                <Text>
                  <Text style={styles.labelTop}>Permanent Address:</Text>
                  {data?.address || "-"}
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
                    <Text>Present Days</Text>
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

            {allRecords.map(([month, record], index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: "5%" }]}>
                  <Text>{index + 1}</Text>
                </View>
                <View style={[styles.tableCell, { width: "10%" }]}>
                  <Text>{format(month, "MMM-yyyy")}</Text>
                </View>
                <View style={[styles.tableCell, { width: "10%" }]}>
                  <Text>{record.theory ? `${record.theory}` : "-"}</Text>
                </View>
                <View style={[styles.tableCell, { width: "10%" }]}>
                  <Text>{record.practical ? `${record.practical}` : "-"}</Text>
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
                    {record.presentDays &&
                    record.presentDays + record.absentDays
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
                <Text>{calculateAverage(allRecords, "theory", 100)}</Text>
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text>{calculateAverage(allRecords, "practical", 250)}</Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "15%", flexDirection: "row" },
                ]}
              >
                <View style={styles.subCell}>
                  <Text></Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text></Text>
                </View>
              </View>
              <View style={[styles.tableCell, { width: "10%" }]}>
                <Text>{calculateTotalAttendance(allRecords)}</Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "20%", flexDirection: "row" },
                ]}
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

            {data?.quarterlyTests.map((test, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, { width: "10%" }]}>
                  <Text>Q{test.quarter || index + 1}</Text>
                </View>
                <View
                  style={[
                    styles.tableCell,
                    { width: "30%", flexDirection: "row" },
                  ]}
                >
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
                <View style={[styles.tableCell, { width: "15%" }]}>
                  <Text>{test.characterCom || "-"}</Text>
                </View>
                <View
                  style={[
                    styles.tableCell,
                    { width: "30%", flexDirection: "row" },
                  ]}
                >
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
              <View
                style={[
                  styles.tableCell,
                  { width: "30%", flexDirection: "row" },
                ]}
              >
                <View style={styles.subCell}>
                  <Text>
                    {data?.quarterlyTests.length > 0
                      ? (
                          data?.quarterlyTests.reduce(
                            (sum, test) => sum + (test.practical || 0),
                            0
                          ) / data?.quarterlyTests.length
                        ).toFixed(2)
                      : "-"}
                  </Text>
                </View>
                <View style={styles.subCell}>
                  <Text>
                    {data?.quarterlyTests.length > 0
                      ? (
                          data?.quarterlyTests.reduce(
                            (sum, test) => sum + (test.theory || 0),
                            0
                          ) / data?.quarterlyTests.length
                        ).toFixed(2)
                      : "-"}
                  </Text>
                </View>
                <View style={styles.lastSubCell}>
                  <Text>
                    {data?.quarterlyTests.length > 0
                      ? (
                          data?.quarterlyTests.reduce(
                            (sum, test) => sum + (test.skills || 0),
                            0
                          ) / data?.quarterlyTests.length
                        ).toFixed(2)
                      : "-"}
                  </Text>
                </View>
              </View>
              <View style={[styles.tableCell, { width: "15%" }]}>
                <Text></Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "30%", flexDirection: "row" },
                ]}
              >
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
              <View style={[styles.tableCellLast, { width: "15%" }]}>
                <Text></Text>
              </View>
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default ProgressCardPDF;
