const htmlTemplate = (backColor, fontFileUri, fontFace, content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name='viewport' content='width=device-width, initial-scale=1.0, user-scalable=no'>
  <style>
   *, *::before, *::after {
            box-sizing: border-box;
        }
        html,body{
          margin: 0;
            padding: 0;
            overflow-x: hidden;
            width: 100%;
            height: 100%;
        }
    body {
      margin: 0;
            padding: 0;
            overflow-x: hidden;
            width: 100%;

      background-color: ${backColor};
      margin-top:50px;
      transition: transform 0.2s ease-in-out;
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
    .content-item{
      transition: font-size 0.2s ease-in-out;
    }
  </style>

</head>
<body>
<div class="content-container">
  ${content}
  </div>
    
</body>
</html>
`;

export default htmlTemplate;
