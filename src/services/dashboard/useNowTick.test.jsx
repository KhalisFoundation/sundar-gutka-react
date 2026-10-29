/* eslint-env jest */
/**
 * The clock behind the relative sync label.
 *
 * An absolute timestamp is correct forever with no re-render, which is why the
 * header could render it once and forget it. A relative one is wrong sixty
 * seconds later, and nothing else on this screen would refresh it in time — the
 * sync store only notifies when a push or pull is actually recorded, and pushes
 * are debounced, held behind a cooldown, and mostly fire on backgrounding.
 *
 * So the two properties worth pinning are that it keeps ticking while someone
 * is looking at it, and that it stops when nobody is.
 */
import React from "react";
import { AppState } from "react-native";

import { render, act } from "@testing-library/react-native";

import { useNowTick } from "./useNowTick";

let mockAppStateHandler = null;
const mockRemove = jest.fn();
AppState.addEventListener = jest.fn((event, handler) => {
  if (event === "change") mockAppStateHandler = handler;
  return { remove: mockRemove };
});

const seen = [];
const Probe = () => {
  seen.push(useNowTick());
  return null;
};

const START = Date.parse("2026-08-19T12:00:00.000Z");

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(START);
  seen.length = 0;
  mockRemove.mockClear();
  mockAppStateHandler = null;
});

afterEach(() => {
  jest.useRealTimers();
});

const advance = (ms) => {
  act(() => {
    jest.setSystemTime(Date.now() + ms);
    jest.advanceTimersByTime(ms);
  });
};

it("starts at the current time", () => {
  render(<Probe />);
  expect(seen[0]).toBe(START);
});

it("hands out a FRESH clock as time passes", () => {
  render(<Probe />);
  advance(60 * 1000);
  expect(seen[seen.length - 1]).toBeGreaterThanOrEqual(START + 60 * 1000);
});

it("stops ticking once the app is backgrounded", () => {
  render(<Probe />);
  act(() => mockAppStateHandler("background"));
  const settled = seen.length;
  advance(5 * 60 * 1000);
  // Nothing new was pushed — no re-render behind a screen nobody is looking at.
  expect(seen.length).toBe(settled);
});

it("refreshes IMMEDIATELY on return to the foreground", () => {
  // Waiting out the interval would show a stale figure on the very first frame
  // the user sees, which is the moment it matters most.
  render(<Probe />);
  act(() => mockAppStateHandler("background"));
  act(() => {
    jest.setSystemTime(START + 3 * 60 * 60 * 1000);
  });
  act(() => mockAppStateHandler("active"));
  expect(seen[seen.length - 1]).toBe(START + 3 * 60 * 60 * 1000);
});

it("cleans up its timer and its listener on unmount", () => {
  const { unmount } = render(<Probe />);
  unmount();
  expect(mockRemove).toHaveBeenCalled();
  const settled = seen.length;
  advance(5 * 60 * 1000);
  expect(seen.length).toBe(settled);
});
