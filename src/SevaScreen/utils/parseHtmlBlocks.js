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

// Numeric references cover anything the translated copy carries (&#8217;,
// &#x27;); the named ones are the few that appear in practice.
const NAMED = {
  ...ENTITY_MAP,
  "&apos;": "'",
  "&rsquo;": "\u2019",
  "&lsquo;": "\u2018",
  "&rdquo;": "\u201D",
  "&ldquo;": "\u201C",
  "&hellip;": "\u2026",
  "&ndash;": "\u2013",
  "&mdash;": "\u2014",
};
const fromCodePoint = (n) => {
  try {
    return String.fromCodePoint(n);
  } catch (_) {
    return "";
  }
};
const decodeEntities = (text) =>
  text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|[a-z]+);/gi, (m, dec, hex) => {
    if (dec) return fromCodePoint(Number(dec));
    if (hex) return fromCodePoint(parseInt(hex, 16));
    return NAMED[m.toLowerCase()] ?? m;
  });

// The inline tags content may carry. Named, not "anything after a <", so copy
// with a literal "<" (`ages 5<a then 10 > 3`) is left alone.
const INLINE_TAG = /<\/?(?:strong|b|em|i|u|span|small|sup|sub|mark|br)\b[^>]*>/gi;

// Inline markup (<strong>, <em>, <span>) inside a block is dropped to its text;
// it would otherwise show as literal tags in the native Text. <br> keeps its
// line break.
const toText = (html) => decodeEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(INLINE_TAG, ""));

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
    // Checked after stripping: markup around a link (`<strong><a>`) is text of
    // its own only once its tags are gone, and usually nothing is left.
    const before = toText(innerHtml.slice(lastIndex, match.index));
    // Whitespace alone is kept between segments (the space between two links)
    // and as a line break, but not as stray spaces ahead of the first link.
    if (before.trim() || (before && (segments.length || before.includes("\n")))) {
      segments.push({ text: before, link: false });
    }
    // The href is HTML too: an escaped query string (`?a=1&amp;b=2`) must open
    // as `?a=1&b=2`.
    segments.push({ text: toText(linkText), link: true, url: decodeEntities(url) });
    lastIndex = match.index + fullMatch.length;
    match = linkRe.exec(innerHtml);
  }

  const remaining = toText(innerHtml.slice(lastIndex));
  if (remaining.trim()) segments.push({ text: remaining, link: false });

  return segments;
};

/**
 * @param {string} html
 * @returns {Array<{tag: string, className: string, segments: Array<{text: string, link: boolean, url?: string}>}>}
 */
const parse = (html) => {
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

// The screens render from the parse on every keystroke in the amount field,
// and the content only changes with a new config, so parses are kept: least
// recently used first out, and frozen, since every render shares them.
const parsed = new Map();
const MAX_PARSED = 50;

export const parseHtmlBlocks = (html) => {
  if (!html || typeof html !== "string" || !html.trim()) return [];
  if (parsed.has(html)) {
    const hit = parsed.get(html);
    parsed.delete(html);
    parsed.set(html, hit);
    return hit;
  }
  const blocks = Object.freeze(
    parse(html).map((block) =>
      Object.freeze({
        ...block,
        segments: Object.freeze(block.segments.map((seg) => Object.freeze(seg))),
      })
    )
  );
  if (parsed.size >= MAX_PARSED) parsed.delete(parsed.keys().next().value);
  parsed.set(html, blocks);
  return blocks;
};

/** Flattens a block's segments back to its plain text (used for headings). */
export const blockText = (block) => (block?.segments ?? []).map((s) => s.text).join("");

export default parseHtmlBlocks;
