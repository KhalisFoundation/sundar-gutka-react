import React from "react";
import { Appearance, Text } from "react-native";
import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";
import { act, fireEvent, render } from "@testing-library/react-native";

import constant from "@common/constant";
import useTheme from "@common/context";
import ThemeProvider from "@common/context/ThemeProvider";
import reducer from "@common/reducer";

import { loadHTML } from "../../../ReaderScreen/utils";

import ColorEditor from "./ColorEditor";

jest.unmock("react-redux");
jest.unmock("@common/context");
jest.unmock("@common/hooks/useThemedStyles");
jest.mock("react-native-webview", () => ({ WebView: "WebView" }));
jest.mock(
  "react-native-localization",
  () =>
    class LocalizedStrings {
      constructor(strings) {
        Object.assign(this, strings["en-US"]);
      }
    }
);
jest.mock("@common/firebase/analytics", () => ({ trackSettingEvent: jest.fn() }));
jest.mock("@common", () => ({
  constant: jest.requireActual("@common/constant").default,
  baseFontSize: jest.requireActual("@common/helpers").default,
  logError: jest.fn(),
  logMessage: jest.fn(),
}));

const ThemeProbe = () => {
  const { theme } = useTheme();
  return <Text testID="resolved-theme">{JSON.stringify(theme)}</Text>;
};

const setup = (overrides = {}) => {
  const store = configureStore({
    reducer,
    preloadedState: {
      ...reducer(undefined, { type: "@@INIT" }),
      theme: constant.Dark,
      fontFace: constant.BALOO_PAAJI,
      ...overrides,
    },
  });
  const close = jest.fn();
  const view = render(
    <Provider store={store}>
      <ThemeProvider>
        <ColorEditor mode="dark" initialColor="vishraamShort" onClose={close} />
        <ThemeProbe />
      </ThemeProvider>
    </Provider>
  );
  return { ...view, store, close };
};

afterEach(() => jest.restoreAllMocks());

test("preview changes live without persisting until Save, and the reader resolves the same colors", () => {
  const { getByTestId, getByRole, store, close } = setup();
  fireEvent.changeText(getByTestId("reader-color-input"), "#eeccff");
  const preview = getByTestId("reader-color-preview").props.source.html;
  expect(preview).toContain("--reader-vishraamShort: #eeccff");
  expect(preview).toContain("ਸੋਚੈ");
  expect(preview).toContain("var(--reader-vishraamLong)");
  expect(preview).not.toContain("<script>");
  expect(store.getState().readerColors).toEqual({});
  fireEvent.press(getByRole("button", { name: "Save" }));
  expect(store.getState().readerColors.dark.vishraamShort).toBe("#eeccff");
  expect(close).toHaveBeenCalledTimes(1);
  const theme = JSON.parse(getByTestId("resolved-theme").props.children);
  const html = loadHTML(
    [],
    false,
    constant.SMALL,
    constant.BALOO_PAAJI,
    false,
    false,
    false,
    theme,
    false
  );
  expect(html).toContain("--reader-vishraamShort: #eeccff");
  expect(theme.colors.surface).toBe("rgba(18, 18, 18, 1)");
});

test("gradient preview uses the same custom color without changing the saved vishraam mode", () => {
  const { getByRole, getByTestId, store } = setup();
  fireEvent.changeText(getByTestId("reader-color-input"), "#eeccff");
  fireEvent.press(getByRole("radio", { name: "Gradient Background" }));
  const { html } = getByTestId("reader-color-preview").props.source;
  expect(html).toContain("--reader-vishraamShortGradient: #eeccff4d");
  expect(html).toContain("var(--reader-vishraamShortGradient) 100%");
  expect(store.getState().vishraamOption).toBe(constant.VISHRAAM_COLORED);
});

test("invalid colors cannot save, and Cancel discards the valid draft", () => {
  const { getByRole, getByTestId, store, close } = setup();
  fireEvent.changeText(getByTestId("reader-color-input"), "#123");
  expect(getByRole("button", { name: "Save" })).toBeDisabled();
  fireEvent.changeText(getByTestId("reader-color-input"), "#112233");
  fireEvent.press(getByRole("button", { name: "Cancel" }));
  expect(store.getState().readerColors).toEqual({});
  expect(close).toHaveBeenCalledTimes(1);
});

test("reset saves only the edited mode and leaves unrelated preferences intact", () => {
  const { getByRole, store } = setup({
    readerColors: { dark: { text: "#ffeedd" }, light: { text: "#112233" } },
  });
  fireEvent.press(getByRole("button", { name: "Reset colors for this mode" }));
  fireEvent.press(getByRole("button", { name: "Save" }));
  expect(store.getState().readerColors).toEqual({ dark: {}, light: { text: "#112233" } });
  expect(store.getState().fontFace).toBe(constant.BALOO_PAAJI);
});

test("system theme changes select the appropriate saved palette and unsubscribe on unmount", () => {
  let onAppearance;
  const remove = jest.fn();
  jest.spyOn(Appearance, "getColorScheme").mockReturnValue("light");
  jest.spyOn(Appearance, "addChangeListener").mockImplementation((listener) => {
    onAppearance = listener;
    return { remove };
  });
  const { getByTestId, unmount } = setup({
    theme: constant.Default,
    readerColors: { light: { text: "#112233" }, dark: { text: "#ffeedd" } },
  });
  expect(JSON.parse(getByTestId("resolved-theme").props.children).readerColors.text).toBe(
    "#112233"
  );
  act(() => onAppearance({ colorScheme: "dark" }));
  expect(JSON.parse(getByTestId("resolved-theme").props.children).readerColors.text).toBe(
    "#ffeedd"
  );
  unmount();
  expect(remove).toHaveBeenCalled();
});
