/* eslint-env jest */
// Jest setup file - runs before all tests
// This centralizes common mocks so you don't have to repeat them in every test file

// gesture-handler's own setup, which the library requires under jest: its
// entry point reaches for a TurboModule at import time, so any test that
// merely pulls in a component using it fails to run without this.
require("react-native-gesture-handler/jestSetup");

// anvaad-js (Gurmukhi ASCII -> Unicode, used by convertToUnicode) ships a UMD
// bundle that assigns to `self`. Node has no such global, so merely importing
// it throws "self is not defined" and takes the whole suite with it. Pointing
// `self` at the global object loads the REAL library rather than mocking it, so
// a conversion under test is the conversion that ships.
if (typeof global.self === "undefined") global.self = global;

// react-native-localization asks a native module for the device locale, so
// `new LocalizedStrings(...)` throws under jest and any file importing
// common/localization fails to load at all. This is the same class over the
// same translations, defaulting to en-US — the strings a test sees are the
// strings the app ships, rather than a mock of them.
jest.mock("react-native-localization", () => {
  class LocalizedStrings {
    constructor(translations) {
      this.translations = translations;
      this.setLanguage("en-US");
    }

    setLanguage(language) {
      this.language = this.translations[language] ? language : "en-US";
      Object.assign(this, this.translations[this.language]);
    }

    getLanguage() {
      return this.language;
    }

    getString(key, language) {
      const table = this.translations[language] || this.translations[this.language] || {};
      return table[key];
    }

    getAvailableLanguages() {
      return Object.keys(this.translations);
    }
  }

  return LocalizedStrings;
});

// Mock react-redux hooks (factory functions are called inside jest.mock)
jest.mock("react-redux", () => {
  const { createReactReduxMock } = require("@common/test-utils/mocks/react-redux");
  return createReactReduxMock().mock;
});

// Mock theme/context - useTheme is the default export
jest.mock("@common/context", () => {
  const { createContextMock } = require("@common/test-utils/mocks/context");
  return createContextMock();
});

// The SAME theme, reached through the OTHER door.
//
// "@common/context" is the default-export useTheme. The shared UI primitives
// reach the theme through useTokens, which imports the NAMED useTheme from
// "context/ThemeContext" directly. Mocking only the first left the second
// unmocked, so any test rendering a screen built on ScreenHeader threw
// "useTheme must be used within a ThemeProvider" — which is exactly what
// happened the moment the Seva screens moved onto the shared header.
jest.mock("@common/context/ThemeContext", () => {
  // Delegates to the SAME factory that mocks "@common/context", so both doors
  // hand back one theme. Requiring a whole theme module here instead would drag
  // in "@theme/type" -> "@common", which some suites mock, and the constants it
  // reads for font names come back undefined.
  const { createContextMock } = require("@common/test-utils/mocks/context");
  const useTheme = createContextMock().default;
  return {
    __esModule: true,
    useTheme,
    default: { Provider: ({ children }) => children },
  };
});

// Mock useThemedStyles to return a stable style object
jest.mock("@common/hooks/useThemedStyles", () => {
  const { createUseThemedStylesMock } = require("@common/test-utils/mocks/useThemedStyles");
  return createUseThemedStylesMock();
});

// The reading-theme-scoped counterparts of the two hooks above, used by the
// audio player and by the bottom navigation while the Reader is open.
//
// Delegates to the SAME two factories, so a suite that stubs its style module
// gets the same canned styles it always did, and the theme it sees is the same
// real semantic colour layer. The reading-theme RECORDS are not mocked — those
// are plain data with no native dependency, and readerTheme.test.js asserts
// against the real ones.
jest.mock("@theme/reader/useReaderScopedTheme", () => {
  const { createUseThemedStylesMock } = require("@common/test-utils/mocks/useThemedStyles");
  const useThemedStyles = createUseThemedStylesMock().default;
  // Resolved through "@common/context" at CALL time, not captured here, so a
  // suite that installs its own lighter @common/context mock still governs what
  // the audio player and the bottom navigation see — several do, and a mock
  // that reached past them would drag @theme/type -> @common back in.
  const useReaderScopedTheme = () => require("@common/context").default();
  return {
    __esModule: true,
    useReaderScopedTheme,
    useReaderScopedStyles: (create) => useThemedStyles(create)(),
    default: useReaderScopedTheme,
  };
});

