/* eslint-env jest */
import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import ThemeComponent from "./theme";

// The Theme row is the way into the theme grid — the only place the themes the
// backend adds show up — and it names the current choice the way the grid
// does, whether that theme is bundled or came from the backend.

let mockState;
jest.mock("react-redux", () => ({ useSelector: (fn) => fn(mockState) }));

const mockRegistry = {
  list: [
    { id: "light", order: 0, nameKey: "light" },
    { id: "dark", order: 1, nameKey: "dark" },
    {
      id: "sepia-night",
      order: 10,
      nameKey: "reader_theme_sepia-night",
      remote: true,
      names: { en: "Sepia Night", pa: "ਸੀਪੀਆ ਰਾਤ" },
    },
  ],
  byId: {},
};
mockRegistry.list.forEach((t) => {
  mockRegistry.byId[t.id] = t;
});
jest.mock("@theme/reader/useThemeRegistry", () => ({
  __esModule: true,
  default: () => mockRegistry,
}));
jest.mock("@theme/reader/registry", () => ({
  remoteThemeName: (record, lang) => record?.names?.[lang] || record?.names?.en || null,
}));

jest.mock("@common/icons", () => ({ ThemeIcon: () => null }));
jest.mock("@common/constant", () => ({ Default: "Default", Light: "Light", Dark: "Dark" }));
jest.mock("@common", () => ({
  STRINGS: { theme: "Theme", default: "Default", light: "Light Mode", dark: "Dark Mode" },
}));
jest.mock("./comon/SettingsRow", () => {
  const ReactModule = require("react");
  const { Pressable, Text } = require("react-native");
  const Row = ({ title, value, onPress }) =>
    ReactModule.createElement(
      Pressable,
      { testID: "theme-row", onPress },
      ReactModule.createElement(Text, null, `${title}:${value}`)
    );
  return { __esModule: true, default: Row };
});

beforeEach(() => {
  mockState = { theme: "Default", language: "en" };
});

it("opens the theme grid", () => {
  const navigate = jest.fn();
  const { getByTestId } = render(<ThemeComponent navigate={navigate} />);

  fireEvent.press(getByTestId("theme-row"));
  expect(navigate).toHaveBeenCalledWith("Themes");
});

it("names a bundled appearance from the localisation file", () => {
  mockState = { ...mockState, theme: "Dark" };
  const { getByText } = render(<ThemeComponent navigate={jest.fn()} />);
  expect(getByText("Theme:Dark Mode")).toBeTruthy();
});

it("names a backend theme from the names it carries, in the app language", () => {
  mockState = { theme: "sepia-night", language: "pa" };
  const { getByText } = render(<ThemeComponent navigate={jest.fn()} />);
  expect(getByText("Theme:ਸੀਪੀਆ ਰਾਤ")).toBeTruthy();
});

it("shows the stored id when nothing can name it any more", () => {
  mockState = { ...mockState, theme: "withdrawn-theme" };
  const { getByText } = render(<ThemeComponent navigate={jest.fn()} />);
  expect(getByText("Theme:withdrawn-theme")).toBeTruthy();
});
