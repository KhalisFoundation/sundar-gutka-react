# Onboarding carousel screenshots

Screenshots shown above the text on each onboarding slide, captured from the
live app (the same things the old spotlight tour pointed at). They're wired up
in [`../slides.js`](../slides.js) via `require("./images/<name>.png")`.

## Current slides

All four slides ship a screenshot — there are no empty/placeholder slides right
now. The file name does **not** have to match the slide `key`; the mapping is
whatever `../slides.js` requires.

| Slide `key` | Image file      | STRINGS (title / body)                                     | `aspectRatio` |
|-------------|-----------------|------------------------------------------------------------|---------------|
| `tracks`    | `preview.png`   | `TOUR_READER_TRACKS_TITLE` / `TOUR_READER_TRACKS_BODY`     | `1080 / 1016` |
| `play`      | `play.png`      | `TOUR_READER_PLAY_TITLE` / `TOUR_READER_PLAY_BODY`         | `1080 / 625`  |
| `download`  | `offline.png`   | `TOUR_READER_DOWNLOAD_TITLE` / `TOUR_READER_DOWNLOAD_BODY` | `1080 / 630`  |
| `manage`    | `downloads.png` | `TOUR_MANAGE_DOWNLOADS_TITLE` / `TOUR_MANAGE_DOWNLOADS_BODY`| `1080 / 584`  |

## How a slide picks its image

Each slide object in `../slides.js` supports:

- `image` — the screenshot, e.g. `require("./images/preview.png")`. One image per
  slide; the same shot is used in both light and dark mode (no theme-specific
  variants).
- `aspectRatio` — `width / height` of the image, applied to the image frame so it
  renders at the right shape. Set this to match the PNG you drop in, e.g. a
  1080×625 capture → `aspectRatio: 1080 / 625`.

If a slide has no `image`, `index.jsx` renders a dashed placeholder showing the
slide `key` instead — the carousel stays fully functional.

## Replacing or adding a screenshot

1. Drop the PNG in this folder (any name).
2. In `../slides.js`, point the slide's `image` at it and set `aspectRatio` to the
   PNG's `width / height`.

```js
{
  key: "tracks",
  titleKey: "TOUR_READER_TRACKS_TITLE",
  bodyKey: "TOUR_READER_TRACKS_BODY",
  image: require("./images/preview.png"),
  aspectRatio: 1080 / 1016,
},
```

Width-1080 captures cropped to just the relevant UI (which is why the heights
vary) work well — keep `aspectRatio` in sync with whatever you export.
