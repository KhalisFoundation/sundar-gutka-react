import { setKidsExperience, setKidsReciter, setKidsScoringOptIn, toggleKidsMode } from "./actions";
import kidsMode from "./kidsModeReducer";

describe("kidsMode reducer", () => {
  const initial = kidsMode(undefined, { type: "@@INIT" });

  it("starts off, without consent to send audio", () => {
    expect(initial).toEqual({
      enabled: false,
      scoringOptIn: false,
      reciter: null,
      progress: {},
      experience: null,
    });
  });

  it("toggles Kids Mode", () => {
    expect(kidsMode(initial, toggleKidsMode(true)).enabled).toBe(true);
  });

  it("records the online pronunciation check opt-in", () => {
    expect(kidsMode(initial, setKidsScoringOptIn(true)).scoringOptIn).toBe(true);
  });

  it("sets the reciter", () => {
    expect(kidsMode(initial, setKidsReciter("bhai-example")).reciter).toBe("bhai-example");
  });

  it("stores the serialized experience", () => {
    expect(kidsMode(initial, setKidsExperience('{"v":1}')).experience).toBe('{"v":1}');
  });
});
