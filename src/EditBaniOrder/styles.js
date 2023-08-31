import { StyleSheet } from "react-native";
import colors from "../common/colors";
import constant from "../common/constant";

const styles = StyleSheet.create({
  rowItem: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.NIGHT_BLACK,
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },
});

export default styles;
