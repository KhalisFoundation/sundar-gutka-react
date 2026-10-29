// Where a tapped push notification takes the user — the pure half, so every
// route rule has a unit test and the navigation code only has to act on the
// answer.
//
// A campaign puts its destination in the message DATA, never in the title or
// body, as `route` plus whatever that route needs:
//
//   route=reader        id=<baniId> [gurmukhi=<title>]   open a bani
//   route=seva                                            the Seva page
//   route=update                                          Database Update
//   route=dashboard                                       the Dashboard
//   route=settings                                        Settings
//   route=url           url=<https://…>                   the in-app browser
//   route=store                                           this app's store page
//
// A message with no `route` but with an `id` is a reminder (the shape the
// app's own scheduled notifications have always used) and opens the bani. A
// message with neither, or with a route this build does not know, opens the
// app on whatever screen it was on — an old build must not break on a new
// campaign, and a typo in the console must not either.

export const ROUTE_READER = "reader";
export const ROUTE_SEVA = "seva";
export const ROUTE_UPDATE = "update";
export const ROUTE_DASHBOARD = "dashboard";
export const ROUTE_SETTINGS = "settings";
export const ROUTE_URL = "url";
export const ROUTE_STORE = "store";

const HTTPS = /^https:\/\/\S+$/i;

const str = (value) => (value == null ? "" : String(value).trim());

/**
 * @param {object|undefined} data the notification's data payload
 * @returns {null | { route: string, id?: string, title?: string, url?: string }}
 */
export const routeForNotification = (data) => {
  if (!data || typeof data !== "object") return null;
  const route = str(data.route).toLowerCase();
  const id = str(data.id);

  if (route === ROUTE_READER || (!route && id)) {
    // A bani id is a positive integer; anything else is not a bani.
    if (!/^\d+$/.test(id)) return null;
    return { route: ROUTE_READER, id, title: str(data.gurmukhi) || undefined };
  }
  if (route === ROUTE_URL) {
    const url = str(data.url);
    return HTTPS.test(url) ? { route: ROUTE_URL, url } : null;
  }
  if ([ROUTE_SEVA, ROUTE_UPDATE, ROUTE_DASHBOARD, ROUTE_SETTINGS, ROUTE_STORE].includes(route)) {
    return { route };
  }
  return null;
};

export default routeForNotification;
