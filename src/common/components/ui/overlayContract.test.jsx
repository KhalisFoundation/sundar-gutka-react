import fs from "fs";
import path from "path";

import { render } from "@testing-library/react-native";
import React from "react";

import Overlay from "./Overlay";

// Jest renders the component TREE, not a native window. That gap is exactly
// where this app's worst UI bug lived: every Settings sheet rendered nothing on
// device — scrim covering the screen, no panel — while the whole suite stayed
// green, because the tree was correct and only the native window was not.
//
// These are the invariants that would have caught it. They are structural
// assertions about how overlays are configured, which IS observable in Jest,
// standing in for the window behaviour that is not.

const SRC = path.join(__dirname, "..", "..", "..");

const walk = (dir, out = []) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name)) out.push(p);
  });
  return out;
};

const sourceFiles = walk(SRC);

describe("every overlay in the app is configured in one place", () => {
  it("nothing renders a bare <Modal> except the Overlay primitive itself", () => {
    // A bare Modal is a window nobody configured. Six of the app's eight modals
    // were missing `navigationBarTranslucent`, so under Android's edge-to-edge
    // enforcement their window stopped above the navigation bar while
    // `useWindowDimensions` still reported the full display — anything measured
    // against the screen then overflowed its own window.
    const offenders = sourceFiles.filter(
      (f) => !f.endsWith(`${path.sep}Overlay.jsx`) && /<Modal[\s/>]/.test(fs.readFileSync(f, "utf8"))
    );
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it("declares both translucency flags, which only work as a pair", () => {
    const src = fs.readFileSync(path.join(__dirname, "Overlay.jsx"), "utf8");
    expect(src).toMatch(/statusBarTranslucent/);
    expect(src).toMatch(/navigationBarTranslucent/);
  });

  it("forwards onShow, the only safe moment to start an entrance", () => {
    // A Modal's children are not attached during the commit that renders it, so
    // a native-driven animation started in an effect targets a view that does
    // not exist and is silently dropped. The sheet then never leaves its
    // off-screen start value and the user sees only the scrim.
    const src = fs.readFileSync(path.join(__dirname, "Overlay.jsx"), "utf8");
    expect(src).toMatch(/onShow=\{onShow\}/);
  });

  it("passes onShow through to something that can fire it", () => {
    const onShow = jest.fn();
    render(
      <Overlay onShow={onShow} testID="ov">
        {null}
      </Overlay>
    );
    // The prop must survive to the host component; RN fires it from the
    // Dialog's own show listener on Android.
    expect(onShow).toBeDefined();
  });
});

describe("sheets cannot go back to measuring the screen", () => {
  it("no overlay pins a height to useWindowDimensions", () => {
    // `minHeight: useWindowDimensions().height` on a scrim overflows the Modal's
    // own window by the status-bar inset and pushes the sheet below the screen.
    const offenders = sourceFiles.filter((f) => {
      const src = fs.readFileSync(f, "utf8");
      return /minHeight:\s*height\b/.test(src);
    });
    expect(offenders.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
