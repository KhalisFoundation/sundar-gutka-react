/* eslint-env jest */
import React from "react";

import { render } from "@testing-library/react-native";
import PropTypes from "prop-types";

import { getMockDispatch } from "@common/test-utils/mocks/react-redux";

import useBookmarks from "./useBookmarks";

jest.mock("@common/actions", () => ({
  setBookmarkPosition: jest.fn((value) => ({ type: "SET_BOOKMARK_POSITION", value })),
}));

const TestComponent = ({ webViewRef, shabad, bookmarkPosition, onJump = undefined }) => {
  useBookmarks(webViewRef, shabad, bookmarkPosition, onJump);
  return null;
};

TestComponent.propTypes = {
  webViewRef: PropTypes.shape().isRequired,
  shabad: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  bookmarkPosition: PropTypes.number.isRequired,
  onJump: PropTypes.func,
};

describe("Reader useBookmarks", () => {
  const shabad = [{ id: 1 }];
  let webViewRef;

  beforeEach(() => {
    jest.clearAllMocks();
    webViewRef = { current: { postMessage: jest.fn() } };
  });

  it("posts the bookmark to the WebView and clears the pending position", () => {
    render(<TestComponent webViewRef={webViewRef} shabad={shabad} bookmarkPosition={4567} />);

    expect(webViewRef.current.postMessage).toHaveBeenCalledWith(JSON.stringify({ bookmark: 4567 }));
    expect(getMockDispatch()).toHaveBeenCalledWith({
      type: "SET_BOOKMARK_POSITION",
      value: -1,
    });
  });

  // The Reader's iOS focus listener re-sends the pre-Bookmarks position and runs
  // off the same commit as this effect, so the jump has to be announced first for
  // that listener to stand down — otherwise it scrolls the reader straight back.
  it("announces the jump before posting it", () => {
    const calls = [];
    const onJump = jest.fn(() => calls.push("onJump"));
    webViewRef.current.postMessage = jest.fn(() => calls.push("postMessage"));

    render(
      <TestComponent
        webViewRef={webViewRef}
        shabad={shabad}
        bookmarkPosition={4567}
        onJump={onJump}
      />
    );

    expect(onJump).toHaveBeenCalledWith(4567);
    expect(calls).toEqual(["onJump", "postMessage"]);
  });

  it("works without a listener, which is how Android uses it", () => {
    render(<TestComponent webViewRef={webViewRef} shabad={shabad} bookmarkPosition={4567} />);

    expect(webViewRef.current.postMessage).toHaveBeenCalledTimes(1);
  });

  it("stays put when no bookmark is pending", () => {
    render(<TestComponent webViewRef={webViewRef} shabad={shabad} bookmarkPosition={-1} />);

    expect(webViewRef.current.postMessage).not.toHaveBeenCalled();
  });

  it("waits for the shabad to load before jumping", () => {
    render(<TestComponent webViewRef={webViewRef} shabad={[]} bookmarkPosition={4567} />);

    expect(webViewRef.current.postMessage).not.toHaveBeenCalled();
  });
});
