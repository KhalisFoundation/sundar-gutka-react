/* eslint-env jest */
import React from "react";
import { AppState } from "react-native";

import { render } from "@testing-library/react-native";

import useAccountSync from "./useAccountSync";

const mockSyncAll = jest.fn(() => Promise.resolve(true));
jest.mock("./syncRegistry", () => ({ syncAll: (...a) => mockSyncAll(...a) }));

let mockState;
jest.mock("react-redux", () => ({ useSelector: (fn) => fn(mockState) }));

let mockOffline;
jest.mock("@common", () => ({ useNetwork: () => ({ isOffline: mockOffline }) }));

let onAppState;
beforeEach(() => {
  jest.clearAllMocks();
  mockState = { auth: { status: "signedOut" } };
  mockOffline = false;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_e, handler) => {
    onAppState = handler;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.restoreAllMocks());

const Probe = () => {
  useAccountSync();
  return null;
};

it("syncs when the session starts, and not while signed out", () => {
  const { rerender } = render(<Probe />);
  expect(mockSyncAll).not.toHaveBeenCalled();

  mockState = { auth: { status: "signedIn" } };
  rerender(<Probe />);
  expect(mockSyncAll).toHaveBeenCalledTimes(1);
});

it("syncs on returning to the foreground only when signed in", () => {
  render(<Probe />);
  onAppState("active");
  expect(mockSyncAll).not.toHaveBeenCalled();

  mockState = { auth: { status: "signedIn" } };
  const { rerender } = render(<Probe />);
  rerender(<Probe />);
  mockSyncAll.mockClear();
  onAppState("background");
  onAppState("active");
  expect(mockSyncAll).toHaveBeenCalledTimes(1);
});

it("syncs when connectivity returns, not on the first reading", () => {
  mockState = { auth: { status: "signedIn" } };
  mockOffline = true;
  const { rerender } = render(<Probe />);
  mockSyncAll.mockClear();

  mockOffline = false;
  rerender(<Probe />);
  expect(mockSyncAll).toHaveBeenCalledTimes(1);
});
