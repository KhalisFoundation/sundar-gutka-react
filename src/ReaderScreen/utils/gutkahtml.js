import { Platform } from "react-native";
import { readerColorVariables } from "@theme/readerColors";
import { constant } from "@common";
import script from "./gutkaScript";

const getFontFaceURL = (fontFace) => {
  const fileUri = Platform.select({
    ios: `${fontFace}.ttf`,
    android: `file:///android_asset/fonts/${fontFace}.ttf`,
  });
  return fileUri;
};

const htmlTemplate = (backColor, fontFace, content, theme, preview = false) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name='viewport' content='width=device-width, user-scalable=no'>
  <style>
    ${readerColorVariables(theme)}
    body {
      background-color: ${backColor};
      word-break: break-word;
      margin-top:50px;
      /* Clear the bottom-nav overlay (65px nav + 5px progress bar) so the last
         verse is never hidden behind the bars when the chrome is shown. */
      padding-bottom: 90px;
    }
    ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
      background: transparent;
    }
    ::-webkit-scrollbar-thumb {
      background: ${theme.colors.primary};
      border-radius: 4px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
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
      font-family: '${constant.GURBANI_AKHAR_THICK_TRUE}';
      src: url('${getFontFaceURL(constant.GURBANI_AKHAR_THICK_TRUE)}') format('truetype'),local('${
  constant.GURBANI_AKHAR_THICK_TRUE
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
}', '${constant.GURBANI_AKHAR_THICK_TRUE}', '${constant.ANMOL_LIPI}';
    }
    .transliteration, .translation {
      padding: 0.2em;
      font-family: '${constant.BALOO_PAAJI}';
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
    ${
      preview
        ? "body { margin: 8px; padding: 0; min-height: calc(100vh - 16px); display: flex; flex-direction: column; justify-content: center; } .content-item { font-size: 21px; line-height: 1.6; text-align: center; color: var(--reader-text); }"
        : ""
    }
  </style>
  ${preview ? "" : `<script>${script(theme)}</script>`}
</head>
<body>
  ${content}  
</body>
</html>
`;

export default htmlTemplate;
