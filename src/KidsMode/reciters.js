// `key` is the reciter code the scoring service uses; `folder` is how the Khalis audio CDN,
// and so the audio manifest's track URLs, name the same reciter.
export const RECITERS = [
  { key: "ggs", title: "Giani Gurdev Singh", folder: "GianiGurdevSingh" },
  { key: "bjs", title: "Bhai Jarnail Singh", folder: "BhaiJarnailSingh" },
  { key: "imk", title: "Bibi Indermohan Kaur", folder: "IndermohanKaurUK" },
];

export const DEFAULT_RECITER = "bjs";

export const reciterOf = (key) =>
  RECITERS.find((r) => r.key === key) ?? RECITERS.find((r) => r.key === DEFAULT_RECITER);

// The reciter whose CDN folder a track URL points into.
export const reciterForUrl = (url = "") => RECITERS.find((r) => url.includes(`/${r.folder}/`));
