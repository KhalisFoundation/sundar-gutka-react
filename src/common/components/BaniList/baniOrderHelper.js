import { validateBaniOrder } from "../../helpers";

const findBaniById = (baniList, id) => baniList.find((item) => item.id === id);
const extractBaniDetails = (baniItem) => {
  return {
    id: baniItem.id,
    gurmukhi: baniItem.gurmukhi,
    translit: baniItem.translit,
    token: baniItem.token,
  };
};
const orderedBani = (baniList, baniOrder) => {
  const order = validateBaniOrder(baniOrder);
  // Safeguard if `baniOrder` is missing or if `baniOrder.baniOrder` is not an array
  if (!order?.baniOrder?.length) {
    return [];
  }

  return (
    order.baniOrder
      .map((element) => {
        // If there's a direct `id`, we find that Bani and extract
        if (element.id) {
          const baniItem = findBaniById(baniList, element.id);
          return baniItem ? extractBaniDetails(baniItem) : null;
        }

        if (!element.folder) return null;

        // Otherwise, we're dealing with a folder. Map over each item in `element.folder`
        const folder = element.folder.reduce((acc, item) => {
          const bani = findBaniById(baniList, item.id);
          if (bani) acc.push(extractBaniDetails(bani));
          return acc;
        }, []);

        return folder.length
          ? { gurmukhi: element.gurmukhi, token: element.token, translit: element.translit, folder }
          : null;
      })
      // Filter out any nulls in case an ID did not match
      .filter(Boolean)
  );
};

export default orderedBani;
