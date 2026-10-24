/* eslint-env jest */
import React from "react";

import { render } from "@testing-library/react-native";

import ReminderRow from "./ReminderRow";

let mockIsTransliteration = false;
jest.mock("react-redux", () => ({
  useSelector: (fn) => fn({ isTransliteration: mockIsTransliteration }),
}));
jest.mock("@common/hooks/useTokens", () => () => ({
  c: { textPrimary: "#fff", textSecondary: "#ccc", textDisabled: "#888", surfaceSelected: "#333" },
  space: { xxs: 2, md: 12 },
  layout: { screenGutter: 16, row: { minHeightTwoLine: 64 } },
  type: { display: {}, bodySmall: {} },
}));
jest.mock("@common/localization", () => ({
  __esModule: true,
  default: {
    time_for: "Time for",
    getString: (key, lang) =>
      ({
        "en-US": "Time for",
        hi: "समां है",
        pa: "ਸਮਾਂ ਹੈ",
        fr: "Il est temps de",
        it: "È l'ora di",
        es: "Es ora de",
      }[lang]),
  },
}));
jest.mock("@common/actions", () => ({ setReminderBanis: jest.fn() }));
jest.mock("@common", () => {
  const { Text, Switch } = require("react-native");
  return {
    constant: { GURBANI_AKHAR_TRUE: "GurbaniAkharTrue", BALOO_PAAJI: "BalooPaaji2-Regular" },
    STRINGS: { time_for: "Time for", getString: () => "Time for" },
    scheduleReminders: jest.fn(),
    trackReminderEvent: jest.fn(),
    CustomText: ({ children, style }) => <Text style={style}>{children}</Text>,
    ThemedSwitch: ({ value, onValueChange }) => (
      <Switch value={value} onValueChange={onValueChange} />
    ),
  };
});

const base = { enabled: true, translit: "japji", gurmukhi: "jpujI swihb", time: "3:30 AM" };

describe("the reminder row's second line", () => {
  beforeEach(() => {
    mockIsTransliteration = false;
  });

  it("is the bani's name while the title is untouched", () => {
    const { getByText, queryByText } = render(
      <ReminderRow
        section={{ ...base, title: "Time for japji" }}
        onPress={jest.fn()}
        onToggle={jest.fn()}
      />
    );
    // Real Unicode Gurmukhi, not the legacy ASCII encoding the row used to
    // show: this name is also what the notification says, where no Gurbani
    // font exists to make "jpujI swihb" legible.
    expect(getByText("ਜਪੁਜੀ ਸਾਹਿਬ")).toBeTruthy();
    expect(queryByText("jpujI swihb")).toBeNull();
    expect(queryByText("Time for japji")).toBeNull();
  });

  it("is the user's own title once they have renamed the notification", () => {
    // A rename that only showed inside the edit sheet read as one that had not
    // saved. The row shows what the notification will actually say.
    const { getByText, queryByText } = render(
      <ReminderRow
        section={{ ...base, title: "idk", titleCustom: true }}
        onPress={jest.fn()}
        onToggle={jest.fn()}
      />
    );
    expect(getByText("idk")).toBeTruthy();
    expect(queryByText("jpujI swihb")).toBeNull();
  });

  it("shows a title renamed before the flag existed, going by the text alone", () => {
    const { getByText } = render(
      <ReminderRow section={{ ...base, title: "idk" }} onPress={jest.fn()} onToggle={jest.fn()} />
    );
    expect(getByText("idk")).toBeTruthy();
  });

  it("does not set a typed title in the Gurbani face", () => {
    const { getByText } = render(
      <ReminderRow
        section={{ ...base, title: "idk", titleCustom: true }}
        onPress={jest.fn()}
        onToggle={jest.fn()}
      />
    );
    const styles = [getByText("idk").props.style].flat(Infinity).filter(Boolean);
    expect(styles.some((s) => s.fontFamily === "GurbaniAkharTrue")).toBe(false);
  });

  it("draws the Gurmukhi name in a face that can render Unicode", () => {
    // GurbaniAkhar draws the LEGACY encoding; handed Unicode it mangles it.
    const { getByText } = render(
      <ReminderRow section={base} onPress={jest.fn()} onToggle={jest.fn()} />
    );
    const styles = [getByText("ਜਪੁਜੀ ਸਾਹਿਬ").props.style].flat(Infinity).filter(Boolean);
    expect(styles.some((s) => s.fontFamily === "BalooPaaji2-Regular")).toBe(true);
    expect(styles.some((s) => s.fontFamily === "GurbaniAkharTrue")).toBe(false);
  });
});
