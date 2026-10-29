// Pin the suite's timezone. Currency now resolves from the device timezone
// (services/currency.js resolveDeviceCountry), so without this the donate-page
// tests take on whatever zone the machine runs in — the same test asserts $10
// in London and ₹100 in Delhi. UTC is unmapped in the timezone table, so it is
// a genuinely neutral "no signal" baseline. Individual tests that care about a
// region mock the timezone themselves (see services/currencyDevice.test.js).
process.env.TZ = "UTC";

module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native" +
      "|@react-native" +
      "|@react-navigation" +
      "|react-native-reanimated" +
      "|react-native-gesture-handler" +
      "|react-native-safe-area-context" +
      "|react-native-screens" +
      "|react-native-fs" +
      "|react-native-collapsible" +
      ")/)",
  ],
  moduleNameMapper: {
    "^@react-native/js-polyfills/error-guard$":
      "<rootDir>/__mocks__/@react-native/js-polyfills/error-guard.js",
    "^@common/(.*)$": "<rootDir>/src/common/$1",
    "^@database$": "<rootDir>/src/database/db",
    "^@service$": "<rootDir>/src/services/index.js",
    "^@settings/(.*)$": "<rootDir>/src/Settings/$1",
    "^@theme/(.*)$": "<rootDir>/src/theme/$1",
  },
};
