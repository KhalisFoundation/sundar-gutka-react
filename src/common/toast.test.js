/* eslint-env jest */
import {
  showToast,
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  setToastBottomReservation,
} from "./toast";

const mockShow = jest.fn();

// Referenced lazily inside the arrow, so the factory can run before mockShow
// is assigned without capturing undefined.
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: (...args) => mockShow(...args) },
}));

const BASE = 40;
const GAP = 12;

describe("toast bottom offset", () => {
  beforeEach(() => {
    mockShow.mockClear();
    setToastBottomReservation(0);
  });

  const shownOffset = () => mockShow.mock.calls[0][0].bottomOffset;

  it("rests at the base offset when nothing is reserved", () => {
    showSuccessToast("Download complete");
    expect(shownOffset()).toBe(BASE);
  });

  it("lifts clear of the collapsed player", () => {
    // The pill occupies 54dp (44 tall, 10 from the bottom).
    setToastBottomReservation(54);
    showSuccessToast("Download complete");
    expect(shownOffset()).toBe(BASE + 54 + GAP);
  });

  it("lifts clear of the taller expanded bar", () => {
    setToastBottomReservation(180);
    showSuccessToast("Download complete");
    expect(shownOffset()).toBe(BASE + 180 + GAP);
  });

  it("returns to the base offset once the player releases the space", () => {
    setToastBottomReservation(54);
    setToastBottomReservation(0);
    showSuccessToast("Download complete");
    expect(shownOffset()).toBe(BASE);
  });

  it.each([
    ["error", showErrorToast],
    ["info", showInfoToast],
    ["plain", showToast],
  ])("applies the same offset to the %s toast", (_label, show) => {
    setToastBottomReservation(54);
    show("message");
    expect(shownOffset()).toBe(BASE + 54 + GAP);
  });

  it.each([
    ["a negative height", -20],
    ["a non-numeric height", "tall"],
    ["undefined", undefined],
  ])("ignores %s rather than shifting the toast off screen", (_label, value) => {
    setToastBottomReservation(value);
    showSuccessToast("Download complete");
    expect(shownOffset()).toBe(BASE);
  });
});
