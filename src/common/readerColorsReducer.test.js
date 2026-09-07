import { SET_READER_COLORS } from "./actions/actionTypes";
import rootReducer from "./reducer";

test("color preferences survive serialization, isolate modes, and reset without resetting other settings", () => {
  const initial = rootReducer(undefined, { type: "@@INIT" });
  const light = rootReducer(initial, {
    type: SET_READER_COLORS,
    mode: "light",
    value: { text: "#112233" },
  });
  const dark = rootReducer(light, {
    type: SET_READER_COLORS,
    mode: "dark",
    value: { vishraamLong: "#FFEEDD", primary: "red" },
  });
  const restored = rootReducer(JSON.parse(JSON.stringify(dark)), { type: "@@INIT" });
  expect(restored.readerColors).toEqual({
    light: { text: "#112233" },
    dark: { vishraamLong: "#ffeedd" },
  });
  const reset = rootReducer(restored, { type: SET_READER_COLORS, mode: "dark", value: {} });
  expect(reset.readerColors).toEqual({ light: { text: "#112233" }, dark: {} });
  expect(reset.fontFace).toBe(initial.fontFace);
  expect(reset.theme).toBe(initial.theme);
  expect(rootReducer(reset, { type: SET_READER_COLORS, mode: "system", value: {} })).toBe(reset);
});

test("upgrading a saved root state without colors adds an empty override slice", () => {
  const oldState = { ...rootReducer(undefined, { type: "@@INIT" }) };
  delete oldState.readerColors;
  expect(rootReducer(oldState, { type: "@@INIT" }).readerColors).toEqual({});
});
