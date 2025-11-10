// Mock factory for @common exports
// Usage in test file:
// import { createCommonMock } from '@common/test-utils/mocks/common';
// jest.mock("@common", () => createCommonMock());

export const createCommonMock = (overrides = {}) => {
  const React = require("react");
  const RN = require("react-native");
  const toggleAutoScrollAction = (val) => ({ type: "TOGGLE_AUTO_SCROLL", payload: val });
  const toggleAudioAction = (val) => ({ type: "TOGGLE_AUDIO", payload: val });
  const CustomText = (props) => {
    const Text = RN.Text;
    return React.createElement(Text, props, props.children);
  };
  return {
    CustomText,
    actions: {
      toggleAutoScroll: jest.fn(toggleAutoScrollAction),
      toggleAudio: jest.fn(toggleAudioAction),
      ...overrides.actions,
    },
    constant: {
      READER: "Reader",
      SETTINGS: "Settings",
      defaultBani: { id: "default" },
      ...overrides.constant,
    },
    STRINGS: {
      HOME: "Home",
      READ: "Read",
      MUSIC: "Music",
      SETTINGS: "Settings",
      ...overrides.STRINGS,
    },
    ...overrides,
  };
};
