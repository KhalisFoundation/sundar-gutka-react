/* eslint-env jest */
import { renderHook } from "@testing-library/react-native";
import constant from "../constant";
import useOnboardingTrigger from "./useOnboardingTrigger";

const mockDispatch = jest.fn();
let mockSeenVersion = 0;

jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn({ seenOnboardingVersion: mockSeenVersion }),
}));

jest.mock("../actions", () => ({
  setOnboardingVisible: (visible) => ({ type: "SET_ONBOARDING_VISIBLE", visible }),
}));

jest.mock("../constant", () => ({
  __esModule: true,
  default: { ONBOARDING_VERSION: 1, ONBOARDING_ENABLED: false },
}));

describe("useOnboardingTrigger", () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockSeenVersion = 0;
  });

  it("never opens the carousel while onboarding is switched off", () => {
    constant.ONBOARDING_ENABLED = false;
    renderHook(() => useOnboardingTrigger());
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("still opens for an unseen version once switched back on", () => {
    // Guards the revert path: the flag is the only thing standing in the way.
    constant.ONBOARDING_ENABLED = true;
    renderHook(() => useOnboardingTrigger());
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_ONBOARDING_VISIBLE",
      visible: true,
    });
  });

  it("does not reopen for a user who already saw the current version", () => {
    constant.ONBOARDING_ENABLED = true;
    mockSeenVersion = 1;
    renderHook(() => useOnboardingTrigger());
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
