import fs from "fs";
import path from "path";

// Today's Nitnem IS the Morning Nitnem pothi.
//
// It used to be a second, unrelated list: the Dashboard kept its own
// `todaysNitnem.selectedBaniIds`, seeded [2, 6, 4, 9, 21, 1], while the Morning
// Nitnem pothi held [2, 4, 6, 9, 10]. Editing one never touched the other, so
// the same user had two different Nitnems depending on which screen they were
// looking at.
//
// Source-level guards rather than render tests, because what is being protected
// is that there is ONE list — a fact about the files, not about any one render.

const HERE = __dirname;
const SRC = path.join(HERE, "..", "..");

const read = (file) => fs.readFileSync(file, "utf8");
const here = (name) => read(path.join(HERE, name));

/** Every .js/.jsx under src, so a reintroduced writer cannot hide in a new file. */
const sourceFiles = (dir = SRC) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });

describe("Today's Nitnem is the Morning Nitnem pothi", () => {
  it("reads the pothi rather than a list of its own", () => {
    const card = here("TodaysNitnem.jsx");
    expect(card).toContain('defaultPothi(state.pothis, "morning")');
    expect(card).not.toContain("state.todaysNitnem).selectedBaniIds");
  });

  it("edits that pothi through the shared apply, not a second diff", () => {
    const modal = here("EditBanisModal.jsx");
    expect(modal).toContain("useSetPothiBanis");
    expect(modal).toContain('defaultPothi(state.pothis, "morning")');
  });

  it("left no way to WRITE a separate nitnem bani set", () => {
    // The action and its type stay gone: a second writable list is how the two
    // Nitnems drifted apart in the first place.
    const offenders = sourceFiles().filter((file) =>
      /SET_NITNEM_BANIS|setNitnemBanis/.test(read(file))
    );
    expect(offenders).toEqual([]);
  });

  it("falls back to the defaults only when there is NO pothi, never over an emptied one", () => {
    // The sign-out bug: the purge resets `pothis`, and the only re-seed is a
    // hook on the Home tab, so the Dashboard showed "No banis in this pothi".
    // The defaults cover that — a pothi that does not exist. They must NOT
    // cover a pothi that exists and is empty: "unselect all, save" showed five
    // banis and looked unsaved, then dropped them the moment one was picked.
    const card = here("TodaysNitnem.jsx");
    expect(card).toContain("nitnemSelection(morning)");
    expect(card).not.toContain("DEFAULT_NITNEM_BANI_IDS");
    const selection = read(path.join(SRC, "common", "nitnem", "selection.js"));
    expect(selection).toContain(
      "if (!morning) return { ids: DEFAULT_NITNEM_BANI_IDS, emptied: false }"
    );
    expect(selection).toContain("emptied: ids.length === 0");
  });

  it("says 'no bani added' for an emptied pothi, in every language", () => {
    const card = here("TodaysNitnem.jsx");
    expect(card).toContain("if (emptied) doneSubtitle = STRINGS.NITNEM_NO_BANI_ADDED");
    const strings = read(path.join(SRC, "common", "localization.js"));
    expect(strings.match(/NITNEM_NO_BANI_ADDED:/g)).toHaveLength(6);
  });

  it("keeps the fallback READ-only — it never writes the pothi or the payload", () => {
    // A default must never be pushed over an account's real list.
    const sync = read(path.join(SRC, "services", "dashboard", "dashboardSync.js"));
    expect(sync).toContain('defaultPothi(state.pothis, "morning")');
    expect(sync).not.toContain("DEFAULT_NITNEM_BANI_IDS");
    expect(here("EditBanisModal.jsx")).not.toContain("DEFAULT_NITNEM_BANI_IDS");
  });

  it("keeps the heading, which is the one thing that does not change", () => {
    expect(here("TodaysNitnem.jsx")).toContain("STRINGS.TODAYS_NITNEM");
  });
});

// A finished Nitnem left two controls on the card that answered a tap with
// nothing: Continue was `disabled` but kept its filled accent so it still read
// as live, and Mark Done stayed enabled while dispatching a no-op. The row
// collapses to one live action instead.
describe("the Nitnem card offers no dead controls", () => {
  // Source files are CRLF; normalise so the block splits below can key on
  // indentation without every marker needing a \r.
  const card = () => here("TodaysNitnem.jsx").replace(/\r\n/g, "\n");

  /** The `actionsFor` branch that runs once every bani is ticked. */
  const completedBranch = () =>
    card().split("if (!firstIncomplete) {")[1].split("\n    return (")[0];

  it("drops Mark Done and Continue once there is nothing left to do", () => {
    expect(completedBranch()).not.toContain("STRINGS.MARK_DONE");
    expect(completedBranch()).not.toContain("STRINGS.CONTINUE");
    // Both still exist — for the state that can actually use them.
    expect(card()).toContain("STRINGS.MARK_DONE");
    expect(card()).toContain("STRINGS.CONTINUE");
  });

  it("shows a completion badge in their place, and no press handler on it", () => {
    expect(completedBranch()).toContain("STRINGS.NITNEM_COMPLETE");
    // A status, not a control: nothing to tap, so nothing can look tappable.
    expect(completedBranch()).not.toContain("onPress");
    expect(completedBranch()).not.toContain("Pressable");
  });

  it("shows no action row at all when the pothi is empty", () => {
    expect(card()).toContain("if (selectedBaniIds.length === 0) return null;");
  });

  // The header already reads 5/5 with "All done today" beside it. A third
  // statement of the same fact where an action used to be reads as breakage.
  it("does not repeat the all-done message under the ring", () => {
    const [, actions] = card().split("const actionsFor = () => {");
    expect(actions).not.toContain("ALL_DONE_TODAY");
  });
});

