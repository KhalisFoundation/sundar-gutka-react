const oderedBani = (baniList) => {
  const defaultBaniOrder = require("../../defaultBaniOrder.json");
  const banis = [];

  defaultBaniOrder.baniOrder.forEach((obj) => {
    if (obj.id) {
      const baniItem = baniList.filter((item) => item.id === obj.id)[0];
      if (baniItem) {
        banis.push({ id: obj.id, gurmukhi: baniItem.gurmukhi, translit: baniItem.translit });
      }
    } else {
      const folder = [];
      obj.folder.forEach((item) => {
        const bani = baniList.filter((listItem) => listItem.id === item.id)[0];
        folder.push({ id: item.id, gurmukhi: bani.gurmukhi, translit: bani.translit });
      });

      banis.push({ gurmukhi: obj.gurmukhi, translit: obj.translit, folder });
    }
  });
  return banis;
};
export default oderedBani;
