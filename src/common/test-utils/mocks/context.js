// Mock factory for @common/context
// Usage in test file:
// import { createContextMock } from '@common/test-utils/mocks/context';
// jest.mock("@common/context", () => createContextMock());

export const createContextMock = (themeOverrides = {}) => ({
  __esModule: true,
  default: () => ({
    theme: {
      colors: { primary: "#00A", ...themeOverrides.colors },
      staticColors: { WHITE_COLOR: "#FFF", ...themeOverrides.staticColors },
    },
  }),
});
