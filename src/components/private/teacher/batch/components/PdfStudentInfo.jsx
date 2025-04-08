import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import React from "react";

const styles = StyleSheet.create({
  section: {
    marginVertical: 5,
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
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  boldText: {
    fontWeight: "bold",
  },
  textField: {
    borderBottom: "1px solid #cccccc",
    paddingBottom: 2,
    fontSize: 10,
  },
  textRow: {
    marginBottom: 2,
    display: "flex",
    flexDirection: "row",
  },
  textContainer: {
    display: "flex",
    flexDirection: "column",
  },
});

const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy");
  } catch {
    return "-";
  }
};

const PdfStudentInfo = ({ data, yearRange }) => {
  return (
    <View style={styles.section}>
      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <View style={styles.textRow}>
            <Text style={styles.labelTop}>Name of Trainee:</Text>
            <View style={styles.textField}>
              <Text style={styles.valueText}>{data?.userName || "-"}</Text>
            </View>
          </View>

          <View style={styles.textRow}>
            <Text style={styles.labelTop}>Date of Birth:</Text>
            <View style={styles.textField}>
              <Text style={styles.valueText}>
                {data?.DOB ? formatDate(data?.DOB) : "-"}
              </Text>
            </View>
          </View>

          <View style={styles.textRow}>
            <Text style={styles.labelTop}>Trade:</Text>
            <View style={styles.textField}>
              <Text style={styles.valueText}>{data?.tradeName || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.gridItem}>
          <View style={styles.textRow}>
            <Text style={styles.labelTop}>Trainee Code:</Text>
            <View style={styles.textField}>
              <Text style={styles.valueText}>{data?.registerId || "-"}</Text>
            </View>
          </View>

          <View style={styles.textRow}>
            <Text style={styles.labelTop}>Year:</Text>
            <View style={styles.textField}>
              <Text style={styles.valueText}>{yearRange || "-"}</Text>
            </View>
          </View>

          <View style={styles.textRow}>
            <Text style={styles.labelTop}>Permanent Address:</Text>
            <View style={styles.textField}>
              <Text style={styles.valueText}>{data?.address || "-"}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default PdfStudentInfo;
