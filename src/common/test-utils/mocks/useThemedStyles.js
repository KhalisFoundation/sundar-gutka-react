// Mock factory for @common/hooks/useThemedStyles
// Usage in test file:
// import { createUseThemedStylesMock } from '@common/test-utils/mocks/useThemedStyles';
// jest.mock("@common/hooks/useThemedStyles", () => createUseThemedStylesMock());

export const createUseThemedStylesMock = (stylesOverrides = {}) => ({
  __esModule: true,
  default:
    (createStyles) =>
    (...args) => ({
      container: { padding: 0 },
      navigationBar: { flexDirection: "row" },
      iconContainer: { padding: 8 },
      activeIconContainer: { borderWidth: 1 },
      iconText: { fontSize: 10 },
      ...stylesOverrides,
    }),
});
