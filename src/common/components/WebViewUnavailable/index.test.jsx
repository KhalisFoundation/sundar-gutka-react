/* eslint-env jest */
import React from "react";

import { fireEvent, render } from "@testing-library/react-native";

import WebViewUnavailable from "./index";

const mockOpenInstaller = jest.fn();
jest.mock("@common/webViewAvailability", () => ({
  openWebViewInstaller: (...a) => mockOpenInstaller(...a),
}));
jest.mock("@common/hooks/useTokens", () => () => ({
  c: { background: "#fff", textPrimary: "#000", textSecondary: "#555" },
  space: { sm: 8, lg: 24 },
}));
jest.mock("../ui", () => {
  const ReactModule = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    Text: ({ children }) => ReactModule.createElement(Text, null, children),
    Button: ({ title, onPress }) =>
      ReactModule.createElement(
        Pressable,
        { onPress, accessibilityRole: "button" },
        ReactModule.createElement(Text, null, title)
      ),
  };
});
jest.mock("@common", () => ({
  STRINGS: {
    WEBVIEW_MISSING_TITLE: "Web content can't be shown",
    WEBVIEW_MISSING_BODY: "Update or enable it, then try again.",
    WEBVIEW_UPDATE: "Update WebView",
    TRY_AGAIN: "Try again",
  },
}));

it("explains, sends the user to the provider, and offers a re-check", () => {
  const onRetry = jest.fn();
  const { getByText } = render(<WebViewUnavailable onRetry={onRetry} />);

  expect(getByText("Web content can't be shown")).toBeTruthy();
  expect(getByText("Update or enable it, then try again.")).toBeTruthy();

  fireEvent.press(getByText("Update WebView"));
  expect(mockOpenInstaller).toHaveBeenCalledTimes(1);

  fireEvent.press(getByText("Try again"));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
