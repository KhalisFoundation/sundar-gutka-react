// Parses a constrained Seva content HTML fragment — one `{type:"html", value}`
// segment from parseSevaContent — into a plain array of native-renderable
// block descriptors. No WebView is involved.
//
// Why not a WebView: an embedded WebView's height must be measured
// asynchronously (postMessage round-trip) and mirrored onto the RN side. That
// measurement goes stale on any later reflow (late font swap, rewrap), leaving
// the WebView's own content clipped or independently scrollable instead of the
// page scrolling as one unit — and a WebView also can't reproduce the
// headline's SVG gradient. Since this content's shape is our own convention,
// parsing it into real Text/View elements removes that whole bug class:
// native layout is synchronous and always correct, the page's ScrollView stays
// the single scroll surface, and the original native styling is reused as-is.
//
// Supported: h1/h2/h3 and p, optional class attribute, optional inline
// <a href="...">text</a> links. <style> blocks are stripped (styling comes
// from the app's own themed StyleSheet, not from backend CSS). Unrecognized
// tags are ignored.

const ENTITY_MAP = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

const decodeEntities = (text) =>
  text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (m) => ENTITY_MAP[m]);

/**
 * Splits one block's inner HTML into ordered plain-text and link segments —
 * the same shape SevaScreen's native renderDescription() already consumes.
 * @returns {Array<{text: string, link: boolean, url?: string}>}
 */
const parseInlineSegments = (innerHtml) => {
  const linkRe = /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const segments = [];
  let lastIndex = 0;
  let match = linkRe.exec(innerHtml);

  while (match !== null) {
    const [fullMatch, url, linkText] = match;
    const before = innerHtml.slice(lastIndex, match.index);
    if (before) segments.push({ text: decodeEntities(before), link: false });
    segments.push({ text: decodeEntities(linkText), link: true, url });
    lastIndex = match.index + fullMatch.length;
    match = linkRe.exec(innerHtml);
  }

  const remaining = innerHtml.slice(lastIndex);
  if (remaining.trim()) segments.push({ text: decodeEntities(remaining), link: false });

  return segments;
};

/**
 * @param {string} html
 * @returns {Array<{tag: string, className: string, segments: Array<{text: string, link: boolean, url?: string}>}>}
 */
export const parseHtmlBlocks = (html) => {
  if (!html || typeof html !== "string" || !html.trim()) return [];

  // Backend content may carry a <style> block (styling is owned by the app's
  // themed StyleSheet instead, so CSS keeps following light/dark mode).
  const withoutStyle = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  const blockRe = /<(h1|h2|h3|p)([^>]*)>([\s\S]*?)<\/\1>/gi;
  const blocks = [];
  let match = blockRe.exec(withoutStyle);

  while (match !== null) {
    const [, tag, attrs, innerHtml] = match;
    const classMatch = /class="([^"]*)"/i.exec(attrs || "");
    const segments = parseInlineSegments(innerHtml);
    if (segments.length) {
      blocks.push({
        tag: tag.toLowerCase(),
        className: classMatch ? classMatch[1] : "",
        segments,
      });
    }
    match = blockRe.exec(withoutStyle);
  }

  return blocks;
};

/** Flattens a block's segments back to its plain text (used for headings). */
export const blockText = (block) => (block?.segments ?? []).map((s) => s.text).join("");

export default parseHtmlBlocks;
