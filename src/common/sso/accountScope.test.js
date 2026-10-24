/* eslint-env jest */
/**
 * Account-boundary logic: which sign-ins count as "a different person is now
 * using this device", and what gets wiped when one does.
 *
 * The false-positive direction matters as much as the false-negative one. Too
 * eager and a user loses their own unsent changes for re-logging in after an
 * expiry; too lax and the next account receives the previous one's.
 *
 * The collaborators are mocked rather than globally stubbed: accountScope pulls
 * in the actions barrel (→ firebase), which this logic does not depend on.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isAccountChange,
  purgeLocalUserData,
  applyAccountScope,
  destroyLocalAccountData,
  readLastAccount,
  writeLastAccount,
} from "./accountScope";

jest.mock("../actions", () => ({
  clearUserData: () => ({ type: "CLEAR_USER_DATA" }),
}));
jest.mock("../firebase/crashlytics", () => ({ logError: jest.fn() }));
const mockCancelAllReminders = jest.fn(() => Promise.resolve());
jest.mock("../notifications", () => ({
  cancelAllReminders: (...a) => mockCancelAllReminders(...a),
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe("isAccountChange", () => {
  it("is false for the same account (re-login after an expiry must not purge)", () => {
    expect(isAccountChange("a@khalis.net", "a@khalis.net")).toBe(false);
  });

  it("is true when a different account signs in", () => {
    expect(isAccountChange("b@khalis.net", "a@khalis.net")).toBe(true);
  });

  it("is true on first sign-in when the device has no owner yet", () => {
    expect(isAccountChange("a@khalis.net", null)).toBe(true);
  });

  it("is true on sign-out from an account", () => {
    expect(isAccountChange(null, "a@khalis.net")).toBe(true);
  });

  // Every launch of a never-signed-in app takes this path. Returning true would
  // purge a signed-out user's data on every cold start.
  it("is FALSE when signed out and there was never an account", () => {
    expect(isAccountChange(null, null)).toBe(false);
    expect(isAccountChange(undefined, null)).toBe(false);
    expect(isAccountChange("", null)).toBe(false);
  });

  // The SSO may return a differently-cased address than the one stored;
  // treating those as different accounts would purge for nothing.
  it("ignores case and surrounding whitespace", () => {
    expect(isAccountChange("A@Khalis.NET", "a@khalis.net")).toBe(false);
    expect(isAccountChange("  a@khalis.net  ", "a@khalis.net")).toBe(false);
  });

  it("treats non-string input as no account", () => {
    expect(isAccountChange(123, null)).toBe(false);
    expect(isAccountChange(null, 123)).toBe(false);
  });
});

describe("purgeLocalUserData", () => {
  const dispatch = jest.fn();

  it("dispatches CLEAR_USER_DATA", async () => {
    await purgeLocalUserData(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
  });

  // Redux forgetting the reminders does not stop the OS firing them, so the
  // next person would be woken for the previous one's nitnem.
  it("cancels the reminders already scheduled with the OS", async () => {
    await purgeLocalUserData(dispatch);
    expect(mockCancelAllReminders).toHaveBeenCalledTimes(1);
  });

  it("still purges when cancelling the schedule fails", async () => {
    mockCancelAllReminders.mockRejectedValueOnce(new Error("notifee"));
    await expect(purgeLocalUserData(dispatch)).resolves.toBeUndefined();
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
  });
});

describe("destroyLocalAccountData", () => {
  it("purges and forgets the owner, so the next sign-in is a first one", async () => {
    const dispatch = jest.fn();
    await writeLastAccount("a@khalis.net");
    await destroyLocalAccountData(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
    expect(await readLastAccount()).toBeNull();
  });
});

describe("applyAccountScope", () => {
  const dispatch = jest.fn();

  it("resets preferences and records the new owner on a real account change", async () => {
    await writeLastAccount("a@khalis.net");
    const purged = await applyAccountScope("b@khalis.net", dispatch);
    expect(purged).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
    expect(await readLastAccount()).toBe("b@khalis.net");
  });

  it("does nothing when the same account signs back in", async () => {
    await writeLastAccount("a@khalis.net");
    const purged = await applyAccountScope("a@khalis.net", dispatch);
    expect(purged).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  // A first sign-in has no previous ACCOUNT to protect — only whatever this
  // person did on the device before signing in, which is their own.
  it("CLAIMS a first sign-in rather than purging it", async () => {
    expect(await readLastAccount()).toBeNull();
    const purged = await applyAccountScope("a@khalis.net", dispatch);
    expect(purged).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
    // Still records the owner, so the NEXT account is a real switch.
    expect(await readLastAccount()).toBe("a@khalis.net");
  });

  it("purges in full once a second account signs in after that", async () => {
    await applyAccountScope("a@khalis.net", dispatch);
    jest.clearAllMocks();
    const purged = await applyAccountScope("b@khalis.net", dispatch);
    expect(purged).toBe(true);
    expect(dispatch).toHaveBeenCalledWith({ type: "CLEAR_USER_DATA" });
    expect(await readLastAccount()).toBe("b@khalis.net");
  });

  it("does nothing on a launch that was never signed in", async () => {
    const purged = await applyAccountScope(null, dispatch);
    expect(purged).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("stores the normalised address, so case never causes a false purge", async () => {
    await applyAccountScope("A@Khalis.NET", dispatch);
    expect(await readLastAccount()).toBe("a@khalis.net");
    jest.clearAllMocks();
    expect(await applyAccountScope("a@khalis.net", dispatch)).toBe(false);
  });

  // Android delivers one sign-in twice (openAuth and the return link). Run
  // together, both read the old owner and both purged.
  it("purges once when the same sign-in arrives twice at the same moment", async () => {
    await writeLastAccount("a@khalis.net");
    const results = await Promise.all([
      applyAccountScope("b@khalis.net", dispatch),
      applyAccountScope("b@khalis.net", dispatch),
    ]);
    expect(results).toEqual([true, false]);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  // A failed purge must not block sign-in — the user would be stuck unable to
  // log in at all, which is worse than briefly stale data.
  it("reports false rather than throwing when the purge fails", async () => {
    await writeLastAccount("a@khalis.net");
    const failing = jest.fn(() => {
      throw new Error("store unavailable");
    });
    await expect(applyAccountScope("b@khalis.net", failing)).resolves.toBe(false);
  });
});
