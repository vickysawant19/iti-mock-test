import React, { useEffect, useState } from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  Image,
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

  const getColumns = (count) => {
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3 || count === 4) return 2; // For 3 or 4 images, use 2 columns
    if (count === 5 || count === 6) return 3; // For 5 or 6 images, use 3 columns
    return Math.ceil(Math.sqrt(count)); // Fallback for other counts
  };

  const images = selectedModule?.images || [];
  const columns = getColumns(images.length);
  const imageWidthPercent = `${100 / columns}%`;
  const imageHightPercent = `${100 / columns}%`


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
          <View style={styles.leftColumn}>
            <View style={styles.imagePlaceholder}>
            {images.map((img, index) => (
                <View
                  key={index}
                  style={[
                    styles.imageWrapper,
                    { width: imageWidthPercent, height:imageHightPercent },
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
                {selectedModule?.evalutionPoints
                  ? selectedModule?.evalutionPoints.map((item, idx) => (
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
                    {selectedModule?.evalutionPoints
                      ? selectedModule.evalutionPoints.reduce(
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
