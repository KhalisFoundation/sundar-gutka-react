import constant from "../../constant";
import defaultBaniOrder from "../../defaultBaniOrder";
import { validateBaniOrder } from "../../helpers";

// One pass over the bani list instead of a scan per lookup.
//
// Every entry in the order — and every bani inside every folder in it — used to
// run `baniList.find`, so building the list was a scan of the whole list per
// bani. The first match wins here exactly as it did with `find`, which is what
// keeps a duplicated id resolving to the same row as before.
const indexBaniList = (baniList) => {
  const byId = new Map();
  baniList.forEach((item) => {
    if (!byId.has(item.id)) byId.set(item.id, item);
  });
  return byId;
};
const extractBaniDetails = (baniItem) => {
  return {
    id: baniItem.id,
    gurmukhi: baniItem.gurmukhi,
    translit: baniItem.translit,
    gurmukhiUni: baniItem.gurmukhiUni,
  };
};

// Build a lookup map from gurmukhi key → canonical folder definition (with hi/ur/ipa fields)
const defaultFolderMap = defaultBaniOrder.baniOrder
  .filter((item) => item.folder)
  .reduce((acc, item) => {
    acc[item.gurmukhi] = item;
    return acc;
  }, {});

/**
 * Returns the correct folder display name based on the selected transliteration language.
 * Always reads from defaultBaniOrder so new translations are picked up even for
 * users whose baniOrder was persisted before the translations were added.
 */
const getFolderTranslit = (element, language) => {
  // Look up canonical definition from defaultBaniOrder by gurmukhi key
  const canonical = defaultFolderMap[element.gurmukhi] || element;
  switch (language) {
    case constant.HINDI:
      return canonical.hi || canonical.translit;
    case constant.SHAHMUKHI:
      return canonical.ur || canonical.translit;
    case constant.IPA:
      return canonical.ipa || canonical.translit;
    default:
      return canonical.translit;
  }
};

const orderedBani = (baniList, baniOrder, language) => {
  const order = validateBaniOrder(baniOrder);
  // Safeguard if `baniOrder` is missing or if `baniOrder.baniOrder` is not an array
  if (!order?.baniOrder?.length) {
    return [];
  }

  const byId = indexBaniList(baniList);

  return (
    order.baniOrder
      .map((element) => {
        // If there's a direct `id`, we find that Bani and extract
        if (element.id) {
          const baniItem = byId.get(element.id);
          return baniItem ? extractBaniDetails(baniItem) : null;
        }

        if (!element.folder) return null;

        // Otherwise, we're dealing with a folder. Map over each item in `element.folder`
        const folder = element.folder.reduce((acc, item) => {
          const bani = byId.get(item.id);
          if (bani) acc.push(extractBaniDetails(bani));
          return acc;
        }, []);

        return folder.length
          ? {
              gurmukhiUni: element.gurmukhiUni,
              gurmukhi: element.gurmukhi,
              translit: getFolderTranslit(element, language),
              folder,
            }
          : null;
      })
      // Filter out any nulls in case an ID did not match
      .filter(Boolean)
  );
};

export default orderedBani;
