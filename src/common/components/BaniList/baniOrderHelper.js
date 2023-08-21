const fetchDefaultBaniOrder = () => require("../../defaultBaniOrder.json");
const findBaniById = (baniList, id) => baniList.find((item) => item.id === id);
const extractBaniDetails = (baniItem) => {
  return {
    id: baniItem.id,
    gurmukhi: baniItem.gurmukhi,
    translit: baniItem.translit,
  };
};
const oderedBani = (baniList) => {
  const defaultBaniOrder = fetchDefaultBaniOrder();
  const banis = [];

  defaultBaniOrder.baniOrder.forEach((obj) => {
    if (obj.id) {
      const baniItem = findBaniById(baniList, obj.id);
      if (baniItem) {
        banis.push(extractBaniDetails(baniItem));
      }
    } else {
      const folder = obj.folder.map((item) => {
        const bani = findBaniById(baniList, item.id);
        return extractBaniDetails(bani);
      });

      banis.push({ gurmukhi: obj.gurmukhi, translit: obj.translit, folder });
    }
  });
  return banis;
};
export default oderedBani;