/* eslint-env jest */
import { renderHook } from "@testing-library/react-native";
import { STRINGS } from "@common";
import usePothiTitle from "./usePothiTitle";

let mockState;
jest.mock("react-redux", () => ({ useSelector: (fn) => fn(mockState) }));
jest.mock("@common/constant", () => ({ BALOO_PAAJI: "BalooPaaji2-Regular" }));
jest.mock("@common", () => ({
  convertToUnicode: (text) => `uni(${text})`,
  // Mutable, like the real LocalizedStrings: switching language rewrites these
  // values in place rather than handing back a new object.
  STRINGS: { POTHI_DEFAULT_MORNING: "Morning Nitnem", POTHI_DEFAULT_EVENING: "Evening Nitnem" },
}));

// Morning and Evening Nitnem are stored in English on every device — that is
// what keeps them findable, and why they cannot be renamed — and shown in the
// app's language. Stored and shown are deliberately different things.

const stateWith = (overrides = {}) => ({
  fontFace: "GurbaniAkharTrue",
  language: "pa",
  pothis: { defaultIds: { morning: "srv-morning", evening: "srv-evening" } },
  ...overrides,
});

const titleFor = () => renderHook(() => usePothiTitle()).result.current.titleFor;

beforeEach(() => {
  mockState = stateWith();
  STRINGS.POTHI_DEFAULT_MORNING = "ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ";
  STRINGS.POTHI_DEFAULT_EVENING = "ਸ਼ਾਮ ਦਾ ਨਿਤਨੇਮ";
});

describe("usePothiTitle", () => {
  it("shows Morning and Evening Nitnem in the app's language, not their stored English", () => {
    const title = titleFor();
    expect(title({ id: "srv-morning", name: "Morning Nitnem" })).toBe("ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ");
    expect(title({ id: "srv-evening", name: "Evening Nitnem" })).toBe("ਸ਼ਾਮ ਦਾ ਨਿਤਨੇਮ");
  });

  // Keyed on the id the pointer records, not the name, so a default whose
  // stored name was changed elsewhere still reads as its role.
  it("names a default by its role whatever name it carries", () => {
    expect(titleFor()({ id: "srv-morning", name: "Amritvela" })).toBe("ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ");
  });

  it("leaves an ordinary pothi's own name alone", () => {
    expect(titleFor()({ id: "mine", name: "Sukhmani" })).toBe("Sukhmani");
  });

  // Morning Nitnem that happens to share a NAME is not the default: an
  // ordinary pothi called "Morning Nitnem" keeps exactly that.
  it("does not treat a same-named ordinary pothi as the default", () => {
    expect(titleFor()({ id: "mine", name: "Morning Nitnem" })).toBe("Morning Nitnem");
  });

  it("shows the stored name when the device has not resolved the pair yet", () => {
    mockState = stateWith({ pothis: { defaultIds: { morning: null, evening: null } } });
    expect(titleFor()({ id: "srv-morning", name: "Morning Nitnem" })).toBe("Morning Nitnem");
  });

  it("follows a change of app language", () => {
    const { result, rerender } = renderHook(() => usePothiTitle());
    expect(result.current.titleFor({ id: "srv-morning" })).toBe("ਸਵੇਰ ਦਾ ਨਿਤਨੇਮ");

    STRINGS.POTHI_DEFAULT_MORNING = "प्रातः नितनेम";
    mockState = stateWith({ language: "hi" });
    rerender();

    expect(result.current.titleFor({ id: "srv-morning" })).toBe("प्रातः नितनेम");
  });

  it("still converts a bundled folder's ASCII name under the Unicode face", () => {
    mockState = stateWith({ fontFace: "BalooPaaji2-Regular" });
    expect(titleFor()({ id: "sg-1", name: "nwm", system: true })).toBe("uni(nwm)");
  });
});
