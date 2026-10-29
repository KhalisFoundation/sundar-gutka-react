// Onboarding carousel slides — one per topic the old spotlight tour covered, in
// the same order a new user meets them. Copy is reused from the existing
// localized STRINGS (the TOUR_* keys), so the carousel is fully multilingual
// with no new strings to translate.
//
// `image` is the screenshot shown above the text — the same shots the tour
// pointed at, captured from the live app. Until a slide's PNG is added under
// ./images, leave `image` null and a placeholder renders in its place. To wire
// one up, drop the file in ./images and set:
//   image: require("./images/<name>.png")
export const ONBOARDING_SLIDES = [
  {
    key: "tracks",
    titleKey: "TOUR_READER_TRACKS_TITLE",
    bodyKey: "TOUR_READER_TRACKS_BODY",
    image: require("./images/preview.png"),
    aspectRatio: 1080 / 1016,
  },
  {
    key: "play",
    titleKey: "TOUR_READER_PLAY_TITLE",
    bodyKey: "TOUR_READER_PLAY_BODY",
    image: require("./images/play.png"),
    aspectRatio: 1080 / 625,
  },
  {
    key: "download",
    titleKey: "TOUR_READER_DOWNLOAD_TITLE",
    bodyKey: "TOUR_READER_DOWNLOAD_BODY",
    image: require("./images/offline.png"),
    aspectRatio: 1080 / 630,
  },
  {
    key: "manage",
    titleKey: "TOUR_MANAGE_DOWNLOADS_TITLE",
    bodyKey: "TOUR_MANAGE_DOWNLOADS_BODY",
    image: require("./images/downloads.png"),
    aspectRatio: 1080 / 584,
  },
];

export default ONBOARDING_SLIDES;
