/* eslint-env jest */
import fs from "fs";
import path from "path";
import { trackPothiEvent } from "@common";
import reportPothiEmptied from "./reportPothiEmptied";

jest.mock("@common", () => ({ trackPothiEvent: jest.fn() }));

beforeEach(() => trackPothiEvent.mockClear());

describe("reportPothiEmptied", () => {
  it("reports a pothi that had banis and is left with none", () => {
    expect(reportPothiEmptied(5, 0, "folder_screen")).toBe(true);
    expect(trackPothiEvent).toHaveBeenCalledWith("emptied", { size: 5, surface: "folder_screen" });
  });

  it("stays quiet when banis are left", () => {
    expect(reportPothiEmptied(5, 2, "folder_screen")).toBe(false);
    expect(trackPothiEvent).not.toHaveBeenCalled();
  });

  // Closing a sheet over a pothi that was already empty is not emptying it.
  it("stays quiet for a pothi that was already empty", () => {
    expect(reportPothiEmptied(0, 0, "add_banis_sheet")).toBe(false);
    expect(trackPothiEvent).not.toHaveBeenCalled();
  });

  it("stays quiet when there is nothing to compare", () => {
    expect(reportPothiEmptied(undefined, 0, "add_banis_sheet")).toBe(false);
    expect(trackPothiEvent).not.toHaveBeenCalled();
  });
});

// Where it is called matters as much as what it does. The Add Banis sheet
// applies every tick live, so a pothi is momentarily empty whenever someone
// unticks everything before ticking something new. Reporting from the shared
// apply would count all of those as users emptying their pothis.
describe("where a pothi is reported emptied", () => {
  const SRC = path.join(__dirname, "..");
  const read = (rel) => fs.readFileSync(path.join(SRC, rel), "utf8");

  it("is never reported from the live, per-tick apply", () => {
    expect(read("Pothi/hooks/useSetPothiBanis.js")).not.toContain("reportPothiEmptied");
  });

  it.each([
    ["FolderScreen/FolderScreen.jsx", "folder_screen"],
    ["Pothi/components/AddBanisSheet.jsx", "add_banis_sheet"],
    ["DashboardScreen/components/EditBanisModal.jsx", "todays_nitnem"],
  ])("is reported where %s commits its edit", (file, surface) => {
    expect(read(file)).toContain(`"${surface}")`);
  });
});
