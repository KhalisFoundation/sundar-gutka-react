module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)",
  ],
  moduleNameMapper: {
    "^@react-native/js-polyfills/error-guard$":
      "<rootDir>/__mocks__/@react-native/js-polyfills/error-guard.js",
    "^@common/(.*)$": "<rootDir>/src/common/$1",
    "^@database/(.*)$": "<rootDir>/src/database/db/$1",
    "^@service/(.*)$": "<rootDir>/src/services/$1",
    "^@settings/(.*)$": "<rootDir>/src/Settings/$1",
    "^@theme/(.*)$": "<rootDir>/src/theme/$1",
  },
};
