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
