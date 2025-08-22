import script from "./gutkaScript";

const htmlTemplate = (
  backColor,
  fontFileUri,
  fontFace,
  content,
  theme,
  savePosition
) => `<!DOCTYPE html>
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
      font-family: '${fontFace}';
      src: url('${fontFileUri}') format('truetype'),local('${fontFace}');
    }

    .gurmukhi {
      padding: 0.2em;
      font-family: '${fontFace}';
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
  </style>
  <script>${script(theme, savePosition)}</script>
</head>
<body>
  ${content}  
</body>
</html>
`;

export default htmlTemplate;
