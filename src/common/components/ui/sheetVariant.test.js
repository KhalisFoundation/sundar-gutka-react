import fs from "fs";
import path from "path";

// The Settings chooser is the one sheet on the old, flush presentation: a
// centred title over a rule, rows edge to edge. Every other sheet in
// the app — the Dashboard's, the audio settings, the time picker — stays on the
// floating default.
//
// Both the variant and the colours behind it are declared, not inlined, so a
// future theme changes one registry rather than a screen. These tests hold that
// line: a second caller of either would silently spread the Settings look.

const SRC = path.join(__dirname, "..", "..", "..");

const sourceFiles = () => {
  const out = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(full);
        return;
      }
      if (!/\.(js|jsx)$/.test(entry.name) || /\.test\./.test(entry.name)) return;
      out.push({
        rel: path.relative(SRC, full).split(path.sep).join("/"),
        text: fs.readFileSync(full, "utf8"),
      });
    });
  };
  walk(SRC);
  return out;
};

describe("the flush sheet presentation is scoped to Settings", () => {
  it("is passed by the Settings choosers and nothing else", () => {
    const callers = sourceFiles()
      .filter(({ text }) => /variant="flush"/.test(text))
      .map(({ rel }) => rel)
      .sort();
    // The single-choice chooser every settings row opens; Translations, which
    // is multi-select so it cannot use SelectSheet but must look identical to
    // it; and the pothi overflow, which is the same thing — a short list of
    // actions in edge-to-edge `Row`s with dividers.
    expect(callers).toEqual([
      "FolderScreen/FolderScreen.jsx",
      "Settings/components/comon/SelectSheet.jsx",
      "Settings/components/translation.jsx",
    ]);
  });

  it("is the only subtree scoped to a screen palette", () => {
    // The provider is how a sheet gets its own colours; a second user of it
    // would carry the Settings sheet's colours somewhere else.
    const users = sourceFiles()
      .filter(({ rel }) => rel !== "theme/ScreenRolesProvider.jsx")
      .filter(({ text }) => /<ScreenRolesProvider/.test(text))
      .map(({ rel }) => rel);
    // Sheet scopes itself for the flush variant. The four pothi sheets scope
    // themselves because they open from Home and the Reader, which carry no
    // screen palette — without this the same sheet was navy from Settings and
    // a bare semantic grey everywhere else.
    //
    // The Bani Length help dialog is the same case for the same reason: the
    // first-run screen carries no palette either, so its OK button fell back
    // from `ctaFill` to `primary` — the bottom nav bar's navy — and measured
    // 1.3:1 on the dialog's near-black card in dark mode.
    //
    // The sheet grab bar is the opposite case: it clears the scope, so every
    // sheet's bar is the app theme's one colour whatever palette it sits in.
    expect(users.sort()).toEqual([
      "Pothi/components/AddBanisSheet.jsx",
      "Pothi/components/AddToPothiSheet.jsx",
      "Pothi/components/CreatePothiSheet.jsx",
      "Pothi/components/PothiActionsSheet.jsx",
      "common/components/BaniLengthSelector/BaniLengthSelector.jsx",
      "common/components/ui/Sheet.jsx",
      "common/components/ui/sheetDrag.jsx",
    ]);
  });

  it("defaults to the floating presentation", () => {
    const sheet = fs.readFileSync(path.join(__dirname, "Sheet.jsx"), "utf8");
    expect(sheet).toContain('variant = "floating"');
    // The handle, the body gap and the panel padding all key off one flag, so
    // there is no way to end up half-flush.
    expect(sheet).toContain('const flush = variant === "flush"');
  });
});
