/* eslint-env jest */
import React from "react";
import { Animated } from "react-native";

import { render, act } from "@testing-library/react-native";

import PreviewSweep from "./PreviewSweep";

const layout = (node, width) =>
  act(() => {
    node.props.onLayout({ nativeEvent: { layout: { width, height: 44 } } });
  });

describe("PreviewSweep", () => {
  let timingSpy;

  beforeEach(() => {
    timingSpy = jest.spyOn(Animated, "timing");
  });

  afterEach(() => {
    timingSpy.mockRestore();
  });

  // width/height cannot be native-driven, which is why this animates translateX.
  // If it is ever swapped back to a width the driver silently falls back to the
  // JS thread and the sweep stutters again — the assertion below catches that.
  it("animates on the native driver for the full duration once measured", () => {
    const tree = render(<PreviewSweep durationMs={15000} />);
    const track = tree.UNSAFE_root.findAllByProps({ pointerEvents: "none" })[0];
    layout(track, 300);

    expect(timingSpy).toHaveBeenCalled();
    const [, config] = timingSpy.mock.calls[timingSpy.mock.calls.length - 1];
    expect(config.useNativeDriver).toBe(true);
    expect(config.toValue).toBe(0);
    expect(config.duration).toBe(15000);
  });

  it("does not animate before it knows how wide the row is", () => {
    render(<PreviewSweep durationMs={15000} />);
    expect(timingSpy).not.toHaveBeenCalled();
  });

  it("stops the animation on unmount so a dismissed dialog leaves nothing running", () => {
    const stop = jest.fn();
    timingSpy.mockReturnValue({ start: jest.fn(), stop });

    const tree = render(<PreviewSweep durationMs={15000} />);
    const track = tree.UNSAFE_root.findAllByProps({ pointerEvents: "none" })[0];
    layout(track, 300);
    tree.unmount();

    expect(stop).toHaveBeenCalled();
  });
});
