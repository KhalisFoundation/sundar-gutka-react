/* eslint-env jest */
import { NativeModules, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { renderHook } from "@testing-library/react-native";
import {
  FOLDABLE_IOS_MODELS,
  foldableTopSpace,
  insetTopHookFor,
  readIsFoldable,
  useFoldableInsetTop,
} from "./deviceForm";

// Only a phone that folds may take the foldable layout. Everything else —
// every other iPhone, an Android phone without a hinge sensor, a build without
// the module — must read as not foldable, because that is what keeps it on its
// old layout.

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  delete NativeModules.DeviceForm;
  delete NativeModules.RNDeviceInfo;
});

describe("readIsFoldable on Android", () => {
  beforeEach(() => {
    Platform.OS = "android";
  });

  it("is true when the native module reports a hinge", () => {
    NativeModules.DeviceForm = { isFoldable: true };
    expect(readIsFoldable()).toBe(true);
  });

  it("is false when the native module reports no hinge", () => {
    NativeModules.DeviceForm = { isFoldable: false };
    expect(readIsFoldable()).toBe(false);
  });

  it("is false when the module is missing from the build", () => {
    expect(readIsFoldable()).toBe(false);
  });

  it("is false for anything that is not literally true", () => {
    NativeModules.DeviceForm = { isFoldable: "true" };
    expect(readIsFoldable()).toBe(false);
  });

  it("ignores an iPhone model identifier", () => {
    NativeModules.RNDeviceInfo = { deviceId: FOLDABLE_IOS_MODELS[0] };
    expect(readIsFoldable()).toBe(false);
  });
});

describe("readIsFoldable on iOS", () => {
  beforeEach(() => {
    Platform.OS = "ios";
  });

  it("recognises iPhone Duo", () => {
    NativeModules.RNDeviceInfo = { deviceId: "iPhone19,4" };
    expect(readIsFoldable()).toBe(true);
  });

  it("is false for every other iPhone and iPad", () => {
    ["iPhone19,1", "iPhone19,2", "iPhone19,3", "iPhone18,1", "iPhone14,7", "iPad16,3"].forEach(
      (deviceId) => {
        NativeModules.RNDeviceInfo = { deviceId };
        expect(readIsFoldable()).toBe(false);
      }
    );
  });

  it("is false when the model cannot be read", () => {
    expect(readIsFoldable()).toBe(false);
  });

  it("ignores the Android module", () => {
    NativeModules.DeviceForm = { isFoldable: true };
    expect(readIsFoldable()).toBe(false);
  });
});

describe("insetTopHookFor", () => {
  beforeEach(() => {
    useSafeAreaInsets.mockClear();
    useSafeAreaInsets.mockReturnValue({ top: 31, right: 0, bottom: 0, left: 0 });
  });

  it("is null, without reading the insets, on a phone that does not fold", () => {
    const hook = insetTopHookFor(false);
    expect(renderHook(() => hook()).result.current).toBeNull();
    expect(useSafeAreaInsets).not.toHaveBeenCalled();
  });

  it("is the top inset on a foldable", () => {
    const hook = insetTopHookFor(true);
    expect(renderHook(() => hook()).result.current).toBe(31);
  });
});

describe("useFoldableInsetTop", () => {
  it("is null in the test environment, which does not fold", () => {
    expect(renderHook(() => useFoldableInsetTop()).result.current).toBeNull();
  });
});

describe("foldableTopSpace", () => {
  it("shrinks the fixed space to a shallower inset", () => {
    expect(foldableTopSpace(30, 48)).toBe(30);
    expect(foldableTopSpace(0, 48)).toBe(0);
  });

  it("never grows past the fixed space", () => {
    // The Pixel 10 Pro Fold's 56dp cutout against the 48dp header clearance.
    expect(foldableTopSpace(56, 48)).toBe(48);
    expect(foldableTopSpace(48, 48)).toBe(48);
  });

  it("treats a missing or bad inset as zero", () => {
    [undefined, null, NaN, -10].forEach((inset) => {
      expect(foldableTopSpace(inset, 48)).toBe(0);
    });
  });
});
