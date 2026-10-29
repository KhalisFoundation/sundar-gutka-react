/* eslint-disable react/jsx-props-no-spreading */
/* eslint-env jest */
import React from "react";
import { TextInput } from "react-native";

import { render, waitFor, fireEvent } from "@testing-library/react-native";

import { getSevaConfig, markSevaSeen } from "../services/sevaConfig";

import SevaScreen from ".";

// -------------------- MOCKS --------------------

let mockState;
jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selectorFn) => selectorFn(mockState),
}));

// Captures registered "focus" listeners so a tab re-visit can be simulated —
// SevaScreen stays mounted in the tab navigator, so re-focus (not re-mount) is
// what has to re-acknowledge the version. The navigation object is a STABLE
// singleton, matching real useNavigation(): returning a fresh object per render
// would make any effect keyed on it re-run every render.
const mockFocusListeners = [];
// One entry per live focus effect, holding its cleanup. Leaving the tab runs
// them; React Navigation runs a cleanup exactly once, so an entry is removed as
// it fires and the unmount path skips whatever a manual blur already ran.
const mockFocusCleanups = [];
const mockNavigation = {
  navigate: jest.fn(),
  addListener: (event, cb) => {
    if (event === "focus") mockFocusListeners.push(cb);
    return () => {
      const i = mockFocusListeners.indexOf(cb);
      if (i >= 0) mockFocusListeners.splice(i, 1);
    };
  },
};
jest.mock("@react-navigation/native", () => {
  const ReactModule = require("react");
  return {
    useNavigation: () => mockNavigation,
    // Runs the focus callback on mount (initial focus) and registers it so a
    // tab re-visit can be simulated by invoking the captured mockFocusListeners.
    useFocusEffect: (cb) => {
      ReactModule.useEffect(() => {
        const cleanup = cb();
        mockFocusListeners.push(cb);
        const entry = typeof cleanup === "function" ? { run: cleanup } : null;
        if (entry) mockFocusCleanups.push(entry);
        return () => {
          const i = mockFocusListeners.indexOf(cb);
          if (i >= 0) mockFocusListeners.splice(i, 1);
          const j = entry ? mockFocusCleanups.indexOf(entry) : -1;
          if (j >= 0) {
            mockFocusCleanups.splice(j, 1);
            entry.run();
          }
        };
      }, [cb]);
    },
  };
});

jest.mock("react-native-linear-gradient", () => {
  const { View } = require("react-native");
  return (props) => <View {...props} />;
});

jest.mock("react-native-svg", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: (props) => <View testID="svg-headline" {...props} />,
    Defs: (props) => <View {...props} />,
    LinearGradient: (props) => <View {...props} />,
    Stop: (props) => <View {...props} />,
    Text: (props) => <Text testID="svg-headline-text" {...props} />,
  };
});

const mockOpenInAppBrowser = jest.fn();
const mockShowInfoToast = jest.fn();
const mockTrackSevaEvent = jest.fn();
const mockLogError = jest.fn();
// Switchable so the headline can be asserted in BOTH themes (see the
// light/dark parity test below). Reset to "light" in beforeEach.
let mockThemeMode = "light";

