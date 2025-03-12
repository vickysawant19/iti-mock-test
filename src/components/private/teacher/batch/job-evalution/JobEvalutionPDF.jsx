import React, { useEffect, useState } from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

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
    paddingVertical: 5,
    borderLeftWidth: 2,
    borderRightWidth: 2,
  },
  leftColumn: {
    width: "40%",
    padding: 5,
  },
  rightColumn: {
    width: "60%",
    padding: 5,
  },
  // Image Placeholder in left column
  imagePlaceholder: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#000",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
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
    minHeight: 16,
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
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
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
    paddingVertical: 10,
    borderColor: "#000",
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderLeftWidth: 2,
    paddingHorizontal: 20,
  },
  signatureBlock: {
    // width: "33%",
    textAlign: "center",
  },
});

// Generate sample evaluation points for 6 points: A, B, C, D, E, F
const sampleEvalPoints = [
  { point: "A", score: "8" },
  { point: "B", score: "7" },
  { point: "C", score: "9" },
  { point: "D", score: "8" },
  { point: "E", score: "7" },
  { point: "F", score: "8" },
];

const JobEvaluationReportPDF = ({
  batch = {},
  studentsMap,
  college,
  trade,
  selectedModule,
}) => {
  // Generate sample student marks data for 24 rows
  const studentData = Array.from({ length: 24 }, (_, i) => {
    const student = studentsMap.get(i + 1);
    const a = student ? Math.floor(Math.random() * 10) + 10 : 0;
    const b = student ? Math.floor(Math.random() * 10) + 10 : 0;
    const c = student ? Math.floor(Math.random() * 10) + 10 : 0;
    const d = student ? Math.floor(Math.random() * 10) + 10 : 0;
    const e = student ? Math.floor(Math.random() * 10) + 10 : 0;
    const total = a + b + c + d + e;
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

  return (
    <Document>
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
              <Text>{`${selectedModule.moduleId.slice(1) || "________"}`}</Text>
            </View>
            <Text>{`Date of Starting: ${
              batch.dateOfStarting || "________________"
            }`}</Text>
          </View>
          <View style={styles.headerRow}>
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Text style={{ fontWeight: "bold" }}>Job title: </Text>
              <Text>{`${
                selectedModule.moduleName || "________________________________"
              }`}</Text>
            </View>

            <Text>{`Date of Finishing: ${
              batch.dateOfFinishing || "________________"
            }`}</Text>
          </View>
          <View style={styles.headerRow}>
            <View style={{ display: "flex", flexDirection: "row" }}>
              <Text style={{ fontWeight: "bold" }}>Time: </Text>
              <Text>
                {`${selectedModule.moduleDuration || "________________"}`} Hrs.
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION 2 & 3: Two Columns */}
        <View style={styles.rowContainer}>
          {/* Left Column (40%): Image Placeholder & Evaluation Points */}
          <View style={styles.leftColumn}>
            <View style={styles.imagePlaceholder}>
              <Text>Image</Text>
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
                {sampleEvalPoints.map((item, idx) => (
                  <View key={idx} style={styles.evalTableRow}>
                    <Text
                      style={[
                        styles.evalTableCell,
                        { width: "10%", fontWeight: "bold" },
                      ]}
                    >
                      {item.point}
                    </Text>
                    <Text style={[styles.evalTableCell, { width: "80%" }]}>
                      {item.point}
                    </Text>
                    <Text style={[styles.evalLastTableCell, { width: "10%" }]}>
                      {item.score}
                    </Text>
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
                    {20}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          {/* Right Column (60%): Student Marks Table */}
          <View style={styles.rightColumn}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { width: "15%" }]}>
                  Sr. No.
                </Text>
                <Text style={[styles.tableCell, { minWidth: "40%" }]}>
                  Name
                </Text>
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
                  <Text style={[styles.tableCell, { minWidth: "40%" }]}>
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
          <Text style={styles.signatureBlock}>Instructor Signature</Text>
          <Text style={styles.signatureBlock}>Group Instructor Signature</Text>
          <Text style={styles.signatureBlock}>
            {college.collageName || "Industrial Training Institute"}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default JobEvaluationReportPDF;
