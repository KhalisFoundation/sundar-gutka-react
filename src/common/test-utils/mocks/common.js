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
    StatusBarComponent: ({ children, ...rest }) => React.createElement(RN.View, rest, children),
    trackSevaEvent: jest.fn(),
    openInAppBrowser: jest.fn(() => Promise.resolve()),
    useBackHandler: jest.fn(),
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
