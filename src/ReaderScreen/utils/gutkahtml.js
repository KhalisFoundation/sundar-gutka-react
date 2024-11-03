import script from "./gutkaScript";

const htmlTemplate = (
  backColor,
  fontFileUri,
  fontFace,
  content,
  isNightMode,
  savePosition
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name='viewport' content='width=device-width, user-scalable=no'>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval';">
  <style>
    body {
      background-color: ${backColor};
      word-break: break-word;
      margin-top:50px;
    }
    @font-face {
      font-family: '${fontFace}';
      src: local('${fontFace}'), url('${fontFileUri}'), format('truetype');
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
  <script>${script(isNightMode, savePosition)}</script>
</head>
<body>
  ${content}  
</body>
</html>
`;

export default htmlTemplate;
