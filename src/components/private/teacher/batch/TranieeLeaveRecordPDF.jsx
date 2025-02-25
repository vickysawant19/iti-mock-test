import {
    Document,
    Page,
    View,
    Text,
    StyleSheet,
    Font,
    Image,
  } from "@react-pdf/renderer";
  
  import { format } from "date-fns";
  import bodhChinha from "../../../../assets/bodhchinha.png";
  import devtLogo from "../../../../assets/dvet-logo.png";
  
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
    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      justifyContent: "space-between",
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
    },
    headerTitle: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: "bold",
    },
    section: {
      marginBottom: 10,
    },
    studentDetailsSection: {
      marginBottom: 15,
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
  
  const TraineeLeaveRecordPDF = ({ batch,
    student,
    leaveRecords}) => {
    // Default data structure if no data is provided
    const defaultData = {
      year: "Aug-2024 to July -2025",
      stipend: "Yes",
      attendance: {
        Aug: { possibleDays: 22, presentDays: 21, sickLeave: 0, casualLeave: 0 },
        Sept: { possibleDays: 21, presentDays: 0, sickLeave: 0, casualLeave: 0 },
        Oct: { possibleDays: 23, presentDays: 22, sickLeave: 0, casualLeave: 0 },
        Nov: { possibleDays: 25, presentDays: 25, sickLeave: 0, casualLeave: 0 },
        Dec: { possibleDays: 23, presentDays: 23, sickLeave: 0, casualLeave: 0 },
        Jan: { possibleDays: 21, presentDays: 21, sickLeave: 0, casualLeave: 0 },
        Feb: { possibleDays: 22, presentDays: 22, sickLeave: 0, casualLeave: 0 },
        Mar: { possibleDays: 0, presentDays: 16, sickLeave: 0, casualLeave: 0 },
        Apr: { possibleDays: 0, presentDays: 23, sickLeave: 0, casualLeave: 0 },
        May: { possibleDays: 0, presentDays: 0, sickLeave: 0, casualLeave: 0 },
        June: { possibleDays: 0, presentDays: 0, sickLeave: 0, casualLeave: 0 },
        July: { possibleDays: 0, presentDays: 0, sickLeave: 0, casualLeave: 0 },
      },
      casualLeaveRecords: [],
      medicalLeaveRecords: [],
      parentMeetings: [],
    };
  
    // Merge with provided data or use defaults
    const data = { ...student,...defaultData,  };
    // Calculate percentage for each month
    const calculatePercentage = (month) => {
      const attendance = data.attendance[month];
      if (!attendance || attendance.possibleDays === 0) {
        return "-";
      }
      const percentage = (attendance.presentDays / attendance.possibleDays) * 100;
      return isNaN(percentage) ? "-" : `${Math.round(percentage)}%`;
    };
  
    const months = [
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "June",
      "July",
    ];
  
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header Section */}
          <View style={styles.headerContainer}>
            {/* Left Logo (DVET) */}
            <View style={styles.logoContainer}>
              <Image style={styles.logo} src={devtLogo} />
            </View>
  
            {/* Center Text */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{data.collageName}</Text>
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
                  Trainee Name : <Text style={styles.boldText}>{data.userName}</Text>
                </Text>
                <Text>
                  Trade : <Text style={styles.boldText}>{data.tradeName}</Text>
                </Text>
                <Text>
                  Exam Seat No. :{" "}
                  <Text style={styles.boldText}>{data.registerId}</Text>
                </Text>
              </View>
              <View style={styles.gridItem}>
                <Text>
                  Year : <Text style={styles.boldText}>{data.year}</Text>
                </Text>
                <Text>
                  Address : <Text style={styles.boldText}>{data.address}</Text>
                </Text>
                <Text>
                  <Text style={styles.boldText}>Stipend :</Text>{" "}
                  <Text style={styles.boldText}>{data.stipend}/No</Text>
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
                {months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === months.length - 1
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
                {months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === months.length - 1
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
                {months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === months.length - 1
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
                {months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === months.length - 1
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
                {months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === months.length - 1
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
                {months.map((month, index) => (
                  <View
                    key={index}
                    style={
                      index === months.length - 1
                        ? [styles.tableCellLast, { width: "7%" }]
                        : [styles.tableCell, { width: "7%" }]
                    }
                  >
                    <Text>{calculatePercentage(month)}</Text>
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
                  <Text>From     To</Text>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting with Parents</Text>
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
              {Array.from({ length: 5 }).map((_, index) => (
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
      </Document>
    );
  };
  
  export default TraineeLeaveRecordPDF;