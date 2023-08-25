import { fontSizeForReader, fontColorForReader } from "../utils";
import constant from "../../common/constant";

const commonStyle = (header, isNightMode, type, fontSize, fontFace) => ({
  fontSize: fontSizeForReader(fontSize, header, type !== constant.GURMUKHI),
  color: fontColorForReader(header, isNightMode, type),
  textAlign: header ? "center" : "left",
  fontWeight: header === 0 ? "normal" : "bold",
  fontFamily: type === constant.TRANSLITERATION ? undefined : fontFace,
});

export default commonStyle;
