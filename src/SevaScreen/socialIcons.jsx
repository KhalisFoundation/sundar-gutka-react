import React, { useId } from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { brandMarks } from "@theme/palette";
import PropTypes from "prop-types";

/**
 * Genuine brand glyphs for the "Spread the word" social links, using the
 * official Simple Icons vector paths (simpleicons.org, CC0). Each is rendered in
 * its brand colour — Instagram in its signature gradient; X is theme-aware
 * (black on light / white on dark) so it stays visible on the card.
 * `detectSocialBrand` maps a link URL to its brand.
 */

// Official Simple Icons paths (viewBox 0 0 24 24).
const PATHS = {
  instagram:
    "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077",
  facebook:
    "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z",
  x: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  youtube:
    "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  linkedin:
    "M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z",
  substack:
    "M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z",
  tiktok:
    "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  github:
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  notion:
    "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z",
};

// Slack's real mark is inherently 4-colour (not a single-tone glyph like the
// others) — four rounded "L" pieces, each its own brand colour. Sourced
// verbatim from Slack's own icon SVG (Wikimedia Commons mirror of the 2019
// mark), viewBox 0 0 127 127.
const SLACK_PATHS = [
  {
    d: "M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z",
    fill: brandMarks.slack.rose,
  },
  {
    d: "M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z",
    fill: brandMarks.slack.sky,
  },
  {
    d: "M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z",
    fill: brandMarks.slack.green,
  },
  {
    d: "M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z",
    fill: brandMarks.slack.gold,
  },
];

// The "Join our Slack" link is a Google Form sign-up (forms.gle), not
// slack.com — so it can't be domain-matched like the others. It's the one
// Seva-means link that needs an exact-URL match instead.
const SLACK_SIGNUP_FORM_URL = "https://forms.gle/zc7JQiLHGxHKXP599";

/** Maps a link URL to a known brand, or null. */
export const detectSocialBrand = (url = "") => {
  const u = String(url).toLowerCase();
  if (u.includes("instagram.")) return "instagram";
  if (u.includes("facebook.") || u.includes("fb.com") || u.includes("fb.me")) return "facebook";
  if (u.includes("twitter.") || u.includes("x.com")) return "x";
  if (u.includes("youtube.") || u.includes("youtu.be")) return "youtube";
  if (u.includes("linkedin.")) return "linkedin";
  if (u.includes("substack.")) return "substack";
  if (u.includes("tiktok.")) return "tiktok";
  if (u.includes("github.com")) return "github";
  if (u.includes("notion.so") || u.includes("notion.com")) return "notion";
  if (u === SLACK_SIGNUP_FORM_URL.toLowerCase()) return "slack";
  return null;
};

// Per-brand crop + aspect so every glyph renders at the SAME HEIGHT (`size`),
// giving a visually consistent set. YouTube's mark is wide/short, so its viewBox
// is cropped to the mark (no built-in vertical padding) and its width scales up.
const META = {
  instagram: { viewBox: "0 0 24 24", aspect: 1 },
  facebook: { viewBox: "0 0 24 24", aspect: 1 },
  x: { viewBox: "0 0 24 24", aspect: 1 },
  youtube: { viewBox: "0 3.545 24 16.91", aspect: 24 / 16.91 },
  linkedin: { viewBox: "0 0 24 24", aspect: 1 },
  substack: { viewBox: "0 0 24 24", aspect: 1 },
  tiktok: { viewBox: "0 0 24 24", aspect: 1 },
  github: { viewBox: "0 0 24 24", aspect: 1 },
  slack: { viewBox: "0 0 127 127", aspect: 1 },
  notion: { viewBox: "0 0 24 24", aspect: 1 },
};

// Single-tone marks that keep their own brand colour in both themes. Brand
// colours are exempt from the WCAG contrast minimum (1.4.11 excludes
// logotypes), same as the Instagram gradient and the YouTube red above.
const BRAND_FILL = {
  substack: brandMarks.substack,
};

