import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 10,
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
