import React from "react";

import { fireEvent, render, screen } from "@testing-library/react-native";

import PickBanisStep from "./PickBanisStep";

// What the picker offers, and what a tick stores.

jest.mock("@common/hooks/useTokens", () => () => ({ space: { md_12: 12 } }));
// Displayed as the device shows banis — here, transliterated.
jest.mock("@common/hooks/useBaniTitle", () => () => ({
  titleFor: (bani) => bani.translit,
  titleFontFamily: "Baloo",
}));
jest.mock("@common", () => ({ STRINGS: {} }));
jest.mock("../../common/components/ui", () => ({
  GurmukhiTextField: () => null,
  Text: () => null,
}));
jest.mock("./PothiRow", () => ({ baniCountLabel: () => "" }));
jest.mock("./BaniPickRow", () => {
  const { Pressable, Text } = require("react-native");
  // eslint-disable-next-line react/prop-types
  return ({ title, onPress }) => (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
});

const japji = {
  id: 2,
  gurmukhi: "jpujI swihb",
  gurmukhiUni: "ਜਪੁਜੀ ਸਾਹਿਬ",
  translit: "Japji Sahib",
};
const child = { id: 90, gurmukhi: "bwvn AKrI", gurmukhiUni: "ਬਾਵਨ ਅਖਰੀ", translit: "Bavan Akhri" };
const folder = { id: 80, gurmukhi: "Bgq bwxI", translit: "Bhagat Bani", folder: [child, japji] };

const open = (onChange = jest.fn()) => {
  render(<PickBanisStep picked={[]} onChange={onChange} baniListData={[japji, folder]} query="" />);
  return onChange;
};

it("offers a bundled folder's banis, not the folder, each once", () => {
  open();
  expect(screen.getByText("Bavan Akhri")).toBeTruthy();
  expect(screen.queryByText("Bhagat Bani")).toBeNull();
  expect(screen.getAllByText("Japji Sahib")).toHaveLength(1);
});

it("stores the Unicode title, not the one this device displays", () => {
  const onChange = open();
  fireEvent.press(screen.getByText("Japji Sahib"));
  expect(onChange).toHaveBeenCalledWith([
    expect.objectContaining({ baaniId: 2, title: "ਜਪੁਜੀ ਸਾਹਿਬ" }),
  ]);
});
