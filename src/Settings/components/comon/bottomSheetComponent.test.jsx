import React from "react";

import { fireEvent, render, screen } from "@testing-library/react-native";

import BottomSheetComponent from "./bottomSheetComponent";

// The reminder-sound chooser goes through this component. Choosing a sound has
// to do TWO things, and for a long time it only did the first:
//
//   1. store the new value, and
//   2. rewrite the notifications already scheduled in the OS.
//
// The chosen sound is baked into each notification when it is scheduled — on
// Android it selects the channel, on iOS it names the sound file — so a stored
// value alone changes nothing that is already queued. Reminders kept firing with
// the previous tone until something else happened to reschedule them, which is
// why editing a reminder's TIME appeared to fix the sound.

const mockDispatch = jest.fn();

jest.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));

jest.mock("react-native-sound-player", () => ({ playSoundFile: jest.fn() }));

jest.mock("@common", () => ({ STRINGS: { cancel: "Cancel" } }));

jest.mock("./SelectSheet", () => {
  const React2 = require("react");
  const { Pressable, Text } = require("react-native");
  return ({ options, onSelect }) =>
    React2.createElement(
      React2.Fragment,
      null,
      options.map((o) =>
        React2.createElement(
          Pressable,
          { key: o.key, testID: o.key, onPress: () => onSelect(o.key) },
          React2.createElement(Text, null, o.title)
        )
      )
    );
});

const OPTIONS = [
  { key: "default", title: "Default" },
  { key: "wake_up_jap.mp3", title: "Wake Up Jap" },
];

const setup = (onChange) =>
  render(
    <BottomSheetComponent
      isVisible
      actionConstant={OPTIONS}
      value="default"
      title="Reminder sound"
      action={(key) => ({ type: "SET", key })}
      toggleVisible={jest.fn()}
      onChange={onChange}
    />
  );

beforeEach(() => mockDispatch.mockClear());

describe("choosing a setting value", () => {
  it("stores the value", () => {
    setup(undefined);
    fireEvent.press(screen.getByTestId("wake_up_jap.mp3"));
    expect(mockDispatch).toHaveBeenCalledWith({ type: "SET", key: "wake_up_jap.mp3" });
  });

  it("also runs the side effect the store cannot do", () => {
    const onChange = jest.fn();
    setup(onChange);

    fireEvent.press(screen.getByTestId("wake_up_jap.mp3"));

    // This is the call that rewrites the scheduled reminders.
    expect(onChange).toHaveBeenCalledWith("wake_up_jap.mp3");
  });

  it("stays usable for settings that need no side effect", () => {
    // `onChange` is optional; every other chooser in Settings omits it.
    setup(undefined);
    expect(() => fireEvent.press(screen.getByTestId("default"))).not.toThrow();
  });
});
