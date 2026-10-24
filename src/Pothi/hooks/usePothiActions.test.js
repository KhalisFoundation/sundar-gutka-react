/* eslint-env jest */
import { act, renderHook } from "@testing-library/react-native";
import usePothiActions from "./usePothiActions";

jest.mock("react-redux", () => ({ useDispatch: () => jest.fn() }));

jest.mock("@common", () => ({
  actions: { toggleAudio: (v) => ({ type: "TOGGLE_AUDIO", v }) },
  constant: { READER: "Reader", FOLDERSCREEN: "FolderScreen", SETTINGS: "Settings" },
  showToast: jest.fn(),
  STRINGS: {
    POTHI_CREATED: "Pothi created",
    POTHI_PIN_LIMIT: "Limit {count}",
    formatString: (s, vars) => s.replace("{count}", vars.count),
  },
  trackPothiEvent: jest.fn(),
}));

describe("usePothiActions.openCreate", () => {
  beforeEach(() => jest.clearAllMocks());

  // "+ New Pothi" used to send a signed-out user to Settings rather than open
  // the sheet. A pothi is local-first now, so there is nothing to sign in FOR
  // before making one — it is made on the device and claimed by the account on
  // the first sign-in (see usePothiSync).
  it("opens the create sheet with no session in the store", () => {
    const navigate = jest.fn();
    const { result } = renderHook(() => usePothiActions(navigate));

    act(() => result.current.openCreate());

    expect(navigate).not.toHaveBeenCalled();
    expect(result.current.creating).toBe(true);
  });

  it("closes again without navigating anywhere", () => {
    const navigate = jest.fn();
    const { result } = renderHook(() => usePothiActions(navigate));

    act(() => result.current.openCreate());
    act(() => result.current.closeCreate());

    expect(result.current.creating).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
  });
});
