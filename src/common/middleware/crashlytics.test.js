/* eslint-env jest */
import crashlyticsMiddleware from "./crashlytics";

const mockSetCustomKey = jest.fn();
jest.mock("../firebase/crashlytics", () => ({ setCustomKey: (...a) => mockSetCustomKey(...a) }));

const run = (action) => {
  const store = { getState: () => ({}) };
  crashlyticsMiddleware(store)(() => {})(action);
  jest.runAllTimers();
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());

// The SSO session carries the person's email and SAML nameID. Every crash
// report carries the last action's value, so that one must not.
it("never sends the signed-in person's details with a crash report", () => {
  run({
    type: "SET_AUTH_SESSION",
    value: { user: { email: "a@khalis.net", nameID: "a@khalis.net" }, expiresAt: 1 },
  });
  const sent = JSON.stringify(mockSetCustomKey.mock.calls);
  expect(sent).not.toContain("a@khalis.net");
  expect(mockSetCustomKey).toHaveBeenCalledWith("last-action", "SET_AUTH_SESSION");
});

it("still records an ordinary action's value", () => {
  run({ type: "SET_FONT_SIZE", value: "LARGE" });
  expect(mockSetCustomKey).toHaveBeenCalledWith("last-action-value", "LARGE");
});
