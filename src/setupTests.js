/* eslint-env jest */
// Jest setup file - runs before all tests
// This centralizes common mocks so you don't have to repeat them in every test file

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

// Mock useThemedStyles to return a stable style object
jest.mock("@common/hooks/useThemedStyles", () => {
  const { createUseThemedStylesMock } = require("@common/test-utils/mocks/useThemedStyles");
  return createUseThemedStylesMock();
});

// Mock icons to simple components
jest.mock("@common/icons", () => {
  const { createIconsMock } = require("@common/test-utils/mocks/icons");
  return createIconsMock();
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
