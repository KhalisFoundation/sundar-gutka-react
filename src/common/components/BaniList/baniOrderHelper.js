import defaultBaniOrder from "../../defaultBaniOrder";

const findBaniById = (baniList, id) => baniList.find((item) => item.id === id);
const extractBaniDetails = (baniItem) => {
  return {
    id: baniItem.id,
    gurmukhi: baniItem.gurmukhi,
    translit: baniItem.translit,
  };
};
const orderedBani = (baniList, baniOrder) => {
  const isValidBaniOrder =
    baniOrder != null && // checks for null or undefined
    typeof baniOrder === "object" &&
    Array.isArray(baniOrder.baniOrder) &&
    baniOrder.baniOrder.length > 0;
  const order = isValidBaniOrder ? baniOrder : defaultBaniOrder;
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

        // Otherwise, we're dealing with a folder. Map over each item in `element.folder`
        const folder =
          element.folder
            ?.map((item) => {
              const bani = findBaniById(baniList, item.id);
              return bani ? extractBaniDetails(bani) : null;
            })
            .filter(Boolean) || [];

        return {
          gurmukhi: element.gurmukhi,
          translit: element.translit,
          folder,
        };
      })
      // Filter out any nulls in case an ID did not match
      .filter(Boolean)
  );
};

export default orderedBani;
