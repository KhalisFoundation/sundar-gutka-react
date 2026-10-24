/* eslint-env jest */
import { act, renderHook } from "@testing-library/react-native";
import { trackPunjabiKeyboardEvent } from "@common";
import usePunjabiKeyboard from "./usePunjabiKeyboard";

// How many people use the Punjabi keyboard: counted each time it is switched
// on, with the field it was switched on from.

jest.mock("@common", () => ({ trackPunjabiKeyboardEvent: jest.fn() }));

beforeEach(() => trackPunjabiKeyboardEvent.mockClear());

describe("the Punjabi keyboard switch", () => {
  it("starts down", () => {
    const { result } = renderHook(() => usePunjabiKeyboard());
    expect(result.current[0]).toBe(false);
  });

  it("reports turning it on, with the field", () => {
    const { result } = renderHook(() => usePunjabiKeyboard());
    act(() => result.current[2]("rename_pothi"));
    expect(result.current[0]).toBe(true);
    expect(trackPunjabiKeyboardEvent).toHaveBeenCalledWith("opened", { surface: "rename_pothi" });
  });

  it("reports nothing on turning it off", () => {
    const { result } = renderHook(() => usePunjabiKeyboard());
    act(() => result.current[2]("add_banis_search"));
    act(() => result.current[2]("add_banis_search"));
    expect(result.current[0]).toBe(false);
    expect(trackPunjabiKeyboardEvent).toHaveBeenCalledTimes(1);
  });

  it("reports each time it is turned on again", () => {
    const { result } = renderHook(() => usePunjabiKeyboard());
    act(() => result.current[2]("create_pothi_name"));
    act(() => result.current[2]("create_pothi_name"));
    act(() => result.current[2]("create_pothi_search"));
    expect(trackPunjabiKeyboardEvent).toHaveBeenCalledTimes(2);
    expect(trackPunjabiKeyboardEvent).toHaveBeenLastCalledWith("opened", {
      surface: "create_pothi_search",
    });
  });

  it("reports nothing when a sheet puts it down on reopening", () => {
    const { result } = renderHook(() => usePunjabiKeyboard());
    act(() => result.current[1](false));
    expect(trackPunjabiKeyboardEvent).not.toHaveBeenCalled();
  });
});
