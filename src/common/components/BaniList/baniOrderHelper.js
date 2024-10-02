const findBaniById = (baniList, id) => baniList.find((item) => item.id === id);
const extractBaniDetails = (baniItem) => {
  return {
    id: baniItem.id,
    gurmukhi: baniItem.gurmukhi,
    translit: baniItem.translit,
  };
};
const orderedBani = (baniList, baniOrder) => {
  const defaultBaniOrder = baniOrder;
  const banis = [];
  if (defaultBaniOrder && defaultBaniOrder.baniOrder.length > 0) {
    defaultBaniOrder.baniOrder.forEach((element) => {
      if (element.id) {
        const baniItem = findBaniById(baniList, element.id);
        if (baniItem) {
          banis.push(extractBaniDetails(baniItem));
        }
      } else {
        const folder = element.folder.map((item) => {
          const bani = findBaniById(baniList, item.id);
          return extractBaniDetails(bani);
        });
        banis.push({ gurmukhi: element.gurmukhi, translit: element.translit, folder });
      }
    });
  }
  return banis;
};

export default orderedBani;
