import { logError } from "@common";

/**
 * Registry of known native slots the Seva backend content can position via a
 * `<!--SLOT:name-->` marker. Both are ALWAYS rendered by native app code —
 * donate_widget is the live payment flow, tax_note is the country-conditional
 * legal text — never as raw HTML text from the backend.
 */
export const SEVA_SLOT_TYPES = ["donate_widget", "tax_note"];

/**
 * Splits a raw Seva `content` HTML string into an ordered sequence of segments:
 *   - { type: 'html', value }          an HTML fragment (rendered natively)
 *   - { type: 'slot', name }           a native slot (donate_widget / tax_note)
 *   - { type: 'card_open', name }      start of a visual card group
 *   - { type: 'card_close' }           end of a card group
 *
 * This lets the backend fully drive the page LAYOUT (hero text, the donate card
 * grouping, the "other ways" list, section headers, ordering) without an app
 * release — the app only supplies the interactive donate widget, the
 * country-conditional tax note, and the icons/navigation chrome.
 *
 * @param {string|null|undefined} rawHtml
 * @returns {Array<{type:'html',value:string}|{type:'slot',name:string}|{type:'card_open',name:string}|{type:'card_close'}>}
 *   Empty array when rawHtml is empty/missing — callers treat [] as the signal
 *   to use the native STRINGS-driven fallback rendering.
 */
export const parseSevaContent = (rawHtml) => {
  if (!rawHtml || typeof rawHtml !== "string" || !rawHtml.trim()) {
    return [];
  }

  // One regex matches every marker kind: SLOT:name, CARD:name, /CARD.
  const markerRe = /<!--\s*(?:SLOT:(\w+)|CARD:(\w+)|(\/CARD))\s*-->/g;
  const segments = [];
  let lastIndex = 0;
  let match = markerRe.exec(rawHtml);

  const pushHtml = (from, to) => {
    const html = rawHtml.slice(from, to);
    if (html.trim()) segments.push({ type: "html", value: html });
  };

  while (match !== null) {
    const [fullMatch, slotName, cardName, cardClose] = match;
    pushHtml(lastIndex, match.index);

    if (slotName) {
      if (SEVA_SLOT_TYPES.includes(slotName)) {
        segments.push({ type: "slot", name: slotName });
      } else {
        logError(new Error(`Unknown Seva content slot: ${slotName}`));
      }
    } else if (cardName) {
      segments.push({ type: "card_open", name: cardName });
    } else if (cardClose) {
      segments.push({ type: "card_close" });
    }

    lastIndex = match.index + fullMatch.length;
    match = markerRe.exec(rawHtml);
  }

  pushHtml(lastIndex, rawHtml.length);
  return segments;
};
