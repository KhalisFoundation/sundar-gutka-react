import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ecf0f1",
    padding: 8,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  icon: {
    fontSize: 48,
  },
  text: {
    marginVertical: 16,
    textAlign: "center",
    width: 300,
  },
  btnWrap: { flexDirection: "row" },
});
export default styles;
