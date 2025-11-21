import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Roboto",
    fontSize: 10,
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