export const SocialBadge = ({ brand, size = 28, dark = false }) => {
  const rawId = useId();
  const meta = META[brand];
  if (brand === "slack" && meta) {
    const h = size;
    const w = Math.round(size * meta.aspect);
    return (
      <Svg width={w} height={h} viewBox={meta.viewBox}>
        {SLACK_PATHS.map((p) => (
          <Path key={p.fill} d={p.d} fill={p.fill} />
        ))}
      </Svg>
    );
  }
  const d = PATHS[brand];
  if (!d || !meta) return null;
  const h = size;
  const w = Math.round(size * meta.aspect);

  if (brand === "youtube") {
    // The Simple Icons glyph renders the play as a hole (shows the card behind).
    // Draw a white play triangle on top so it reads as the real red-with-white
    // YouTube mark. Triangle coords match the glyph's cutout.
    return (
      <Svg width={w} height={h} viewBox={meta.viewBox}>
        <Path d={d} fill={brandMarks.youtube} />
        <Path d="M9.545 8.432 15.818 12 9.545 15.568Z" fill={brandMarks.cutoutLight} />
      </Svg>
    );
  }

  if (brand === "facebook") {
    // Same as YouTube: the "f" is a cutout, so draw it white on the blue circle.
    return (
      <Svg width={w} height={h} viewBox={meta.viewBox}>
        <Path d={d} fill={brandMarks.facebook} />
        <Path
          d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245Z"
          fill={brandMarks.cutoutLight}
        />
      </Svg>
    );
  }

  if (brand === "tiktok") {
    // TikTok's mark is one note drawn three times with a chromatic offset:
    // cyan up-left, magenta down-right, and a foreground note that is black on
    // light and white on dark — which is how the brand shows it on either
    // background. A flat single-tone glyph would not read as the real logo.
    return (
      <Svg width={w} height={h} viewBox={meta.viewBox}>
        <Path d={d} fill={brandMarks.tiktokCyan} translateX={-0.9} translateY={-0.9} />
        <Path d={d} fill={brandMarks.tiktokMagenta} translateX={0.9} translateY={0.9} />
        <Path d={d} fill={dark ? brandMarks.cutoutLight : brandMarks.cutoutDark} />
      </Svg>
    );
  }

  if (brand === "linkedin") {
    // Same as Facebook: the "in" is a cutout in the Simple Icons glyph, so the
    // rounded square is drawn in LinkedIn blue and the letters painted on top.
    return (
      <Svg width={w} height={h} viewBox={meta.viewBox}>
        <Path d={d} fill={brandMarks.linkedin} />
        <Path
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286z"
          fill={brandMarks.cutoutLight}
        />
        <Path
          d="M5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452z"
          fill={brandMarks.cutoutLight}
        />
      </Svg>
    );
  }

  if (brand === "instagram") {
    const gradId = `ig${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
    return (
      <Svg width={w} height={h} viewBox={meta.viewBox}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor={brandMarks.instagram[0]} />
            <Stop offset="0.35" stopColor={brandMarks.instagram[1]} />
            <Stop offset="0.62" stopColor={brandMarks.instagram[2]} />
            <Stop offset="1" stopColor={brandMarks.instagram[3]} />
          </LinearGradient>
        </Defs>
        <Path d={d} fill={`url(#${gradId})`} />
      </Svg>
    );
  }

  // Single-tone marks: the brand's own colour where it has one, otherwise
  // theme-aware black/white (x / github / notion) so the glyph stays visible.
  return (
    <Svg width={w} height={h} viewBox={meta.viewBox}>
      <Path
        d={d}
        fill={BRAND_FILL[brand] || (dark ? brandMarks.cutoutLight : brandMarks.cutoutDark)}
      />
    </Svg>
  );
};

SocialBadge.propTypes = {
  brand: PropTypes.oneOf([
    "instagram",
    "facebook",
    "x",
    "youtube",
    "linkedin",
    "substack",
    "tiktok",
    "github",
    "slack",
    "notion",
  ]).isRequired,
  size: PropTypes.number,
  dark: PropTypes.bool,
};

