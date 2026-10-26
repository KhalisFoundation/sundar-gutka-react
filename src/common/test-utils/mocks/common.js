// Mock factory for @common exports
// Usage in test file:
// import { createCommonMock } from '@common/test-utils/mocks/common';
// jest.mock("@common", () => createCommonMock());

export const createCommonMock = (overrides = {}) => {
  const React = require("react");
  const RN = require("react-native");
  const toggleAutoScrollAction = (val) => ({ type: "TOGGLE_AUTO_SCROLL", payload: val });
  const toggleAudioAction = (val) => ({ type: "TOGGLE_AUDIO", payload: val });
  const CustomText = ({ children, ...rest }) => {
    const { Text } = RN;
    return React.createElement(Text, rest, children);
  };
  const SafeArea = ({ children, ...rest }) => {
    const { View } = RN;
    return React.createElement(View, rest, children);
  };
  return {
    CustomText,
    SafeArea,
    showErrorToast: jest.fn(),
    showInfoToast: jest.fn(),
    showSuccessToast: jest.fn(),
    showConfirm: jest.fn(),
    navigate: jest.fn(),
    StatusBarComponent: ({ children, ...rest }) => React.createElement(RN.View, rest, children),
    trackSevaEvent: jest.fn(),
    trackDashboardEvent: jest.fn(),
    trackThemeEvent: jest.fn(),
    trackSsoEvent: jest.fn(),
    openInAppBrowser: jest.fn(() => Promise.resolve()),
    useBackHandler: jest.fn(),
    useCustomScrollbar: () => ({ scrollViewProps: {}, Indicator: null, ownedScrollProps: {} }),
    trackTourEvent: jest.fn(),
    logError: jest.fn(),
    logMessage: jest.fn(),
    logNetworkError: jest.fn(),
    // Online by default, matching DEFAULT_NETWORK_STATE: a consumer outside a
    // NetworkProvider must never falsely degrade.
    useNetwork: () => ({
      isConnected: true,
      isInternetReachable: true,
      type: "wifi",
      isWifi: true,
      isCellular: false,
      isExpensive: false,
      isOffline: false,
      isOnline: true,
    }),
    OnboardingCarousel: () => null,
    actions: {
      toggleAutoScroll: jest.fn(toggleAutoScrollAction),
      toggleAudio: jest.fn(toggleAudioAction),
      ...overrides.actions,
    },
    constant: {
      READER: "Reader",
      SETTINGS: "Settings",
      defaultBani: { id: "default" },
      SHORT: "SHORT",
      MEDIUM: "MEDIUM",
      LONG: "LONG",
      EXTRA_LONG: "EXTRA_LONG",
      ICON_SIZE_SMALL: 16,
      // Real values, because sectionRegistry.js reads
      // `constant.DASHBOARD_SECTIONS` at MODULE scope — so an absent key here
      // is not a missing field, it is a TypeError while the module body runs,
      // and every consumer of that registry fails to load. Keep in step with
      // constant.js.
      DASHBOARD_SECTIONS: {
        STREAK: "streak",
        NITNEM: "nitnem",
        EXPLORE: "explore",
        PRACTICE: "practice",
        CALENDAR: "calendar",
        WEEK_CHART: "weekChart",
        DISCOVER: "discover",
        REMINDERS: "reminders",
        SHABAD_VAAK: "shabadVaak",
      },
      DASHBOARD_MIN_VISIBLE: 4,
      ...overrides.constant,
    },
    STRINGS: {
      HOME: "Home",
      READ: "Read",
      MUSIC: "Audio",
      SETTINGS: "Settings",
      ALL_BANIS: "All Banis",
      DASHBOARD: "Dashboard",
      SEVA: "Seva",
      short: "Short",
      medium: "Medium",
      long: "Long",
      extra_long: "Extra Long",
      WE_DO_NOT_HAVE_AUDIOS_FOR: "We do not have audios for",
      WE_DO_NOT_HAVE_AUDIOS_FOR_THIS_LENGTH: "We do not have audios for this length of",
      ...overrides.STRINGS,
    },
    ...overrides,
  };
};
