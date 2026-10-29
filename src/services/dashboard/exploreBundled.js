import STRINGS from "@common/localization";

// The Explore tiles the app ships with — what renders when the backend has
// never been reached and nothing is cached. A faithful mirror of the API's own
// built-in list (khalis-users-api, src/explore-links/content/links.ts): keep
// the two in step, they are one list seen from either end of the network.
//
// Labels resolve through STRINGS at call time, so the bundled list follows a
// language switch exactly as a fetched one would. Brand names and proper nouns
// are literals here for the same reason they are on the server: they are not
// translated.

const BUNDLED = [
  {
    id: "search",
    position: 10,
    titleKey: "TILE_SEARCH_SHABAD",
    subtitle: "SikhiToTheMax",
    url: "https://www.sikhitothemax.org",
    icon: "sttm",
  },
  {
    id: "hukamnama",
    position: 20,
    titleKey: "TILE_HUKAMNAMA",
    subtitle: "Sri Darbar Sahib",
    url: "https://www.sikhitothemax.org/hukamnama",
    icon: "darbar",
    plate: "deep",
  },
  {
    id: "khalis-ai",
    position: 30,
    titleKey: "TILE_ASK_AI",
    subtitleKey: "TILE_GURBANI_QA",
    badgeKey: "BADGE_NEW",
    // The redesigned site, asking it to open on the Ask Khalis AI tab rather
    // than Search Gurbani. The parameter is theirs to honour: as of writing the
    // page still opens on Search Gurbani and ignores it, so this lands correctly
    // once SikhiToTheMax ships that. Overriding the row in the database changes
    // it for everyone without an app release.
    url: "https://next.sikhitothemax.org/?mode=khalis-ai",
    icon: "khalis",
  },
  {
    id: "sehaj-path",
    position: 40,
    title: "Sehaj Path",
    subtitle: "Khalis App",
    url: "https://play.google.com/store/apps/details?id=com.khalis.sehajpathapp",
    androidPkg: "com.khalis.sehajpathapp",
    iosAppId: "6752426194",
    icon: "sehajpath",
    plate: "pale",
  },
  {
    id: "shabadavali",
    position: 50,
    titleKey: "TILE_LEARN_WORD",
    subtitle: "Shabadavali",
    url: "https://shabadavali.com/en/login",
    // On Play, not on the App Store: there is no Shabadavali under the Khalis
    // developer account. So Android gets all three levels and iOS has no store
    // level, which storeUrlsFor answers by returning null and falling to the
    // web — the right floor for a web app.
    androidPkg: "org.khalisfoundation.shabadavali",
    appLink: "shabadavali",
    icon: "shabadavali",
  },
  {
    id: "gurdham",
    position: 60,
    titleKey: "TILE_EXPLORE_GURDHAM",
    subtitle: "Gurdham",
    url: "https://gurdham.com",
    androidPkg: "com.khalis.gurdham",
    appLink: "khalisgurdham://login",
    iosAppId: "6789282113",
    icon: "gurdham",
  },
];

const resolve = (literal, key) => (key ? STRINGS[key] : literal) || "";

/**
 * The bundled tiles in the same shape the API returns, labels resolved in the
 * current language.
 * @returns {Array<{id:string, position:number, title:string, subtitle:string, badge:string|null, url:string, androidPkg:string|null, appLink:string|null, iosAppId:string|null, icon:string|null, plate:string|null}>}
 */
export const bundledExploreLinks = () =>
  BUNDLED.map((t) => ({
    id: t.id,
    position: t.position,
    title: resolve(t.title, t.titleKey),
    subtitle: resolve(t.subtitle, t.subtitleKey),
    badge: t.badgeKey ? STRINGS[t.badgeKey] || null : null,
    url: t.url,
    androidPkg: t.androidPkg ?? null,
    appLink: t.appLink ?? null,
    iosAppId: t.iosAppId ?? null,
    icon: t.icon ?? null,
    plate: t.plate ?? null,
  }));

export default bundledExploreLinks;