jest.mock("@common", () => {
  const { View, Text } = require("react-native");
  const buildTheme = () => ({
    mode: mockThemeMode,
    // The real semantic layer, so the stylesheet resolves the same roles the
    // app does instead of a hand-rolled subset that drifts from it.
    c: require("@theme/semanticColors")[mockThemeMode === "dark" ? "dark" : "light"],
    // Likewise the real sizing tokens, so a size the screen reads (the close
    // cross) is the one the app actually renders.
    layout: require("@theme/layout").default,
    colors: { primary: "#123456", surface: "#FFFFFF", activeView: "#EEE" },
    staticColors: { WHITE_COLOR: "#FFFFFF", NIGHT_BLACK: "#041126" },
    typography: {
      fonts: { balooPaaji: "BalooPaaji2-Regular", balooPaajiSemiBold: "BalooPaaji2-SemiBold" },
      sizes: { xxl: 22 },
      weights: { normal: "400" },
    },
  });
  return {
    SafeArea: (props) => <View {...props} />,
    StatusBarComponent: () => null,
    GradientDivider: () => null,
    CustomText: (props) => <Text {...props} />,
    useTheme: () => ({ theme: buildTheme() }),
    useThemedStyles: (createStyles) => createStyles(buildTheme()),
    STRINGS: {
      SEVA: "Seva",
      CLOSE: "Close",
      SEVA_MONTHLY: "Monthly",
      SEVA_ANNUALLY: "Annually",
      SEVA_ONE_TIME: "One Time",
      SEVA_PER_YEAR: "year",
      SEVA_PER_MONTH: "month",
      SEVA_OTHER: "Other",
      donate: "Donate",
      SEVA_LOAD_ERROR: "Could not load Seva.",
      SEVA_DONATE_DIRECTLY: "Donate directly",
      SEVA_SUPPORT_HEADER: "Support Sundar Gutka",
      SEVA_OTHER_MEANS: "Seva by other means",
      SEVA_SPREAD_WORD: "Seva by spreading the word",
      SEVA_FOR_CODERS: "Seva for coders",
      SEVA_BY_TESTING: "Seva by testing our work",
      SEVA_OTHER_OPPORTUNITIES: "Seva by other opportunities",
      SEVA_MIN_AMOUNT: "Minimum acceptable donation is {amount}",
      formatString: (template, values) =>
        Object.entries(values).reduce(
          (out, [key, value]) => out.split(`{${key}}`).join(value),
          template
        ),
    },
    openInAppBrowser: (...args) => mockOpenInAppBrowser(...args),
    showInfoToast: (...args) => mockShowInfoToast(...args),
    // The themed scrollbar hook. These tests assert content, not the thumb.
    useCustomScrollbar: () => ({ scrollViewProps: {}, Indicator: null, ownedScrollProps: {} }),
    trackSevaEvent: (...args) => mockTrackSevaEvent(...args),
    logError: (...args) => mockLogError(...args),
  };
});

// Mock the components barrel directly so the real one (which pulls in
// BaniLengthSelector → firebase ESM) is never loaded in the test.
// The screen renders the SHARED header now, not a Seva-only AppBar. Stubbed for
// the same reason the AppBar was: these tests cover the server-driven body, and
// the real header would drag the whole token layer in behind it. `actions` is
// rendered so the close-cross assertions still exercise it.
jest.mock("@common/components/ui", () => {
  const { View, Text } = require("react-native");
  return {
    Spinner: () => <View testID="spinner" />,
    ScreenHeader: ({ title, actions }) => (
      <View>
        <Text>{title}</Text>
        {actions}
      </View>
    ),
  };
});

jest.mock("../common/icons", () => {
  const { Text } = require("react-native");
  const Stub = (props) => <Text {...props} />;
  return {
    DonateIcon: (props) => <Text testID="donate-icon" {...props} />,
    CloseIcon: (props) => <Text testID="close-icon" {...props} />,
    ChevronRight: Stub,
    SevaIcon: Stub,
    HandHeartIcon: Stub,
    MegaphoneIcon: Stub,
    CodeIcon: Stub,
    ClipboardCheckIcon: Stub,
    ExternalLinkIcon: (props) => <Text testID="external-link-icon" {...props} />,
    StarIcon: Stub,
  };
});

jest.mock("../services/sevaMeans", () => ({
  prewarmSevaMeans: jest.fn(() => Promise.resolve()),
  SEVA_MEANS_PAGE_KEYS: ["social", "coding", "qa", "other"],
}));

jest.mock("../services/sevaConfig", () => ({
  getSevaConfig: jest.fn(),
  buildQgivUrl: jest.fn(() => "https://secure.qgiv.com/for/khalisfoundation"),
  markSevaSeen: jest.fn(() => Promise.resolve()),
}));

// -------------------- HELPERS --------------------

const CONFIG_BASE = {
  configVersion: "1",
  country: "US",
  amounts: [10, 50, 100],
  selectedAmount: 10,
  payment_mode: "qgiv_prefill_open",
  showSevaDot: false,
  sevaDotCount: 0,
};

