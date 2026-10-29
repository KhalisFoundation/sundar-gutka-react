/* eslint-env jest */
/**
 * The folder screen's header name.
 *
 * Renaming a pothi from this screen's own menu writes to the store, while the
 * route holds the string the screen was pushed with — so the header, and the
 * menu sheet under it, went on showing the old name until the user backed out
 * and opened the folder again. The contents were already read live for exactly
 * this reason; the name was not.
 */
import React from "react";

import { render } from "@testing-library/react-native";

import FolderScreen from "./FolderScreen";

let mockState;
jest.mock("react-redux", () => ({
  useSelector: (fn) => fn(mockState),
  useDispatch: () => jest.fn(),
}));

// The header is the only thing under test; everything below it is stubbed to
// its own tests.
jest.mock("../common/components/ui", () => {
  const ReactModule = require("react");
  const { Text: RNText, View } = require("react-native");
  return {
    Button: () => null,
    Row: View,
    ScreenHeader: ({ title }) =>
      ReactModule.createElement(RNText, { testID: "header-title" }, title),
    Sheet: () => null,
    Text: RNText,
  };
});
jest.mock("@rneui/themed", () => ({ Icon: () => null }));
jest.mock("@common/hooks/useTokens", () => () => ({
  c: {},
  layout: { icon: { xs: 12 }, screenPaddingBottom: 0 },
  space: { xs: 4, sm: 8, md: 12 },
  radii: { md: 8 },
}));
jest.mock("@common/icons", () => ({ PlusIcon: () => null }));
jest.mock("@common", () => ({
  actions: {},
  BaniList: () => null,
  constant: {},
  GradientDivider: () => null,
  SafeArea: require("react-native").View,
  showConfirm: jest.fn(),
  StatusBarComponent: () => null,
  STRINGS: {},
}));
jest.mock("../HomeScreen/hooks", () => ({ useBaniList: () => ({ baniListData: [] }) }));
jest.mock("../Pothi/components/AddBanisSheet", () => () => null);
jest.mock("../Pothi/components/BaniPickRow", () => () => null);
jest.mock("../Pothi/components/PothiActionsSheet", () => () => null);
jest.mock("../Pothi/hooks/useDeletePothi", () => () => jest.fn());

const folder = (name) => ({ id: "p1", name, source: "mypothi", items: [], updatedAt: 1 });

const open = (params) =>
  render(
    <FolderScreen
      navigation={{ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }}
      route={{ params: { params } }}
    />
  );

const headerText = (rendered) => rendered.getByTestId("header-title").props.children;

it("shows the pothi's CURRENT name, not the one the screen was opened with", () => {
  mockState = { pothis: { folders: [folder("Renamed")] } };
  const rendered = open({ data: [], title: "Old name", pothiId: "p1" });
  expect(headerText(rendered)).toBe("Renamed");
});

it("follows a rename that happens while the screen is open", () => {
  mockState = { pothis: { folders: [folder("Before")] } };
  const rendered = open({ data: [], title: "Before", pothiId: "p1" });
  expect(headerText(rendered)).toBe("Before");

  mockState = { pothis: { folders: [folder("After")] } };
  rendered.rerender(
    <FolderScreen
      navigation={{ navigate: jest.fn(), goBack: jest.fn(), setOptions: jest.fn() }}
      route={{ params: { params: { data: [], title: "Before", pothiId: "p1" } } }}
    />
  );
  expect(headerText(rendered)).toBe("After");
});

it("keeps the route's title for a bundled folder, which has no pothi to read", () => {
  mockState = { pothis: { folders: [] } };
  const rendered = open({ data: [], title: "AMRIT BAANI" });
  expect(headerText(rendered)).toBe("AMRIT BAANI");
});
