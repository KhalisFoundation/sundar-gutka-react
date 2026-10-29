import { getSheetTop } from "./SheetModal";

describe("SheetModal", () => {
  it("anchors a three-quarter sheet below a quarter-height blurred area", () => {
    expect(getSheetTop(0.75)).toBe("25%");
  });
});
