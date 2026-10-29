// Mock factory for @common/context
// Usage in test file:
// import { createContextMock } from '@common/test-utils/mocks/context';
// jest.mock("@common/context", () => createContextMock());
//
// The colour layer here is the REAL one, not a hand-written subset. A stub
// drifts from the app the moment a role is added or renamed, and then tests go
// on passing while the screen renders `undefined` — which is exactly what
// happened when the app moved off `theme.colors` onto the semantic `theme.c`.

export const createContextMock = (themeOverrides = {}) => {
  const semantic = require("../../../theme/semanticColors");
  const mode = themeOverrides.mode === "dark" ? "dark" : "light";

  return {
    __esModule: true,
    default: () => ({
      theme: {
        mode,
        c: { ...semantic[mode], ...themeOverrides.c },
        layout: require("../../../theme/layout").default,
        // Real, for the same reason as the colours above: useTokens hands this
        // straight to any component that lifts a surface, and a missing key
        // reads as `undefined.overlay` at render rather than as a failed
        // assertion.
        elevation: require("../../../theme/elevation")[mode],
        chrome: require(mode === "dark" ? "../../../theme/darkTheme" : "../../../theme/lightTheme")
          .default.chrome,
        radii: require("../../../theme/radii").default,
        space: require("../../../theme/space").default,
        type: require("../../../theme/type").default,
        typography: {
          fonts: {
            balooPaaji: "BalooPaaji2-Regular",
            balooPaajiSemiBold: "BalooPaaji2-SemiBold",
            gurbaniPrimary: "GurbaniAkharTrue",
            gurbaniHeavy: "GurbaniAkharHeavyTrue",
          },
          sizes: { xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 22, huge: 28, massive: 32 },
          weights: { normal: "400", medium: "500", semibold: "600", bold: "700" },
        },
        spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
        components: { card: { borderRadius: 12 } },
      },
    }),
  };
};

export default createContextMock;
