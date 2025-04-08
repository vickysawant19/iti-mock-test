import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import devtLogo from "../../../../../assets/dvet-logo.png";
import bodhChinha from "../../../../../assets/bodh-chinha.png";
import React from "react";

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 10,
    marginBottom: 10,
  },
  logoContainer: {
    width: 60,
    height: 60,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  header: {
    flex: 1,
    textAlign: "center",
    padding: "0 15px",
    maxWidth: "70%",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
    textTransform: "uppercase",
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "medium",
    marginTop: 2,
    lineHeight: 1.4,
  },
});

const PdfHeader = ({ heading, collageName }) => {
  return (
    <View style={styles.headerContainer}>
      {/* Left Logo (DVET) */}
      <View style={styles.logoContainer}>
        <Image style={styles.logo} src={devtLogo} />
      </View>

      {/* Center Text */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{collageName}</Text>
        <Text style={styles.headerSubtitle}>{heading}</Text>
      </View>

      {/* Right Logo (Bodh Chinha) */}
      <View style={styles.logoContainer}>
        <Image style={styles.logo} src={bodhChinha} />
      </View>
    </View>
  );
};

export default PdfHeader;
