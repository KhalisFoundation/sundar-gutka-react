/* eslint-env jest */
import React from "react";
import { Platform } from "react-native";

import { fireEvent, render } from "@testing-library/react-native";

import Account from "./account";

// App Review wants an in-app control, in Settings, for any app that creates an
// account — which is why this row exists at all, and why it is not a support
// link. Play asks for no equivalent, and the deletion is permanent once its
// grace period lapses, so it is not offered where it was not asked for.

const mockDeleteAccount = jest.fn();
const mockSignOut = jest.fn();

jest.mock("@common/hooks/useSsoActions", () => ({
  __esModule: true,
  default: () => ({
    status: "signedIn",
    user: { firstname: "Test", lastname: "User", email: "test@example.com" },
    busy: false,
    signIn: jest.fn(),
    signOut: mockSignOut,
    deleteAccount: mockDeleteAccount,
  }),
}));

jest.mock("@common/hooks/useTokens", () => () => ({
  c: { error: "#c00", textSecondary: "#888", textPrimary: "#000", textDisabled: "#aaa" },
  layout: { row: { iconSize: 20 }, icon: { sm: 16 } },
}));

jest.mock("@common/components/ui", () => {
  const { View } = require("react-native");
  return { Spinner: () => <View /> };
});

jest.mock("@common", () => ({
  STRINGS: {
    USER: "User",
    SIGN_IN: "Sign In",
    SIGN_OUT: "Sign Out",
    DELETE_ACCOUNT: "Delete Account",
  },
}));

jest.mock("./comon/SettingsRow", () => {
  const { Text, Pressable } = require("react-native");
  return ({ title, destructive, onPress, testID }) => (
    <Pressable testID={testID} onPress={onPress} accessibilityLabel={title}>
      <Text>{destructive ? `destructive:${title}` : title}</Text>
    </Pressable>
  );
});

afterEach(() => {
  Platform.OS = "ios";
});

describe("the Delete Account row", () => {
  it("is offered on iOS", () => {
    Platform.OS = "ios";
    const { getByTestId } = render(<Account />);

    expect(getByTestId("delete-account-row")).toBeTruthy();
  });

  it("is NOT offered on Android", () => {
    Platform.OS = "android";
    const { queryByTestId, getByLabelText } = render(<Account />);

    expect(queryByTestId("delete-account-row")).toBeNull();
    // …and the rest of the account section is untouched there.
    expect(getByLabelText("Sign Out")).toBeTruthy();
  });

  it("reads as destructive, not as another ordinary row", () => {
    Platform.OS = "ios";
    const { getByText } = render(<Account />);

    expect(getByText("destructive:Delete Account")).toBeTruthy();
  });

  it("hands the press straight to the action that owns the confirmation", () => {
    Platform.OS = "ios";
    const { getByTestId } = render(<Account />);

    fireEvent.press(getByTestId("delete-account-row"));
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
  });
});