// Turning transliteration off writes ONLY `isTransliteration`:
// `transliterationLanguage` keeps its last value and the cached bani list is
// untouched (see Settings/components/transliteration.jsx). So a row that
// renders `translit` without consulting the toggle keeps showing the language
// last chosen, and nothing re-runs to correct it — which is why switching
// languages looked right in this sheet while Off did nothing at all.
describe("the Edit Banis sheet follows the transliteration setting", () => {
  const modal = () => here("EditBanisModal.jsx");

  it("shows the roman line only while transliteration is on", () => {
    expect(modal()).toContain("isTransliteration && b.translit");
  });

  it("reads the toggle, not just the language", () => {
    expect(modal()).toContain("state.isTransliteration");
  });

  // `getBaniList` picks the transliteration by ENGLISH/HINDI/SHAHMUKHI/IPA and
  // falls through to English for anything else. `state.language` is the
  // INTERFACE language ("DEFAULT"), so passing it rendered English under every
  // name whatever the user had chosen.
  it("resolves transliterations by the transliteration language", () => {
    expect(modal()).toContain("getBaniList(transliterationLanguage)");
    // The selector itself, not a mention of it in a comment.
    expect(modal()).not.toMatch(/=>\s*state\.language\b/);
  });
});

// Finishing the nitnem is the point of the card, and for a long time it was the
// one action on it that reported nothing: both completion controls dispatched
// and pushed with no analytics beside them. The data was safe in the local
// store, but the behavioural funnel showed people opening banis and never
// finishing one.
//
// Source-level again, for the same reason as everything above: what is being
// protected is that no completion path exists WITHOUT an event, which is a fact
// about the file rather than about one render.
describe("completing a nitnem is reported", () => {
  const card = () => here("TodaysNitnem.jsx");

  it("tracks the bulk Mark done press", () => {
    expect(card()).toMatch(
      /trackDashboardEvent\("nitnem_marked_done", \{ source: "mark_all", count: remaining \}\)/
    );
  });

  it("counts what was REMAINING, not the whole list", () => {
    // `selectedBaniIds.length` would re-count every bani already ticked and
    // inflate each bulk completion by whatever had been done beforehand.
    expect(card()).not.toContain("count: selectedBaniIds.length");
  });

  it("tracks a single tick as a completion of one", () => {
    expect(card()).toMatch(
      /trackDashboardEvent\("nitnem_marked_done", \{ source: "tick", count: 1 \}\)/
    );
  });

  // An un-tick is usually the 95%-scroll auto-detection being corrected. Filed
  // under the same event it would be summed as a completion, and the correction
  // itself — the signal worth having — would be invisible.
  it("files an un-tick as its own event, never as a completion", () => {
    expect(card()).toContain('if (isDone) trackDashboardEvent("nitnem_unmarked")');
  });

  it("leaves no completion dispatch without an event beside it", () => {
    const text = card();
    ["markNitnemDone", "toggleNitnemDone"].forEach((action) => {
      const at = text.indexOf(`actions.${action}(`);
      expect(at).toBeGreaterThan(-1);
      // The press handler that owns this dispatch, back to its own `onPress`.
      const handler = text.slice(text.lastIndexOf("onPress", at), at);
      expect(handler).toContain("trackDashboardEvent");
    });
  });
});

// Both events send only parameters already registered in GA4, which is why
// they needed no console work. A parameter GA4 has not been told about is still
// collected but cannot be used in any report. Pinned exactly, so adding one has
// to be a deliberate edit here — made after registering it.
describe("the nitnem events send only their known parameters", () => {
  const paramsSentWith = (event) => {
    // Escaped for the RegExp, not for the template literal: `\\(` is what leaves
    // a single backslash in the pattern string.
    const pattern = new RegExp(`trackDashboardEvent\\("${event}", \\{([^}]*)\\}`, "g");
    return [...here("TodaysNitnem.jsx").matchAll(pattern)].flatMap((match) =>
      [...match[1].matchAll(/([a-z_]+):/g)].map((param) => param[1])
    );
  };

  it("sends exactly source and count with nitnem_marked_done", () => {
    expect([...new Set(paramsSentWith("nitnem_marked_done"))].sort()).toEqual(["count", "source"]);
  });
});