const contentBase = {
  headline: "ਸੁੰਦਰ ਗੁਟਕਾ",
  description: "Test description",
  descriptionLinks: [],
  taxMessage: "US tax message",
  nonUsTaxMessage: "Non-US tax message",
  footerText: "Know coding footer",
};

const nativeFallbackConfig = { ...CONFIG_BASE, content: { ...contentBase, segments: [] } };

// Leaving the Seva tab: React Navigation runs each focus effect's cleanup and
// leaves the screen mounted. Returning runs the effects again. The funnel emits
// on both edges, so both have to be simulable.
const blurScreen = () => {
  mockFocusCleanups.splice(0).forEach((entry) => entry.run());
};
const focusScreen = () => {
  mockFocusListeners.forEach((cb) => {
    const cleanup = cb();
    if (typeof cleanup === "function") mockFocusCleanups.push({ run: cleanup });
  });
};

const sevaEvents = (name) => mockTrackSevaEvent.mock.calls.filter(([event]) => event === name);

const serverDrivenConfig = (segments, overrides = {}) => ({
  ...CONFIG_BASE,
  ...overrides,
  content: { ...contentBase, segments },
});

describe("SevaScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = { language: "en" };
    mockThemeMode = "light";
    mockFocusListeners.length = 0;
    mockFocusCleanups.length = 0;
  });

  it("renders the donate widget + tax note as a safety net when segments are empty", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);

    const { getByTestId, getByText } = render(<SevaScreen />);

    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());
    expect(getByText("US tax message")).toBeTruthy();
  });

  it("renders the server-driven layout: hero, donate card, tax note, section header and means item", async () => {
    getSevaConfig.mockResolvedValue(
      serverDrivenConfig([
        {
          type: "html",
          value:
            '<h1 class="seva-hero-title">Support our mission.</h1>' +
            '<p class="seva-hero-desc">Built by volunteers.</p>',
        },
        { type: "card_open", name: "donate" },
        {
          type: "html",
          value:
            '<h2 class="seva-card-title">Seva with your support</h2>' +
            '<p class="seva-card-sub">Your support keeps this mission alive.</p>',
        },
        { type: "slot", name: "donate_widget" },
        { type: "slot", name: "tax_note" },
        { type: "card_close" },
        { type: "html", value: '<h2 class="seva-section">Other ways to do Seva</h2>' },
        {
          type: "html",
          value:
            '<p class="seva-means"><a href="seva-means:coding">Seva for coders</a>' +
            "Contribute to our open source projects</p>",
        },
      ])
    );

    const { getByTestId, getByText } = render(<SevaScreen />);

    await waitFor(() => expect(getByText("Support our mission.")).toBeTruthy());
    expect(getByText("Built by volunteers.")).toBeTruthy();
    // Donate card header (server-driven title + subtitle).
    expect(getByText("Seva with your support")).toBeTruthy();
    expect(getByText("Your support keeps this mission alive.")).toBeTruthy();
    // Native donate widget + country-conditional tax note.
    expect(getByTestId("donate-icon")).toBeTruthy();
    expect(getByText("US tax message")).toBeTruthy();
    // Section header + a means item (title + subtitle) from the server.
    expect(getByText("Other ways to do Seva")).toBeTruthy();
    expect(getByText("Seva for coders")).toBeTruthy();
    expect(getByText("Contribute to our open source projects")).toBeTruthy();
  });

  it("renders an inline link from server-driven content and opens it in the in-app browser", async () => {
    getSevaConfig.mockResolvedValue(
      serverDrivenConfig([
        {
          type: "html",
          value: '<p>Built by <a href="https://khalisfoundation.org/">Khalis Foundation</a>.</p>',
        },
      ])
    );

    const { getByText } = render(<SevaScreen />);

    await waitFor(() => {
      expect(getByText("Khalis Foundation")).toBeTruthy();
    });

    fireEvent.press(getByText("Khalis Foundation"));

    expect(mockOpenInAppBrowser).toHaveBeenCalledWith(
      "https://khalisfoundation.org/",
      expect.any(Object)
    );
  });

  it("shows the non-US tax message at the tax_note slot when the donor is outside the US", async () => {
    getSevaConfig.mockResolvedValue(
      serverDrivenConfig([{ type: "slot", name: "tax_note" }], { country: "CA" })
    );

    const { getByText } = render(<SevaScreen />);

    await waitFor(() => {
      expect(getByText("Non-US tax message")).toBeTruthy();
    });
  });

  it("acknowledges the current version on open (markSevaSeen) regardless of segments", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    render(<SevaScreen />);
    await waitFor(() => {
      expect(markSevaSeen).toHaveBeenCalledTimes(1);
    });
  });

  it("re-syncs the config and re-acknowledges the version when the tab is re-focused", async () => {
    // The screen stays mounted in the tab navigator, so its mount effect never
    // re-runs on a second visit. On every open it must re-sync the Seva config
    // from the server (network → cache → bundled) AND re-acknowledge the version
    // so a dot that appeared mid-session clears while the user views this page.
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    render(<SevaScreen />);

    await waitFor(() => expect(markSevaSeen).toHaveBeenCalledTimes(1));
    expect(getSevaConfig).toHaveBeenCalledTimes(1);
    expect(mockFocusListeners.length).toBeGreaterThan(0);

    // Simulate leaving and re-tapping the Seva tab (no re-mount): it re-syncs.
    getSevaConfig.mockClear();
    markSevaSeen.mockClear();
    mockFocusListeners.forEach((cb) => cb());

    await waitFor(() => {
      expect(getSevaConfig).toHaveBeenCalledTimes(1);
      expect(markSevaSeen).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the regular header with a 'Seva' title (no in-page SG heading)", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    const { getAllByText } = render(<SevaScreen />);
    await waitFor(() => expect(getAllByText("Seva").length).toBeGreaterThan(0));
  });

  it("has a cross button that navigates to Home / All Banis", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    const { getByLabelText } = render(<SevaScreen />);
    await waitFor(() => expect(getByLabelText("Close")).toBeTruthy());

    fireEvent.press(getByLabelText("Close"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("Home");
  });

  it("navigates to the SDUI page when a server-driven means item is tapped", async () => {
    getSevaConfig.mockResolvedValue(
      serverDrivenConfig([
        {
          type: "html",
          value:
            '<p class="seva-means"><a href="seva-means:coding">Seva for coders</a>' +
            "Contribute to our open source projects</p>",
        },
      ])
    );
    const { getByText, getByLabelText } = render(<SevaScreen />);

    await waitFor(() => expect(getByText("Seva for coders")).toBeTruthy());
    fireEvent.press(getByLabelText("seva-means-coding"));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("SevaMeans", { page: "coding" });
  });

  it("opens the browser instead of navigating when a means item carries ?open=", async () => {
    // The QA row links straight to the bug-report form rather than to a
    // sub-page holding a single link. The page key before the `?` must still
    // resolve (it drives the icon), but the tap must not navigate.
    const form = "https://docs.google.com/forms/d/e/ABC/viewform?usp=sharing&ouid=123";
    getSevaConfig.mockResolvedValue(
      serverDrivenConfig([
        {
          type: "html",
          value:
            `<p class="seva-means"><a href="seva-means:qa?open=${encodeURIComponent(form)}">` +
            "Seva by testing our work</a>Help us find bugs</p>",
        },
      ])
    );
    const { getByText, getByLabelText, queryByTestId } = render(<SevaScreen />);

    await waitFor(() => expect(getByText("Seva by testing our work")).toBeTruthy());

    // The row must LOOK like it leaves the app, not like it pushes a screen.
    expect(queryByTestId("external-link-icon")).toBeTruthy();

    fireEvent.press(getByLabelText("seva-means-qa"));

    // The `&` in the form URL must survive the round trip intact.
    expect(mockOpenInAppBrowser).toHaveBeenCalledWith(form, expect.any(Object));
    expect(mockNavigation.navigate).not.toHaveBeenCalledWith("SevaMeans", { page: "qa" });
  });

  it("shows the localised currency figure on the amount presets", async () => {
    // Device locale is unresolved in the jest environment → defaults to USD, so
    // presets read "$10 / $50 / $100" (symbol + figure), proving the currency
    // formatting path is wired without depending on a specific device region.
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    const { getByText } = render(<SevaScreen />);
    await waitFor(() => expect(getByText("$10")).toBeTruthy());
    expect(getByText("$50")).toBeTruthy();
    expect(getByText("$100")).toBeTruthy();
  });

  it("prefers the backend's countryCode over the (unresolved) device locale for currency", async () => {
    // Device locale is unresolved in this jest environment, so absent an
    // override it would default to USD (see the test above). Once the
    // backend supplies a countryCode ("IN"), that must win instead — proving
    // resolveCurrency(config?.countryCode) is actually wired through, not
    // just resolveCurrency() with the device falling back to USD by luck.
    getSevaConfig.mockResolvedValue({ ...nativeFallbackConfig, countryCode: "IN" });
    const { getByText } = render(<SevaScreen />);
    await waitFor(() => expect(getByText("₹1,000")).toBeTruthy());
    expect(getByText("₹5,000")).toBeTruthy();
  });

  it("reports the Qgiv hand-off once, with real values on every required param", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);

    const { getByLabelText, getByTestId } = render(<SevaScreen />);
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    fireEvent.press(getByLabelText("Donate"));

    const funnel = mockTrackSevaEvent.mock.calls.filter(([name]) =>
      ["payment_started", "payment_success"].includes(name)
    );
    expect(funnel.map(([name]) => name)).toEqual(["payment_started", "payment_success"]);
    // Firebase records a null or empty param as "(not set)", so each of these
    // has to arrive populated or the funnel cannot be segmented at all.
    funnel.forEach(([, params]) => {
      expect(params.provider).toBe("qgiv");
      expect(params.donation_type).toBe("recurring");
      expect(params.amount_bucket).toBe("10_24");
    });
  });

  it("books no second conversion when Donate is tapped again while the tab is open", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    // Never resolves — the in-app browser promise stays pending for as long as
    // the donor is on the Qgiv page, which is what holds the busy guard.
    mockOpenInAppBrowser.mockImplementationOnce(() => new Promise(() => {}));

    const { getByLabelText, getByTestId } = render(<SevaScreen />);
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    const donate = getByLabelText("Donate");
    fireEvent.press(donate);
    fireEvent.press(donate);

    expect(mockOpenInAppBrowser).toHaveBeenCalledTimes(1);
    const names = mockTrackSevaEvent.mock.calls.map(([name]) => name);
    expect(names.filter((name) => name === "payment_started")).toHaveLength(1);
    expect(names.filter((name) => name === "payment_success")).toHaveLength(1);
  });

  it("reports a visit every time the tab is opened, not only on the first mount", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    render(<SevaScreen />);
    await waitFor(() => expect(sevaEvents("opened")).toHaveLength(1));

    // Seva is a tab: leaving does not unmount it, so a mount-scoped event would
    // never fire again for the rest of the session.
    blurScreen();
    focusScreen();
    await waitFor(() => expect(sevaEvents("opened")).toHaveLength(2));

    // Only the very first open in the app's lifetime is the first open.
    expect(sevaEvents("opened")[1][1].is_first_open).toBe(false);
    expect(sevaEvents("opened")[1][1].donation_type).toBe("recurring");
  });

  it("reports abandonment when the user leaves the tab, not only on unmount", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    const { getByTestId } = render(<SevaScreen />);
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    expect(sevaEvents("checkout_abandoned")).toHaveLength(0);
    blurScreen();

    const abandoned = sevaEvents("checkout_abandoned");
    expect(abandoned).toHaveLength(1);
    expect(abandoned[0][1]).toEqual({
      last_step_reached: "landing_view",
      interacted: false,
      donation_type: "recurring",
    });
  });

  it("starts each visit clean rather than carrying the last one's donation and step", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    const { getByLabelText, getByTestId } = render(<SevaScreen />);
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    // Visit 1 hands off, so it is not an abandonment.
    fireEvent.press(getByLabelText("Donate"));
    blurScreen();
    expect(sevaEvents("checkout_abandoned")).toHaveLength(0);

    // Visit 2 does nothing. The donation flag from visit 1 must not suppress it,
    // and its furthest step must not still be payment_started.
    focusScreen();
    blurScreen();

    const abandoned = sevaEvents("checkout_abandoned");
    expect(abandoned).toHaveLength(1);
    expect(abandoned[0][1].last_step_reached).toBe("landing_view");
    expect(abandoned[0][1].interacted).toBe(false);
  });

  it("does not report a frequency change when the already-selected option is tapped", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    const { getByLabelText, getByTestId } = render(<SevaScreen />);
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    // "Monthly" is the default, and the control leaves it pressable.
    fireEvent.press(getByLabelText("Monthly"));
    expect(sevaEvents("frequency_changed")).toHaveLength(0);

    fireEvent.press(getByLabelText("One Time"));
    const changed = sevaEvents("frequency_changed");
    expect(changed).toHaveLength(1);
    expect(changed[0][1]).toEqual({ frequency: "One Time", donation_type: "one_time" });
  });

  it("disables Donate under the currency's minimum, with the reason live above it", async () => {
    // INR, so the floor is ₹100 — in USD the floor is $1 and the input strips
    // non-digits, which leaves no way to type below it.
    getSevaConfig.mockResolvedValue({ ...nativeFallbackConfig, countryCode: "IN" });
    const screen = render(<SevaScreen />);
    const { getByLabelText, getByTestId } = screen;
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    fireEvent.press(getByLabelText("Other"));
    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "50");

    // The button goes dead the same way it does for an empty box — the reason
    // is already on screen, so a live button that refused the tap just read
    // as broken.
    expect(getByLabelText("Donate").props.accessibilityState).toEqual({ disabled: true });
    expect(screen.getByText("Minimum acceptable donation is ₹100")).toBeTruthy();

    // Hitting the floor is recorded once, on the crossing, not per keystroke.
    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "5");
    const hit = sevaEvents("below_minimum");
    expect(hit).toHaveLength(1);
    expect(hit[0][1]).toEqual({
      currency: "INR",
      amount_bucket: "under_10",
      donation_type: "recurring",
    });

    // A tap on a disabled button reaches nothing.
    fireEvent.press(getByLabelText("Donate"));
    expect(sevaEvents("payment_started")).toHaveLength(0);
    expect(mockOpenInAppBrowser).not.toHaveBeenCalled();
  });

  it("shows the minimum inline while the amount is being typed, and clears it once met", async () => {
    // The keyboard is up for the whole of this typing, so the reason has to be
    // on the screen itself — and it has to be there before the donor taps
    // Donate, not only after a tap that looks like it did nothing.
    getSevaConfig.mockResolvedValue({ ...nativeFallbackConfig, countryCode: "IN" });
    const screen = render(<SevaScreen />);
    const { getByLabelText, getByTestId, queryByText } = screen;
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    fireEvent.press(getByLabelText("Other"));
    expect(queryByText("Minimum acceptable donation is ₹100")).toBeNull();

    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "50");
    expect(queryByText("Minimum acceptable donation is ₹100")).toBeTruthy();

    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "500");
    expect(queryByText("Minimum acceptable donation is ₹100")).toBeNull();
  });

  it("re-enables Donate and hands off once the amount reaches the minimum", async () => {
    getSevaConfig.mockResolvedValue({ ...nativeFallbackConfig, countryCode: "IN" });
    const screen = render(<SevaScreen />);
    const { getByLabelText, getByTestId } = screen;
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    fireEvent.press(getByLabelText("Other"));
    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "100");
    expect(getByLabelText("Donate").props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(getByLabelText("Donate"));

    expect(sevaEvents("below_minimum")).toHaveLength(0);
    expect(sevaEvents("payment_started")).toHaveLength(1);
    expect(sevaEvents("payment_success")).toHaveLength(1);
  });

  it("never lets the typed amount grow past fifteen digits", async () => {
    getSevaConfig.mockResolvedValue(nativeFallbackConfig);
    const screen = render(<SevaScreen />);
    const { getByLabelText, getByTestId } = screen;
    await waitFor(() => expect(getByTestId("donate-icon")).toBeTruthy());

    fireEvent.press(getByLabelText("Other"));
    fireEvent.changeText(screen.UNSAFE_getByType(TextInput), "1".repeat(40));
    // Past this the figure stopped being a number on screen and became "1e+39".
    expect(screen.UNSAFE_getByType(TextInput).props.value).toBe("1".repeat(15));
  });
});
