/* eslint-env jest */
import React from "react";
import { AppState, Linking } from "react-native";

import { act, render } from "@testing-library/react-native";

import { beginSession, endSession } from "../sso/session";

import useSsoSession from "./useSsoSession";

// Sessions begun and ended from a screen (sign-in, sign-out, deletion) go
// through the hook that owns the expiry timer. A sign-in on iOS used to get
// no timer at all, and a session ended by hand left the old one armed to
// report a second, phantom expiry.

const mockDispatch = jest.fn();
const mockInfoToast = jest.fn();
const mockApplyScope = jest.fn(() => Promise.resolve(false));

jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
jest.mock("../actions", () => ({
  setAuthSession: (value) => ({ type: "SET_AUTH_SESSION", value }),
  clearAuthSession: () => ({ type: "CLEAR_AUTH_SESSION" }),
}));
jest.mock("../firebase/analytics", () => ({ trackSsoEvent: jest.fn() }));
jest.mock("../localization", () => ({ SESSION_EXPIRED: "Session expired" }));
jest.mock("../sso/accountScope", () => ({
  applyAccountScope: (...a) => mockApplyScope(...a),
}));
jest.mock("../sso/jwt", () => ({
  decodeJwtPayload: jest.fn(),
  isTokenValid: () => false,
  toSessionUser: jest.fn(),
}));
jest.mock("../sso/khalisSso", () => ({
  consumeLoginRedirect: jest.fn(),
  forgetConsumedLogin: jest.fn(),
}));
jest.mock("../sso/tokenStore", () => ({
  readToken: jest.fn(() => Promise.resolve(null)),
  clearToken: jest.fn(() => Promise.resolve()),
  ensureInstallScopedToken: jest.fn(() => Promise.resolve()),
}));
jest.mock("../toast", () => ({ showInfoToast: (...a) => mockInfoToast(...a) }));
let mockOnRefused;
jest.mock("../../services/khalisRequest", () => ({
  onUnauthorized: (handler) => {
    mockOnRefused = handler;
    return () => {};
  },
}));

const Host = () => {
  useSsoSession();
  return null;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
  jest.spyOn(Linking, "addEventListener").mockReturnValue({ remove: jest.fn() });
  jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const mount = async () => {
  render(<Host />);
  await act(async () => {});
};

it("arms the expiry timer for a session begun from a screen", async () => {
  await mount();
  const user = { email: "a@khalis.net" };
  await act(() => beginSession(user, Date.now() + 60 * 1000));

  expect(mockApplyScope).toHaveBeenCalledWith("a@khalis.net", mockDispatch);
  await act(async () => {
    jest.advanceTimersByTime(61 * 1000);
  });
  expect(mockInfoToast).toHaveBeenCalledWith("Session expired");
});

it("disarms it when the session is ended from a screen", async () => {
  await mount();
  await act(() => beginSession({ email: "a@khalis.net" }, Date.now() + 60 * 1000));
  await act(() => endSession());
  mockInfoToast.mockClear();

  await act(async () => {
    jest.advanceTimersByTime(61 * 1000);
  });
  expect(mockInfoToast).not.toHaveBeenCalled();
});

// Android begins one sign-in twice, overlapping. Each used to clear the timer
// before its await, so both armed one and only the last was tracked — and the
// untracked one outlived a sign-out to report an expiry nobody had.
it("leaves no timer behind when two begins overlap and the session then ends", async () => {
  await mount();
  const user = { email: "a@khalis.net" };
  const at = Date.now() + 60 * 1000;
  await act(() => Promise.all([beginSession(user, at), beginSession(user, at)]));
  await act(() => endSession());

  await act(async () => {
    jest.advanceTimersByTime(61 * 1000);
  });
  expect(mockInfoToast).not.toHaveBeenCalled();
});

// The server refused a token the phone still holds (account deleted, signed
// out elsewhere). The session ends as an expiry does, once however many
// requests were refused together.
it("ends the session once when the server refuses the token", async () => {
  const { readToken } = jest.requireMock("../sso/tokenStore");
  readToken.mockResolvedValue("jwt");
  await mount();
  mockDispatch.mockClear();

  await act(() => Promise.all([mockOnRefused(), mockOnRefused()]));

  expect(mockInfoToast).toHaveBeenCalledTimes(1);
  expect(mockDispatch).toHaveBeenCalledWith({ type: "CLEAR_AUTH_SESSION" });
});

// A sign-in link that arrived while the launch restore was still reading the
// Keychain was saved, and the restore, having read no token, then ended the
// session and deleted it.
it("handles a sign-in link only once the launch restore has finished", async () => {
  const { readToken, clearToken } = jest.requireMock("../sso/tokenStore");
  const { consumeLoginRedirect } = jest.requireMock("../sso/khalisSso");
  let finishRead;
  readToken.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finishRead = resolve;
      })
  );
  let onUrl;
  Linking.addEventListener.mockImplementation((_e, handler) => {
    onUrl = handler;
    return { remove: jest.fn() };
  });
  consumeLoginRedirect.mockResolvedValue({ user: { email: "a@khalis.net" }, expiresAt: null });
  render(<Host />);
  await act(async () => {});

  const linkDone = onUrl({ url: "sundargutka://login?token=t" });
  await act(async () => {});
  expect(consumeLoginRedirect).not.toHaveBeenCalled();

  await act(async () => {
    finishRead(null);
    await linkDone;
  });
  expect(consumeLoginRedirect).toHaveBeenCalled();
  // The restore's clear ran before the sign-in, not after it.
  expect(clearToken.mock.invocationCallOrder[0]).toBeLessThan(
    consumeLoginRedirect.mock.invocationCallOrder[0]
  );
  expect(mockDispatch).toHaveBeenLastCalledWith(
    expect.objectContaining({ type: "SET_AUTH_SESSION" })
  );
});
