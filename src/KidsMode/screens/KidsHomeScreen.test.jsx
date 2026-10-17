import React from "react";

import { render } from "@testing-library/react-native";

import KidsHomeScreen from "./KidsHomeScreen";

jest.mock("@common", () => {
  const { createCommonMock } = require("@common/test-utils/mocks/common");
  return createCommonMock({
    STRINGS: { KIDS_MODE: "Kids Mode", KIDS_COMING_SOON: "Coming soon: Japji Sahib practice" },
    StatusBarComponent: () => null,
  });
});

describe("KidsHomeScreen", () => {
  it("renders the placeholder title and message", () => {
    const { getByText } = render(<KidsHomeScreen />);
    expect(getByText("Kids Mode")).toBeTruthy();
    expect(getByText("Coming soon: Japji Sahib practice")).toBeTruthy();
  });
});
