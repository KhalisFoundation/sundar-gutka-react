import { StyleSheet } from "react-native";
import { colors } from "@common";

const styles = StyleSheet.create({
  baniDBLogoImage: { alignSelf: "center" },
  mainWrapper: { flex: 1 },
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 8,
    // shadow / elevation...
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 16,
    marginRight: 12,
  },
  button: {
    backgroundColor: colors.BANIDB_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonDisabled: {
    backgroundColor: "#aaa",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  percentText: {
    position: "absolute",
    top: "40%",
    fontSize: 18,
    fontWeight: "600",
  },
  headerTitleStyle: { color: colors.WHITE_COLOR, fontWeight: "normal", fontSize: 18 },
  headerStyle: { backgroundColor: colors.BANIDB_LIGHT },
});

export default styles;
