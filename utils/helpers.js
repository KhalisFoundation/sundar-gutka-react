/*
 * Constants
 */

export const defaultBaniOrderArray = Array(
  require("../config/defaultBaniOrder.json").baniOrder.length
)
  .fill()
  .map((x, i) => i);

export const mergedBaniList = baniList => {
  const defaultBani = require("../config/defaultBaniOrder.json");
  const mergedData = { baniOrder: [] };
  defaultBani.baniOrder.forEach(obj => {
    if (obj.id) {
      var baniItem = baniList[obj.id];
      if (baniItem) {
        mergedData.baniOrder.push({
          id: obj.id,
          gurmukhi: baniItem.gurmukhi,
          roman: baniItem.roman
        });
      }
    } else {
      var folder = [];
      obj.folder.forEach(item => {
        var baniItem = baniList[item.id];
        folder.push({
          id: item.id,
          gurmukhi: baniItem.gurmukhi,
          roman: baniItem.roman
        });
      });

      mergedData.baniOrder.push({
        gurmukhi: obj.gurmukhi,
        roman: obj.roman,
        folder
      });
    }
  });
  return mergedData;
};

export const TextType = Object.freeze({
  GURMUKHI: 0,
  TRANSLITERATION: 1,
  ENGLISH_TRANSLATION: 2
});

export const fontColorForReader = (header, nightMode, text) => {
  switch (text) {
    case TextType.GURMUKHI: {
      if (header === 1) {
        return nightMode ? "#4757D1" : "#0066FF";
      } else if (header === 2 || header === 6) {
        return nightMode ? "#BFBFBF" : "#727272";
      } else {
        return nightMode ? "#fff" : "#000";
      }
    }
    case TextType.TRANSLITERATION:
      return nightMode ? "#4757D1" : "#0066FF";
    case TextType.ENGLISH_TRANSLATION:
      return nightMode ? "#BFBFBF" : "#727272";
  }
};

export const baseFontSize = (SIZE, romanized) => {
  var fontSize;
  switch (SIZE) {
    case "EXTRA_SMALL":
      fontSize = 16;
      break;
    case "SMALL":
      fontSize = 22;
      break;
    case "MEDIUM":
      fontSize = 28;
      break;
    case "LARGE":
      fontSize = 34;
      break;
    case "EXTRA_LARGE":
      fontSize = 46;
      break;
  }

  if (romanized) {
    fontSize = fontSize / 1.25;
  }

  return fontSize;
};

export const fontSizeForReader = (SIZE, header, romanized) => {
  let fontSize = baseFontSize(SIZE, romanized)/14;
  if (header === 6) {
    return fontSize * 0.75;
  } else if (header === 2) {
    return fontSize * 1.1;
  } else if (header === 1) {
    return fontSize * 1.2;
  } else {
    return fontSize;
  }
};
