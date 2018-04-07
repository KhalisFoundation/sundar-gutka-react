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
      mergedData.baniOrder.push({
        id: obj.id,
        gurmukhi: baniItem.gurmukhi,
        roman: baniItem.roman
      });
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

export const fontSizeForList = SIZE => {
  switch (SIZE) {
    case "EXTRA_SMALL":
      return 12;
    case "SMALL":
      return 17;
    case "MEDIUM":
      return 22;
    case "LARGE":
      return 27;
    case "EXTRA_LARGE":
      return 32;
  }
};
