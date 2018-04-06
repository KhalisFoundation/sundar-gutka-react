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
  for (var i = 0; i < defaultBani.baniOrder.length; i++) {
    var obj = defaultBani.baniOrder[i];
    if (obj.id) {
      var baniItem = baniList[obj.id];
      mergedData.baniOrder.push({
        id: baniItem.ID,
        gurmukhi: baniItem.gurmukhi,
        roman: baniItem.roman
      });
    } else {
      mergedData.baniOrder.push({
        folder: obj.folder,
        gurmukhi: obj.gurmukhi,
        roman: obj.roman
      });
    }
  }
  return mergedData;
};
