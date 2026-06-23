import { constant, colors } from "@common";
import { Platform } from "react-native";
import script from "./gutkaScript";

const getFontFaceURL = (fontFace) => {
  const fileUri = Platform.select({
    ios: `${fontFace}.ttf`,
    android: `file:///android_asset/fonts/${fontFace}.ttf`,
  });
  return fileUri;
};

const htmlTemplate = (backColor, fontFace, content, isNightMode, savePosition) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name='viewport' content='width=device-width, user-scalable=no'>
  <style>
    body {
      background-color: ${backColor};
      word-break: break-word;
      margin-top:50px;
    }
    @font-face {
      font-family: '${constant.GURBANI_AKHAR_TRUE}';
      src: url('${getFontFaceURL(constant.GURBANI_AKHAR_TRUE)}') format('truetype'),local('${
  constant.GURBANI_AKHAR_TRUE
}');
    }
    @font-face {
      font-family: '${constant.GURBANI_AKHAR_HEAVY_TRUE}';
      src: url('${getFontFaceURL(constant.GURBANI_AKHAR_HEAVY_TRUE)}') format('truetype'),local('${
  constant.GURBANI_AKHAR_HEAVY_TRUE
}');
    }
    @font-face {
      font-family: '${constant.GURBANI_AKAR_THICK_TRUE}';
      src: url('${getFontFaceURL(constant.GURBANI_AKAR_THICK_TRUE)}') format('truetype'),local('${
  constant.GURBANI_AKAR_THICK_TRUE
}');
    }
    @font-face {
      font-family: '${constant.ANMOL_LIPI}';
      src: url('${getFontFaceURL(constant.ANMOL_LIPI)}') format('truetype'),local('${
  constant.ANMOL_LIPI
}');
    }

    .gurmukhi {
      padding: 0.2em;
      font-family: '${fontFace}', '${constant.GURBANI_AKHAR_HEAVY_TRUE}', '${
  constant.GURBANI_AKHAR_TRUE
}', '${constant.GURBANI_AKAR_THICK_TRUE}', '${constant.ANMOL_LIPI}';
    }
    .transliteration, .translation {
      padding: 0.2em;
      font-family: 'Arial';
    }
    * {
      -webkit-user-select: none;
    }
    .center{
      text-align:center
    }
    .left{
      text-align:left
    }
    .right{
      text-align:right
    }
    .next-bani-container {
      margin: 40px auto 60px auto;
      text-align: center;
      padding: 0 15px;
      max-width: 500px;
    }
    .next-bani-btn {
      background-color: ${
        isNightMode ? colors.NEXT_BANI_BTN_BG_DARK : colors.NEXT_BANI_BTN_BG_LIGHT
      };
      border: 1px solid ${
        isNightMode ? colors.NEXT_BANI_BTN_BORDER_DARK : colors.NEXT_BANI_BTN_BORDER_LIGHT
      };
      border-radius: 12px;
      padding: 16px 24px;
      width: 100%;
      cursor: pointer;
      outline: none;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .next-bani-btn:active {
      opacity: 0.8;
    }
    .next-bani-label {
      font-size: 13px;
      color: ${isNightMode ? colors.NEXT_BANI_BTN_LABEL_DARK : colors.NEXT_BANI_BTN_LABEL_LIGHT};
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-family: Arial, sans-serif;
    }
    .next-bani-title {
      font-size: 21px;
      font-weight: 600;
      color: ${isNightMode ? colors.NEXT_BANI_BTN_TEXT_DARK : colors.NEXT_BANI_BTN_TEXT_LIGHT};
      line-height: 1.3;
    }
  </style>
  <script>${script(isNightMode, savePosition)}</script>
</head>
<body>
  ${content}  
</body>
</html>
`;

export default htmlTemplate;
