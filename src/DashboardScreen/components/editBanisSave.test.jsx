/* eslint-env jest */
import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import { makeBaniItem, MORNING_ID } from "@common/pothi/model";

import EditBanisModal from "./EditBanisModal";

const mockSetBanis = jest.fn(() => true);
const mockDispatch = jest.fn();
let mockState;

jest.mock("react-redux", () => ({
  useSelector: (fn) => fn(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("@common", () => {
  const { Text } = require("react-native");
  return {
    // eslint-disable-next-line react/prop-types
    CustomText: ({ children }) => <Text>{children}</Text>,
    convertToUnicode: (s) => s,
    STRINGS: { SAVE: "Save", CANCEL: "Cancel", EDIT_BANIS: "Edit", POTHI_DEFAULT_MORNING: "M" },
    actions: { seedDefaultPothis: (value) => ({ type: "SEED_DEFAULT_POTHIS", value }) },
    logError: jest.fn(),
    trackDashboardEvent: jest.fn(),
  };
});
jest.mock("@database", () => ({ getBaniList: jest.fn(() => Promise.resolve([])) }));
jest.mock("../../Pothi/hooks/useSetPothiBanis", () => () => mockSetBanis);
jest.mock("../../Pothi/reportPothiEmptied", () => jest.fn());
jest.mock("./SheetModal", () => {
  const { View } = require("react-native");
  // eslint-disable-next-line react/prop-types
  return ({ children }) => <View>{children}</View>;
});
jest.mock("./dashboardTheme", () => () => ({ c: {}, theme: { typography: { fonts: {} } } }));

const bani = (id, name) => ({ id, gurmukhiUni: name });
// Savaiye (79) sits inside a folder in the bani list, the way orderedBani nests it.
const baniList = [
  bani(2, "Japji"),
  bani(4, "Jaap"),
  { gurmukhiUni: "Savaiye folder", folder: [bani(79, "Savaiye")] },
];
const morning = (ids) => ({
  id: MORNING_ID,
  name: "M",
  source: "sundar-gutka",
  items: ids.map((id) => makeBaniItem({ baaniId: id, title: `b${id}` })),
  createdAt: 1,
  updatedAt: 1,
});
const stateWith = (folder) => ({
  baniList,
  isTransliteration: false,
  transliterationLanguage: "ENGLISH",
  pothis: { folders: folder ? [folder] : [], defaultIds: { morning: folder ? MORNING_ID : null } },
});

beforeEach(() => jest.clearAllMocks());

it("offers the banis inside folders, and keeps one the pothi holds on Save", () => {
  mockState = stateWith(morning([2, 79]));
  const { getByText } = render(<EditBanisModal visible onClose={jest.fn()} />);
  expect(getByText("Savaiye")).toBeTruthy();
  fireEvent.press(getByText("Save"));
  const items = mockSetBanis.mock.calls[0][1];
  expect(items.map((i) => i.baaniId).sort()).toEqual([2, 79]);
});

it("keeps a pothi bani the list does not show at all", () => {
  mockState = stateWith(morning([2, 999]));
  const { getByText } = render(<EditBanisModal visible onClose={jest.fn()} />);
  fireEvent.press(getByText("Save"));
  expect(mockSetBanis.mock.calls[0][1].map((i) => i.baaniId)).toContain(999);
});

// Not here yet — the account boundary reset the pothis and the account's copy
// has not arrived. A copy built now won the merge and replaced the account's
// own Morning Nitnem everywhere.
it("writes nothing while the account's Morning Nitnem has not arrived", () => {
  mockState = stateWith(null);
  const { getByText } = render(<EditBanisModal visible onClose={jest.fn()} />);
  fireEvent.press(getByText("Save"));
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(mockSetBanis).not.toHaveBeenCalled();
});

// Deleted on another client, which this app refuses to do: rebuilt, opening on
// the ticks the card shows.
it("rebuilds a Morning Nitnem deleted elsewhere, from the ticks the card shows", () => {
  mockState = stateWith(null);
  // The defaults were seeded or pulled, and there is still no Morning Nitnem:
  // it is gone, not on its way. An account holding only Evening Nitnem never
  // records morning as deleted, and the Edit control stayed hidden for good.
  mockState.pothis.seededDefaults = true;
  const { getByText } = render(<EditBanisModal visible onClose={jest.fn()} />);
  fireEvent.press(getByText("Save"));
  const seeded = mockDispatch.mock.calls[0][0].value[0];
  expect(seeded.items.map((i) => i.baaniId)).toEqual([2, 4]);
});
