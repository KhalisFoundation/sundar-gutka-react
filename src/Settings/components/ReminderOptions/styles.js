import { StyleSheet } from "react-native";
import constant from "../../../common/constant";

const styles = StyleSheet.create({
  viewColumn: { flexDirection: "column" },
  viewRow: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 24 },
  flexView: { flex: 1 },
  timeFont: { fontSize: 44 },
  accContentText: { fontSize: 14 },
  accContentWrapper: { flexDirection: "row", alignItems: "center", margin: 5 },
  modalSelecText: { fontFamily: constant.GURBANI_AKHAR_TRUE, fontSize: 28 },
});

export default styles;
