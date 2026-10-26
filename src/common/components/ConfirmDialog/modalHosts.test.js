/* eslint-env jest */
import fs from "fs";
import path from "path";

// A confirm raised from inside a Modal has to be made room for.
//
// On iOS a Modal is a UIViewController presented by the controller React
// resolves for its host view (RCTModalHostViewManager.m). `showConfirm`'s host
// normally lives at the app root, so it is presented by the ROOT controller —
// and while a sheet is open that controller is already presenting the sheet.
// UIKit refuses to present twice from one controller, so the dialog never
// appeared and the screen read as frozen. Android stacks Dialogs and hid it.
//
// There are two ways out, and this enforces that a component takes one of them
// whenever it both opens an overlay of its own and raises a confirm:
//
//   HOST IT   — mount a `ConfirmDialogHost` inside the overlay. The innermost
//               host answers, so the sheet presents the dialog itself and it
//               sits over the sheet exactly as it does on Android. Right when
//               the sheet STAYS open behind the dialog.
//   DEFER IT  — hold the follow-up until the sheet's window is gone, using the
//               Sheet's `onDismiss`. Right when the sheet is closing anyway: a
//               host inside it would be torn down with the sheet, taking the
//               dialog with it.

const SRC = path.join(__dirname, "..", "..", "..");

const walk = (dir, out = []) => {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)) out.push(full);
  });
  return out;
};

// Comments are stripped so the notes explaining this trap — which name every
// symbol below — cannot themselves satisfy the check.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const HOSTS = /<ConfirmDialogHost\b/;
const DEFERS = /\bonDismiss=\{/;

const offenders = walk(SRC)
  .map((file) => ({ file, code: stripComments(fs.readFileSync(file, "utf8")) }))
  .filter(({ code }) => /\bshowConfirm\s*\(|\buseDeletePothi\s*\(/.test(code))
  .filter(({ code }) => /<(Sheet|Overlay)\b/.test(code))
  .filter(({ code }) => !HOSTS.test(code) && !DEFERS.test(code))
  .map(({ file }) => path.relative(SRC, file).split(path.sep).join("/"));

it("never lets an overlay raise a confirm it has not made room for", () => {
  expect(offenders).toEqual([]);
});

// The three that had the bug, named so a rename or a move cannot quietly drop
// them out of the scan above.
describe.each([
  // These two keep their sheet open behind the dialog, so they host it.
  ["Settings/components/reminders/ReminderOptions/components/ReminderEditSheet.jsx", "host"],
  ["Pothi/components/PothiActionsSheet.jsx", "host"],
  // The folder overflow menu closes on the way in to every one of its actions —
  // two of which open another sheet rather than a confirm — so it defers all of
  // them instead.
  ["FolderScreen/FolderScreen.jsx", "defer"],
])("%s", (rel, strategy) => {
  const code = stripComments(fs.readFileSync(path.join(SRC, rel), "utf8"));

  it("still opens something from inside its own sheet", () => {
    expect(code).toMatch(/<Sheet\b/);
    expect(code).toMatch(/\bshowConfirm\s*\(|\buseDeletePothi\s*\(/);
  });

  it(`${strategy}s it, so iOS can present it`, () => {
    expect(code).toMatch(strategy === "host" ? HOSTS : DEFERS);
  });
});
