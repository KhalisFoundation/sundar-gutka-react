import { renderHook } from "@testing-library/react-native";
import constant from "../constant";
import useTextScale, { combinedScale, MAX_COMBINED_SCALE, scaleForFontSize } from "./useTextScale";

describe("useTextScale math", () => {
  describe("scaleForFontSize", () => {
    it("maps EXTRA_SMALL to 0.85", () => {
      expect(scaleForFontSize(constant.EXTRA_SMALL)).toBe(0.85);
    });

    it("maps SMALL to 1.0 (today's size)", () => {
      expect(scaleForFontSize(constant.SMALL)).toBe(1.0);
    });

    it("maps MEDIUM to 1.15", () => {
      expect(scaleForFontSize(constant.MEDIUM)).toBe(1.15);
    });

    it("maps LARGE to 1.3", () => {
      expect(scaleForFontSize(constant.LARGE)).toBe(1.3);
    });

    it("maps EXTRA_LARGE to 1.5", () => {
      expect(scaleForFontSize(constant.EXTRA_LARGE)).toBe(1.5);
    });

    it("falls back to 1.0 for undefined, null, or unknown values", () => {
      expect(scaleForFontSize(undefined)).toBe(1.0);
      expect(scaleForFontSize(null)).toBe(1.0);
      expect(scaleForFontSize("UNKNOWN")).toBe(1.0);
    });
  });

  describe("combinedScale", () => {
    it("matches app multipliers at system font scale 1.0", () => {
      expect(combinedScale(constant.EXTRA_SMALL, 1.0)).toBe(0.85);
      expect(combinedScale(constant.SMALL, 1.0)).toBe(1.0);
      expect(combinedScale(constant.MEDIUM, 1.0)).toBe(1.15);
      expect(combinedScale(constant.LARGE, 1.0)).toBe(1.3);
      expect(combinedScale(constant.EXTRA_LARGE, 1.0)).toBe(1.5);
    });

    it("scales proportionally with the phone's font scale", () => {
      expect(combinedScale(constant.SMALL, 1.2)).toBeCloseTo(1.2);
      expect(combinedScale(constant.LARGE, 1.2)).toBeCloseTo(1.3 * 1.2);
      expect(combinedScale(constant.MEDIUM, 1.1)).toBeCloseTo(1.15 * 1.1);
    });

    it("caps at 2.0x when app multiplier and phone scale exceed 2.0", () => {
      expect(combinedScale(constant.EXTRA_LARGE, 1.5)).toBe(MAX_COMBINED_SCALE);
      expect(combinedScale(constant.EXTRA_LARGE, 2.0)).toBe(MAX_COMBINED_SCALE);
      expect(combinedScale(constant.LARGE, 1.8)).toBe(MAX_COMBINED_SCALE);
      expect(combinedScale(constant.SMALL, 2.5)).toBe(MAX_COMBINED_SCALE);
    });

    it("treats missing or falsy fontScale as 1.0", () => {
      expect(combinedScale(constant.SMALL, 0)).toBe(1.0);
      expect(combinedScale(constant.SMALL, undefined)).toBe(1.0);
      expect(combinedScale(constant.LARGE, null)).toBe(1.3);
    });
  });

  describe("useTextScale hook", () => {
    it("returns 1.0 outside a Redux Provider without throwing", () => {
      const { result } = renderHook(() => useTextScale());
      expect(result.current).toBe(1.0);
    });
  });
});
