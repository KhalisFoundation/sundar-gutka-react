import { Platform } from "react-native";
import { constant } from "@common";
import script from "./gutkaScript";

const getFontFaceURL = (fontFace) => {
  const fileUri = Platform.select({
    ios: `${fontFace}.ttf`,
    android: `file:///android_asset/fonts/${fontFace}.ttf`,
  });
  return fileUri;
};

const htmlTemplate = (backColor, fontFace, content, theme, savePosition) => `<!DOCTYPE html>
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
    @font-face {
      font-family: '${constant.BALOO_PAAJI}';
      src: url('${getFontFaceURL(constant.BALOO_PAAJI)}') format('truetype'),local('${
  constant.BALOO_PAAJI
}');
    }
    @font-face {
      font-family: '${constant.BALOO_PAAJI_SEMI_BOLD}';
      src: url('${getFontFaceURL(constant.BALOO_PAAJI_SEMI_BOLD)}') format('truetype'),local('${
  constant.BALOO_PAAJI_SEMI_BOLD
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
      font-family: '${theme.typography.fonts.balooPaaji}';
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
  </style>
  <script>${script(theme, savePosition)}</script>
</head>
<body>
  ${content}  
</body>
</html>
`;

export default htmlTemplate;
