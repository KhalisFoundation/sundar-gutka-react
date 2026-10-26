/* eslint-env jest */
import React from "react";
import { Animated } from "react-native";

import { render } from "@testing-library/react-native";

import RefreshSpinner from "./RefreshSpinner";

describe("RefreshSpinner", () => {
  let loopSpy;
  let timingSpy;

  beforeEach(() => {
    timingSpy = jest.spyOn(Animated, "timing");
    loopSpy = jest.spyOn(Animated, "loop");
  });

  afterEach(() => {
    timingSpy.mockRestore();
    loopSpy.mockRestore();
  });

  it("does not animate when idle", () => {
    render(<RefreshSpinner color="#000" spinning={false} />);
    expect(loopSpy).not.toHaveBeenCalled();
  });

  it("loops a rotation on the native driver while spinning", () => {
    // Rotation is a transform, so it is native-driver eligible and behaves
    // identically on iOS and Android. This is deliberately NOT an
    // ActivityIndicator: that maps to a native widget which stays hidden on
    // Android when first mounted with animating={false}.
    render(<RefreshSpinner color="#000" spinning />);

    expect(loopSpy).toHaveBeenCalled();
    const [, config] = timingSpy.mock.calls[timingSpy.mock.calls.length - 1];
    expect(config.useNativeDriver).toBe(true);
    expect(config.toValue).toBe(1);
  });

  it("stops the loop on unmount so nothing keeps running", () => {
    const stop = jest.fn();
    loopSpy.mockReturnValue({ start: jest.fn(), stop });

    const tree = render(<RefreshSpinner color="#000" spinning />);
    tree.unmount();

    expect(stop).toHaveBeenCalled();
  });

  it("stops the loop when spinning goes false", () => {
    const stop = jest.fn();
    loopSpy.mockReturnValue({ start: jest.fn(), stop });

    const tree = render(<RefreshSpinner color="#000" spinning />);
    tree.update(<RefreshSpinner color="#000" spinning={false} />);

    expect(stop).toHaveBeenCalled();
  });
});
