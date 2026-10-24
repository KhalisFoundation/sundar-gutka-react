/* eslint-env jest */
import {
  ROUTE_READER,
  ROUTE_SEVA,
  ROUTE_STORE,
  ROUTE_URL,
  routeForNotification,
} from "./pushRouting";

// The data a campaign author types into the Firebase console is untrusted
// input as far as the app is concerned: these pin that a typo, an old build
// or a missing field opens the app rather than crashing it or navigating
// somewhere odd.

describe("routeForNotification", () => {
  it("opens a bani for a reminder-shaped payload with no route", () => {
    expect(routeForNotification({ id: "21", gurmukhi: "ਜਪੁਜੀ ਸਾਹਿਬ" })).toEqual({
      route: ROUTE_READER,
      id: "21",
      title: "ਜਪੁਜੀ ਸਾਹਿਬ",
    });
  });

  it("opens a bani for an explicit reader route", () => {
    expect(routeForNotification({ route: "reader", id: 4 })).toEqual({
      route: ROUTE_READER,
      id: "4",
      title: undefined,
    });
  });

  it("refuses a reader route whose id is not a bani id", () => {
    expect(routeForNotification({ route: "reader", id: "japji" })).toBeNull();
    expect(routeForNotification({ route: "reader" })).toBeNull();
  });

  it("accepts the named screens, case-insensitively", () => {
    expect(routeForNotification({ route: "Seva" })).toEqual({ route: ROUTE_SEVA });
    expect(routeForNotification({ route: "store" })).toEqual({ route: ROUTE_STORE });
  });

  it("opens only https urls in the browser", () => {
    const url = "https://khalisfoundation.org/donate";
    expect(routeForNotification({ route: "url", url })).toEqual({ route: ROUTE_URL, url });
    expect(routeForNotification({ route: "url", url: "http://insecure.example" })).toBeNull();
    expect(routeForNotification({ route: "url", url: "not a url" })).toBeNull();
    expect(routeForNotification({ route: "url" })).toBeNull();
  });

  it("answers null for an unknown route, an empty payload and a missing one", () => {
    expect(routeForNotification({ route: "lottery" })).toBeNull();
    expect(routeForNotification({})).toBeNull();
    expect(routeForNotification(undefined)).toBeNull();
    expect(routeForNotification("seva")).toBeNull();
  });
});
