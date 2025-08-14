import { StyleSheet } from "react-native";
import { colors } from "@common";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 60,
  },
  navigationBar: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 70,
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20,
    paddingHorizontal: 20,
    gap: 25,
  },
  iconContainer: {
    flexBasis: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: colors.WHITE_COLOR,
    borderRadius: 15,
    padding: 15,
  },
});

export default styles;
