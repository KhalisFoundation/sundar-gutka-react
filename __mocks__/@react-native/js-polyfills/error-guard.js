// Mock for @react-native/js-polyfills/error-guard
// This avoids parsing Flow type syntax in Jest

module.exports = {
  setGlobalErrorHandler: jest.fn(),
  getGlobalErrorHandler: jest.fn(() => null),
};
