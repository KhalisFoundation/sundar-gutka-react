import React from "react";

import { act, render } from "@testing-library/react-native";

import PothiList from "./PothiList";

// Pulling down on the Pothis tab must run the same account sync as pulling
// down on the Dashboard — one request, one spinner that ends when it ends.
//
// The pull itself is the shared PullToRefresh control (its own test covers the
// gesture). What this file holds to is what the Folders tab tells that control:
// when a pull is allowed at all, and that the list is wired to scroll
// alongside it rather than fight it.

const mockRequestPull = jest.fn(() => Promise.resolve());
jest.mock("@service/dashboard/syncSignal", () => ({
  requestPull: (...a) => mockRequestPull(...a),
}));

let mockState;
jest.mock("react-redux", () => ({
  useSelector: (fn) => fn(mockState),
  useDispatch: () => jest.fn(),
}));

jest.mock("react-native-gesture-handler", () => ({
  GestureHandlerRootView: require("react-native").View,
}));

// The draggable list is a native-gesture component; here it only has to report
// its scroll offset back, the way the real one does through this callback.
jest.mock("react-native-draggable-flatlist", () => {
  const ReactModule = require("react");
  const { View } = require("react-native");
  const DraggableFlatList = ({
    data,
    ListHeaderComponent,
    ListEmptyComponent,
    simultaneousHandlers,
    onScrollOffsetChange,
    onDragBegin,
    onDragEnd,
  }) =>
    ReactModule.createElement(
      View,
      { testID: "list", simultaneousHandlers },
      ListHeaderComponent,
      // A FlatList shows its empty component only when the data is empty.
      data && data.length ? null : ListEmptyComponent,
      // Stand-ins for the list's own lifecycle, so a test can scroll or reorder.
      ReactModule.createElement(View, { testID: "scroll", onPress: onScrollOffsetChange }),
      ReactModule.createElement(View, { testID: "drag-begin", onPress: () => onDragBegin(0) }),
      ReactModule.createElement(View, {
        testID: "drag-end",
        onPress: () => onDragEnd({ data: [] }),
      })
    );
  return { __esModule: true, default: DraggableFlatList, ScaleDecorator: View };
});

jest.mock("@common/hooks/useScreenPalette", () => () => ({ surface: "#fff" }));
jest.mock("@common/hooks/useTokens", () => () => ({
  c: { textPrimary: "#000", textSecondary: "#333" },
  space: { xs: 4, sm: 8, md: 12 },
  layout: { screenGutter: 16, screenPaddingBottom: 24 },
}));
jest.mock("@common/icons", () => ({ DragHandleIcon: () => null }));
jest.mock("@common", () => ({
  actions: { setPothiOrder: (ids) => ({ type: "SET_POTHI_ORDER", ids }) },
  STRINGS: {
    POTHI_EMPTY_TITLE: "No pothis yet",
    POTHI_EMPTY_BODY: "",
    POTHI_DEFAULT_FOLDERS: "Default Folders",
  },
  trackPothiEvent: jest.fn(),
  useCustomScrollbar: () => ({ ownedScrollProps: {}, Indicator: null }),
}));
jest.mock("./hooks/usePothiTitle", () => () => ({
  titleFor: (row) => row.name,
  variantFor: () => "body",
}));
jest.mock("./hooks/useSignedOutPothiHint", () => () => {});
jest.mock("./components/NewPothiRow", () => () => null);
jest.mock("./components/PothiActionsSheet", () => () => null);
jest.mock("./components/PothiRow", () => () => null);

// Records what the Folders tab asks of the shared pull control.
let mockPull;
jest.mock("../common/components/ui", () => ({
  ListSeparator: () => null,
  Text: require("react-native").Text,
  PullToRefresh: (props) => {
    mockPull = props;
    return props.children;
  },
}));

const folder = (over) => ({
  id: over.id,
  name: over.name,
  source: "sundar-gutka",
  items: [],
  createdAt: 1,
  updatedAt: 1,
  pinned: Boolean(over.pinned),
});
const pothis = { folders: [], deletedIds: [], seededDefaults: true };
const open = () =>
  render(
    <PothiList
      baniListData={[]}
      onOpenPothi={jest.fn()}
      onCreatePress={jest.fn()}
      onPinLimit={jest.fn()}
    />
  );

beforeEach(() => {
  mockRequestPull.mockClear();
  mockPull = null;
});

it("pulling down runs the account sync", async () => {
  mockState = { auth: { status: "signedIn" }, pothis };
  const rendered = open();
  expect(mockPull.enabled).toBe(true);
  // The list has to scroll ALONGSIDE the pull rather than cancelling it — its
  // own scroll view claims the touch first otherwise, and the pull never fires.
  expect(rendered.getByTestId("list").props.simultaneousHandlers).toBe(mockPull.gestureRef);

  await act(async () => mockPull.onRefresh());
  expect(mockRequestPull).toHaveBeenCalledWith("pull-to-refresh");
});

// The rule that lets a pull sit over a scrolling list at all.
it("reports being at the top only while the list is there", () => {
  mockState = { auth: { status: "signedIn" }, pothis };
  const rendered = open();
  expect(mockPull.atTop).toBe(true);

  act(() => rendered.getByTestId("scroll").props.onPress(320));
  expect(mockPull.atTop).toBe(false);

  act(() => rendered.getByTestId("scroll").props.onPress(0));
  expect(mockPull.atTop).toBe(true);
});

it("switches the pull-down off for the whole of a reorder", () => {
  mockState = { auth: { status: "signedIn" }, pothis };
  const rendered = open();
  expect(mockPull.enabled).toBe(true);
  act(() => rendered.getByTestId("drag-begin").props.onPress());
  expect(mockPull.enabled).toBe(false);
  act(() => rendered.getByTestId("drag-end").props.onPress());
  expect(mockPull.enabled).toBe(true);
});

it("offers no pull-down while signed out — there is no account to pull", () => {
  mockState = { auth: { status: "signedOut" }, pothis };
  open();
  expect(mockPull.enabled).toBe(false);
});

// Pinning lifts a pothi OUT of the draggable list and into the header, so the
// list's own data is the unpinned lane alone. Pinning the last one therefore
// emptied that lane, and the list announced "no pothis yet" over a header that
// was still showing them. The empty state has to be measured against every
// user pothi, not against what happens to be draggable.
it("says nothing about being empty while a pinned pothi is on screen", () => {
  mockState = {
    auth: { status: "signedOut" },
    pothis: {
      ...pothis,
      folders: [folder({ id: "a", name: "Morning", pinned: true })],
    },
  };

  expect(open().queryByText("No pothis yet")).toBeNull();
});

it("still says so when there is genuinely nothing", () => {
  mockState = { auth: { status: "signedOut" }, pothis };

  expect(open().queryByText("No pothis yet")).toBeTruthy();
});
