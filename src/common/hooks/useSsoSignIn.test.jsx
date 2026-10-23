/* eslint-env jest */
import React from "react";

import { render, act } from "@testing-library/react-native";

import useSsoActions from "./useSsoActions";

// A sign-in that finishes in the in-app browser begins the session exactly as
// one caught from the return link does. On iOS it is the only path: the
// browser hands the URL straight back and no Linking event fires, so skipping
// the account check there let a different account inherit the previous one's
// settings and reminders, and skipping the timer left an expiry unnoticed.

const mockStartLogin = jest.fn();
const mockBeginSession = jest.fn(() => Promise.resolve());
const mockDispatch = jest.fn();
const mockErrorToast = jest.fn();

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn({ auth: { status: "signedOut", user: null, busy: false } }),
}));
jest.mock("../actions", () => ({
  setAuthSession: (p) => ({ type: "SET_AUTH_SESSION", p }),
  clearAuthSession: () => ({ type: "CLEAR_AUTH_SESSION" }),
  setAuthBusy: (v) => ({ type: "SET_AUTH_BUSY", v }),
}));
jest.mock("../components/ConfirmDialog", () => ({ showConfirm: jest.fn() }));
jest.mock("../firebase/analytics", () => ({ trackSsoEvent: jest.fn() }));
jest.mock("../localization", () => ({ SIGN_IN_FAILED: "Sign-in failed" }));
jest.mock("../sso/session", () => ({
  beginSession: (...a) => mockBeginSession(...a),
  endSession: jest.fn(),
}));
jest.mock("../sso/accountScope", () => ({
  destroyLocalAccountData: jest.fn(),
  purgeLocalUserData: jest.fn(),
  writeLastAccount: jest.fn(),
}));
jest.mock("../sso/deleteAccount", () => ({ requestAccountDeletion: jest.fn() }));
jest.mock("../sso/khalisSso", () => ({
  startLogin: (...a) => mockStartLogin(...a),
  startLogout: jest.fn(),
}));
jest.mock("../sso/tokenStore", () => ({ clearToken: jest.fn(), readToken: jest.fn() }));
jest.mock("../toast", () => ({
  showErrorToast: (...a) => mockErrorToast(...a),
  showInfoToast: jest.fn(),
}));

let actions;
const Probe = () => {
  actions = useSsoActions({ entryPoint: "settings" });
  return null;
};

beforeEach(() => jest.clearAllMocks());

it("begins the session through the session's own begin, with its expiry", async () => {
  const user = { email: "b@khalis.net" };
  mockStartLogin.mockResolvedValue({ status: "success", user, expiresAt: 123 });
  render(<Probe />);

  await act(() => actions.signIn());

  // The one begin runs the account check, announces the session and arms the
  // expiry timer, so none of them can be skipped on this path.
  expect(mockBeginSession).toHaveBeenCalledWith(user, 123);
});

it("leaves the account alone when the sign-in did not complete", async () => {
  mockStartLogin.mockResolvedValue({ status: "cancelled" });
  render(<Probe />);

  await act(() => actions.signIn());

  expect(mockBeginSession).not.toHaveBeenCalled();
});
