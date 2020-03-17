/*
 * Constants
 */

import { Alert } from "react-native";
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
        return nightMode ? "#77baff" : "#0066FF";
      } else if (header === 2 || header === 6) {
        return nightMode ? "#BFBFBF" : "#727272";
      } else {
        return nightMode ? "#fff" : "#000";
      }
    }
    case TextType.TRANSLITERATION:
      return nightMode ? "#77baff" : "#0066FF";
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
  let fontSize = baseFontSize(SIZE, romanized) * 0.75;
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

export const baniLengthInfo = () => {
  Alert.alert(
    "Bani Length",
    `
Throughout the past few centuries, there have been many different “sampardhas” or “jathas” that have been conceived from the core concepts of Sikhi and Gurmat. These sampardhas often have different opinions and thoughts about some aspects of Sikh history, Gurbani and Rehat, but still fall collectively under the united Khalsa Panth and, most importantly, the Akaal Takht. The Akaal Takht is the highest order and institution that all Sikhs adhere to.

These differences have also brought about different recommendations about compiled Baanis and the Paath (prayers) that we read on a daily basis which makes it difficult to create a single Sundar Gutka app with a single version of Paath that would satisfy everyone. 

We, therefore, have created the option to select lengths of what Paath you do that apply to four of the main Banis read most often. These have been structured in relation to length but all have a minimum of the SGPC standard or fall under the Akaal Takht. We do not include any versions that are by sampardhas excommunicated by the Akaal Takht as a standard.

For those who may be confused about which version to begin reading these Banis, we recommend reading the longest Bani because the more we read and recite, the better it is for our souls. For beginners, we would suggest starting with the “short” setting and increase the length setting in the future once you are comfortable, confident, and have more time.

Here is a breakdown of the lengths and which sampardhas typically use them:-

SHORT: This is the minimum SGPC/Akaal Takht standard.

MEDIUM: Typically read by followers of the Akhand Keertani Jatha and others.

LONG: Typically read by followers of Damdami Taksaal and others.

EXTRA LONG: Most popular amongst followers of Buddha Dal.
`
  );
};