// Mock icons to simple components
jest.mock("@common/icons", () => {
  const { createIconsMock } = require("@common/test-utils/mocks/icons");
  return createIconsMock();
});

// Mock @rneui/themed (ships ESM that Jest doesn't transform) — only the Icon
// component is used in app code; render it as a no-op leaf in tests.
jest.mock("@rneui/themed", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    __esModule: true,
    // eslint-disable-next-line react/prop-types -- a test stand-in, not a component
    Icon: ({ name, ...rest }) =>
      React.createElement(RN.View, { accessibilityLabel: name, ...rest }),
  };
});

// Mock @common exports
jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock();
});

// Mock react-native-fs to avoid TypeScript parsing issues
jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/test/documents",
  exists: jest.fn(() => Promise.resolve(false)),
  readFile: jest.fn(() => Promise.resolve("")),
  writeFile: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  mkdir: jest.fn(() => Promise.resolve()),
  downloadFile: jest.fn(() => Promise.resolve({ statusCode: 200 })),
  moveFile: jest.fn(() => Promise.resolve()),
  copyFile: jest.fn(() => Promise.resolve()),
  readDir: jest.fn(() => Promise.resolve([])),
  stat: jest.fn(() => Promise.resolve({ isFile: () => true, size: 0 })),
}));

// Mock react-native-track-player to avoid ESM/native module parsing in Jest
jest.mock("react-native-track-player", () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(() => Promise.resolve()),
    setRepeatMode: jest.fn(() => Promise.resolve()),
    updateOptions: jest.fn(() => Promise.resolve()),
    add: jest.fn(() => Promise.resolve()),
    play: jest.fn(() => Promise.resolve()),
    pause: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    reset: jest.fn(() => Promise.resolve()),
    seekTo: jest.fn(() => Promise.resolve()),
    getState: jest.fn(() => Promise.resolve("paused")),
    getActiveTrack: jest.fn(() => Promise.resolve(null)),
    getPlaybackState: jest.fn(() => Promise.resolve({ state: "paused" })),
    getProgress: jest.fn(() => Promise.resolve({ position: 0, duration: 0, buffered: 0 })),
    getPosition: jest.fn(() => Promise.resolve(0)),
    getDuration: jest.fn(() => Promise.resolve(0)),
  },
  Capability: {
    Play: "Play",
    Pause: "Pause",
    SkipToNext: "SkipToNext",
    SkipToPrevious: "SkipToPrevious",
    Stop: "Stop",
    SeekTo: "SeekTo",
  },
  RepeatMode: {
    Off: "Off",
  },
  AppKilledPlaybackBehavior: {
    StopPlaybackAndRemoveNotification: "StopPlaybackAndRemoveNotification",
  },
  Event: {
    RemoteDuck: "remote-duck",
    PlaybackTrackChanged: "playback-track-changed",
    PlaybackQueueEnded: "playback-queue-ended",
    RemotePlay: "remote-play",
    RemotePause: "remote-pause",
    RemoteNext: "remote-next",
    RemotePrevious: "remote-previous",
    RemoteStop: "remote-stop",
    RemoteSeek: "remote-seek",
  },
  State: {
    Playing: "playing",
    Paused: "paused",
    Buffering: "buffering",
  },
  useProgress: jest.fn(() => ({ position: 0, duration: 0, buffered: 0 })),
  usePlaybackState: jest.fn(() => ({ state: undefined })),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock react-native-safe-area-context
// Mock @react-native-firebase/crashlytics (ships ESM Jest doesn't transform).
//
// Centralised because `logError` is imported all over the app, so any module
// that reaches it TRANSITIVELY — e.g. a service importing sso/tokenStore —
// otherwise fails to parse with "Cannot use import statement outside a module",
// pointing at firebase rather than at the module actually under test. Suites
// that assert on crashlytics calls (firebase/crashlytics.test.js) declare their
// own jest.mock, which takes precedence over this one.
jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({})),
  setCrashlyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
  crash: jest.fn(),
  setAttribute: jest.fn(),
  log: jest.fn(),
  recordError: jest.fn(),
}));

jest.mock("react-native-safe-area-context", () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaConsumer: jest.fn(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn(() => inset),
    useSafeAreaFrame: jest.fn(() => ({ x: 0, y: 0, width: 390, height: 844 })),
  };
});
