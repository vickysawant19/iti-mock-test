import { Document, Page, View, Text, Font, Image } from "@react-pdf/renderer";

import devtLogo from "../../../../../assets/dvet-logo.png";
import bodhChinha from "../../../../../assets/bodh-chinha.png";
import { format } from "date-fns";
import { calculateAverage, calculateTotalAttendance, formatDate } from "./util";
import { styles } from "./styles";
import PdfHeader from "../components/PdfHeader";
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

const ProgressCardPDF = ({ data }) => {
  if (!data) return <Document></Document>;

  return (
    <Document>
      {data?.pages.map(({ data: allRecords, yearRange }, index) => (
        <Page size="A4" style={styles.page} key={index}>
          {/* Header Section with logos properly positioned */}
          <PdfHeader
            collageName={data.collageName}
            heading={"PROGRESS CARD"}
            styles={styles}
          />

          {/* Student Details Section */}
          <PdfStudentInfo data={data} yearRange={yearRange} />

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
              <View style={[styles.nestedColumn, { width: "20%" }]}>
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
              <View style={[styles.nestedColumn, { width: "25%" }]}>
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
              <View style={[styles.tableCellHeaderLast, { width: "10%" }]}>
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
                      width: "20%",
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
                    { width: "25%", flexDirection: "row" },
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
                  { width: "20%", flexDirection: "row" },
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
                  { width: "25%", flexDirection: "row" },
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
