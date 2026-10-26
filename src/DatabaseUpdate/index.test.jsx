import React from "react";

import { act, render, screen } from "@testing-library/react-native";

import { getMockDispatch } from "@common/test-utils/mocks/react-redux";

import { resolveUpdateCheck, UPDATE_CHECK } from "./updateCheck";

import DatabaseUpdateScreen from "./index";

// The screen re-checks when the connection changes, but only while it has no
// real answer: once an update is found, a network flip must not unmount the
// download, and an older check must never overwrite a newer one.

jest.mock("./updateCheck", () => ({
  ...jest.requireActual("./updateCheck"),
  resolveUpdateCheck: jest.fn(),
}));

let mockNetwork = { isOnline: true };
jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  const base = createCommonMock();
  return {
    ...base,
    GradientDivider: () => null,
    ListItemTitle: ({ title }) => {
      const { Text } = require("react-native");
      return <Text>{title}</Text>;
    },
    useNetwork: () => mockNetwork,
    actions: {
      ...base.actions,
      toggleDatabaseUpdateAvailable: (value) => ({ type: "TOGGLE_DB_UPDATE", value }),
    },
    constant: { ...base.constant, BANI_DB_URL: "https://banidb.com" },
    STRINGS: {
      ...base.STRINGS,
      databaseUpdate: "Database Update",
      GO_BACK: "Go back",
      BANI_DB: "BaniDB",
      checkForUpdate: "Checking for update",
      NO_INTERNET: "No internet",
      errorTitle: "Something Went Wrong",
      upToDate: "Up to date",
    },
  };
});
jest.mock("../common/components/ui", () => ({ ScreenHeader: () => null }));
jest.mock("@rneui/themed", () => {
  const { View } = require("react-native");
  const ListItem = ({ children }) => <View>{children}</View>;
  ListItem.Content = ({ children }) => <View>{children}</View>;
  return { ListItem, Icon: () => null };
});
jest.mock("./components/baniDBAbout", () => () => null);
jest.mock("./components/Download", () => {
  const { Text } = require("react-native");
  return () => <Text>download-component</Text>;
});

const navigation = { goBack: jest.fn() };

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

beforeEach(() => {
  jest.clearAllMocks();
  // The status spinner runs its own timers and animation loop.
  jest.useFakeTimers();
  mockNetwork = { isOnline: true };
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("DatabaseUpdateScreen", () => {
  it("says something went wrong when the check fails, not up to date", async () => {
    resolveUpdateCheck.mockResolvedValue(UPDATE_CHECK.FAILED);

    render(<DatabaseUpdateScreen navigation={navigation} />);

    expect(await screen.findByText("Something Went Wrong")).toBeTruthy();
    expect(screen.queryByText("Up to date")).toBeNull();
    // No answer, so the Home badge is left alone.
    expect(getMockDispatch()).not.toHaveBeenCalled();
  });

  it("keeps the download mounted when the connection flips after an update is found", async () => {
    resolveUpdateCheck.mockResolvedValue(UPDATE_CHECK.AVAILABLE);
    render(<DatabaseUpdateScreen navigation={navigation} />);
    expect(await screen.findByText("download-component")).toBeTruthy();

    mockNetwork = { isOnline: false };
    screen.rerender(<DatabaseUpdateScreen navigation={navigation} />);
    mockNetwork = { isOnline: true };
    screen.rerender(<DatabaseUpdateScreen navigation={navigation} />);

    expect(resolveUpdateCheck).toHaveBeenCalledTimes(1);
    expect(screen.getByText("download-component")).toBeTruthy();
  });

  it("checks again when the connection comes back after an offline answer", async () => {
    mockNetwork = { isOnline: false };
    resolveUpdateCheck.mockResolvedValueOnce(UPDATE_CHECK.OFFLINE);
    render(<DatabaseUpdateScreen navigation={navigation} />);
    expect(await screen.findByText("No internet")).toBeTruthy();

    resolveUpdateCheck.mockResolvedValueOnce(UPDATE_CHECK.UP_TO_DATE);
    mockNetwork = { isOnline: true };
    screen.rerender(<DatabaseUpdateScreen navigation={navigation} />);

    expect(await screen.findByText("Up to date")).toBeTruthy();
    expect(resolveUpdateCheck).toHaveBeenCalledTimes(2);
  });

  it("ignores an older check that finishes after a newer one", async () => {
    const first = deferred();
    const second = deferred();
    mockNetwork = { isOnline: false };
    resolveUpdateCheck.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<DatabaseUpdateScreen navigation={navigation} />);

    mockNetwork = { isOnline: true };
    screen.rerender(<DatabaseUpdateScreen navigation={navigation} />);

    await act(async () => second.resolve(UPDATE_CHECK.AVAILABLE));
    await act(async () => first.resolve(UPDATE_CHECK.OFFLINE));

    expect(screen.getByText("download-component")).toBeTruthy();
    expect(screen.queryByText("No internet")).toBeNull();
  });
});
