import { StyleSheet } from "react-native";

export const checkUpdateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    marginBottom: 5,
  },
  status: {
    marginTop: 20,
    fontSize: 18,
  },
  mainWrapper: { marginBottom: 10 },
});

export const baniDBAboutStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginRight: 10,
  },
  listText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

export const downloadStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  text: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: "bold",
  },
});
