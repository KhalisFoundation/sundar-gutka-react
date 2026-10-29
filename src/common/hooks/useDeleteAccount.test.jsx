/* eslint-env jest */
import React from "react";

import { render, act } from "@testing-library/react-native";

import useSsoActions from "./useSsoActions";

// The rule this file exists to hold: local data is destroyed ONLY when the
// server accepted the deletion. Every other outcome — refused, unreachable,
// timed out — must leave the phone exactly as it was. Wiping a device for a
// request that never landed takes the user's history while their account
// carries on existing, and there is no way back from it.

const mockRequestDeletion = jest.fn();
const mockDestroy = jest.fn();
const mockPurge = jest.fn();
const mockSwitchAnalytics = jest.fn();
const mockWriteLastAccount = jest.fn();
const mockClearToken = jest.fn();
const mockShowConfirm = jest.fn();
const mockErrorToast = jest.fn();
const mockInfoToast = jest.fn();
const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn({ auth: { status: "signedIn", user: { email: "a@b.c" }, busy: false } }),
}));

jest.mock("../actions", () => ({
  setAuthSession: (p) => ({ type: "SET_AUTH_SESSION", p }),
  clearAuthSession: () => ({ type: "CLEAR_AUTH_SESSION" }),
  setAuthBusy: (v) => ({ type: "SET_AUTH_BUSY", v }),
}));

jest.mock("../components/ConfirmDialog", () => ({
  showConfirm: (...a) => mockShowConfirm(...a),
}));

// The hook reports each SSO outcome; the native analytics module cannot load
// under jest, and what is emitted is pinned in analyticsFeatures.test.js.
jest.mock("../firebase/analytics", () => ({
  trackSsoEvent: jest.fn(),
}));

jest.mock("../localization", () => ({
  CANCEL: "Cancel",
  SESSION_EXPIRED: "Session expired",
  DELETE_ACCOUNT_CONFIRM_TITLE: "Delete your Khalis account?",
  DELETE_ACCOUNT_CONFIRM_MESSAGE: "You'll be signed out of all Khalis apps…",
  DELETE_ACCOUNT_CONFIRM_ACTION: "Delete my account",
  DELETE_ACCOUNT_DONE: "Your account has been deleted.",
  DELETE_ACCOUNT_FAILED: "Could not delete your account. Please try again.",
  DELETE_ACCOUNT_OFFLINE: "No connection. Check your internet and try again.",
}));

jest.mock("../sso/accountScope", () => ({
  destroyLocalAccountData: (...a) => mockDestroy(...a),
  purgeLocalUserData: (...a) => mockPurge(...a),
  switchAnalyticsAccount: (...a) => mockSwitchAnalytics(...a),
  writeLastAccount: (...a) => mockWriteLastAccount(...a),
}));

jest.mock("../sso/deleteAccount", () => ({
  requestAccountDeletion: (...a) => mockRequestDeletion(...a),
}));

jest.mock("../sso/khalisSso", () => ({ startLogin: jest.fn(), startLogout: jest.fn() }));
jest.mock("../sso/tokenStore", () => ({
  clearToken: (...a) => mockClearToken(...a),
  readToken: jest.fn(),
}));
jest.mock("../toast", () => ({
  showErrorToast: (...a) => mockErrorToast(...a),
  showInfoToast: (...a) => mockInfoToast(...a),
}));

let actions;
const Probe = () => {
  actions = useSsoActions();
  return null;
};

/** Press "Delete Account", then answer its confirmation dialog. */
const confirmDelete = async () => {
  render(<Probe />);
  act(() => actions.deleteAccount());
  await act(async () => {
    await mockShowConfirm.mock.calls[0][0].onConfirm();
  });
};

beforeEach(() => jest.clearAllMocks());

describe("the confirmation", () => {
  it("names what is lost and how long they have to change their mind", () => {
    render(<Probe />);
    act(() => actions.deleteAccount());

    const opts = mockShowConfirm.mock.calls[0][0];
    expect(opts.title).toBe("Delete your Khalis account?");
    expect(opts.confirmText).toBe("Delete my account");
    expect(opts.cancelText).toBe("Cancel");
    expect(opts.destructive).toBe(true);
  });

  it("asks the server nothing until it is answered", () => {
    render(<Probe />);
    act(() => actions.deleteAccount());

    expect(mockRequestDeletion).not.toHaveBeenCalled();
  });
});

describe("when the server accepted", () => {
  it.each([
    ["200", { ok: true, reason: "deleted" }],
    ["409, already scheduled", { ok: true, reason: "already" }],
  ])("destroys the local data and signs out (%s)", async (_label, result) => {
    mockRequestDeletion.mockResolvedValue(result);
    await confirmDelete();

    expect(mockDestroy).toHaveBeenCalledTimes(1);
    expect(mockClearToken).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_AUTH_SESSION" });
    expect(mockInfoToast).toHaveBeenCalledWith("Your account has been deleted.");
  });
});

describe("when it did not land", () => {
  it.each([
    ["a 500", { ok: false, reason: "server" }, "Could not delete your account. Please try again."],
    [
      "no connection",
      { ok: false, reason: "offline" },
      "No connection. Check your internet and try again.",
    ],
  ])("keeps every byte of local data (%s)", async (_label, result, message) => {
    mockRequestDeletion.mockResolvedValue(result);
    await confirmDelete();

    expect(mockDestroy).not.toHaveBeenCalled();
    expect(mockPurge).not.toHaveBeenCalled();
    expect(mockClearToken).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: "CLEAR_AUTH_SESSION" });
    expect(mockErrorToast).toHaveBeenCalledWith(message);
  });
});

// A 401 means the token was refused, so the account was never asked — the
// session is worthless but the DATA is untouched and must stay that way.
describe("when the session was refused", () => {
  it("signs out locally without destroying anything", async () => {
    mockRequestDeletion.mockResolvedValue({ ok: false, reason: "session" });
    await confirmDelete();

    expect(mockDestroy).not.toHaveBeenCalled();
    expect(mockSwitchAnalytics).toHaveBeenCalledWith(null);
    expect(mockPurge).toHaveBeenCalledTimes(1);
    expect(mockClearToken).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_AUTH_SESSION" });
    expect(mockErrorToast).toHaveBeenCalledWith("Session expired");
  });
});

it("always clears the busy flag, however it ended", async () => {
  mockRequestDeletion.mockResolvedValue({ ok: false, reason: "server" });
  await confirmDelete();

  expect(mockDispatch).toHaveBeenCalledWith({ type: "SET_AUTH_BUSY", v: true });
  expect(mockDispatch).toHaveBeenCalledWith({ type: "SET_AUTH_BUSY", v: false });
});
