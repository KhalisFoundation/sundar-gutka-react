import fs from "fs";
import path from "path";

// The circle player's play/pause button is asymmetric on purpose.
//
//   playing -> PAUSE  : open the full player.
//     Pausing is the moment someone wants the controls — to scrub, change track
//     or close — so the full player comes to them instead of making them hunt
//     for it.
//
//   paused  -> RESUME : change nothing but the playback state.
//     They are settling back into listening, so the player must not grow,
//     expand or move under them. Re-arming the collapse timer here is what made
//     it flip into the pill form on resume.
//
// Asserted against the source rather than by rendering: the component owns a
// drag gesture, three animated values and a collapse timer, and driving all of
// that under jest would test the harness more than the rule.

const source = fs.readFileSync(path.join(__dirname, "MinimizePlayer.jsx"), "utf8");

const handler = source.slice(
  source.indexOf("const onPlayPausePress"),
  source.indexOf("// Widest the text panel")
);

describe("circle player play/pause", () => {
  it("captures the playing state BEFORE toggling it", () => {
    // handlePlayPause() flips the state, so reading `isPlaying` afterwards
    // would branch on the new value and invert both behaviours.
    const beforeToggle = handler.indexOf("const wasPlaying = isPlaying");
    const toggle = handler.indexOf("handlePlayPause()");
    expect(beforeToggle).toBeGreaterThanOrEqual(0);
    expect(beforeToggle).toBeLessThan(toggle);
  });

  it("opens the full player when pausing", () => {
    expect(handler).toMatch(/if \(wasPlaying\)/);
    expect(handler).toMatch(/setMinimized\(false, "pause"\)/);
  });

  it("does nothing else when resuming", () => {
    // Everything after the pause branch returns; no expand, no collapse timer.
    const afterReturn = handler.slice(handler.indexOf("return;"));
    expect(afterReturn).not.toMatch(/armCollapse\(\)/);
    expect(afterReturn).not.toMatch(/setForm\(/);
  });

  it("opens the full player WITHOUT raising the Reader's chrome", () => {
    // Pausing asks for the controls, not the nav bar and header.
    const pauseBranch = handler.slice(handler.indexOf("if (wasPlaying)"));
    expect(pauseBranch).toMatch(/onHideBars\(\)/);
  });
});

// The pill body is the OTHER way into the full player, and it carries the same
// rule. This is the whole reason the two paths behaved differently: pausing
// always asked for the chrome to stay down, while tapping the pill called
// setIsMinimized and nothing else, so nothing kept the bars away.
describe("tapping the mini player", () => {
  const open = source.slice(
    source.indexOf("const openFullPlayer"),
    source.indexOf("// Widest the text panel")
  );

  it("opens the full player and keeps the bars down", () => {
    expect(open).toMatch(/setMinimized\(false, "mini_tap"\)/);
    expect(open).toMatch(/onHideBars\(\)/);
  });

  it("is what the pill body is wired to", () => {
    expect(source).toMatch(/onPress=\{openFullPlayer\}/);
    // No path left that opens the player without saying anything about the bars.
    expect(source).not.toMatch(/setIsMinimized\(/);
  });
});

describe("a tap on the bani expands the circle player", () => {
  // Reaching the pill from the circle must not depend on what state the pill
  // happens to be in. Toggling meant a tap while already expanded collapsed it.
  const tapEffect = source.slice(
    source.indexOf("// A tap anywhere in the bani WebView"),
    source.indexOf("}, [tapTick, setForm]);")
  );

  it("expands rather than toggling", () => {
    expect(tapEffect).toMatch(/setForm\(true, "reader_tap"\)/);
    expect(tapEffect).not.toMatch(/!prev/);
  });
});

// Two things shrink the pill and two grow it, and each is a conversion counted
// exactly once, because there is only one way to change the form.
describe("mini <-> micro conversions", () => {
  it("shrinks after five seconds of stillness", () => {
    expect(source).toMatch(/COLLAPSE_DELAY_MS = 5000/);
    expect(source).toMatch(/setForm\(false, "idle"\), COLLAPSE_DELAY_MS/);
  });

  it("shrinks on a scroll down", () => {
    const effect = source.slice(
      source.indexOf("// Scrolling DOWN shrinks"),
      source.indexOf("// When the nav bar")
    );
    expect(effect).toMatch(/setForm\(false, "scroll_down"\)/);
    // Every counter starts at 0 and the effect runs on mount; without the guard
    // the player would collapse the instant it appeared.
    expect(effect).toMatch(/scrollInitRef\.current/);
  });

  it("grows again when the bars come back", () => {
    expect(source).toMatch(/setForm\(true, "scroll_up"\)/);
  });

  it("has exactly one path between the two forms", () => {
    // Anything calling setIsExpanded directly would change the form without
    // recording it, which is how the analytics would drift from the UI.
    expect(source.match(/setIsExpanded\(/g) ?? []).toHaveLength(1);
    const funnel = source.slice(
      source.indexOf("const setForm"),
      source.indexOf("const armCollapse")
    );
    expect(funnel).toMatch(/trackPlayerForm\(expanded \? "mini" : "micro", trigger\)/);
    expect(funnel).toMatch(/if \(isExpandedRef\.current === expanded\) return;/);
  });

  it("is a circle in the micro form, not a rounded box", () => {
    // Padding and glyph are rounded to the device scale independently, so
    // summing them came out a pixel or two wide at some sizes.
    const at = source.indexOf("const microStyle");
    const micro = source.slice(at, source.indexOf("return (", at));
    expect(micro).toMatch(/width: metrics\.pillHeight/);
    expect(micro).toMatch(/paddingHorizontal: 0/);
  });
});

// The mini/full pair is funnelled the same way, one level up.
describe("mini <-> full conversions", () => {
  const controlBar = fs.readFileSync(path.join(__dirname, "AudioControlBar", "index.jsx"), "utf8");

  it("goes through one deduped, tracked path", () => {
    expect(controlBar).toMatch(/if \(isMinimizedRef\.current === minimized\) return;/);
    expect(controlBar).toMatch(/trackPlayerForm\(minimized \? "mini" : "full", trigger\)/);
  });

  it("records the collapse control as its own trigger", () => {
    expect(controlBar).toMatch(/setMinimized\(true, "control"\)/);
  });
});

// Dragging the circle and dragging the pill are the same gesture through the
// same PanResponder, but they did not behave the same way. Two reasons, both
// fixed here: the release clamp used a different footprint for each form, and
// only the pill had a timer that could fire mid-drag.
describe("dragging behaves the same in both forms", () => {
  const release = source.slice(
    source.indexOf("onPanResponderRelease"),
    source.indexOf("// ── Progress arc")
  );

  it("clamps by one footprint, not by whichever form it is in", () => {
    // It was `isExpandedRef.current ? w : w + delta` — the circle was held a
    // whole text panel inside the edge while the pill got no slack at all, so
    // the same drag brought one back and not the other.
    expect(release).toMatch(
      /const expandedW = Math\.max\(w, metricsRef\.current\.pillChrome \+ delta\)/
    );
    expect(release).not.toMatch(/expandedW = isExpandedRef\.current/);
  });

  it("springs back to the clamped position when dragged out of bounds", () => {
    expect(release).toMatch(/if \(dx !== 0 \|\| dy !== 0\)/);
    expect(release).toMatch(/Animated\.spring\(pan/);
  });
});

describe("the drag floor", () => {
  const metrics = source.slice(
    source.indexOf("dragSideMargin:"),
    source.indexOf("}, [scale, screenH")
  );

  it("clears the system navigation bar", () => {
    // `screenH` is the whole window in edge-to-edge, bars included, so a plain
    // percentage of it knows nothing about the bar the pill can be lost behind.
    expect(metrics).toMatch(/insetBottom \+ Math\.round\(16 \* scale\)/);
  });

  it("never drops below the clearance it already had", () => {
    // The inset is a FLOOR under the old value, not a replacement for it.
    expect(metrics).toMatch(/dragBottomMargin: Math\.max\(/);
    expect(metrics).toMatch(/Math\.min\(110, Math\.max\(64, Math\.round\(screenH \* 0\.05\)\)\)/);
  });
});

describe("a drag holds the pill open", () => {
  it("restarts the idle countdown when the finger goes down", () => {
    const grant = source.slice(
      source.indexOf("onPanResponderGrant"),
      source.indexOf("onPanResponderMove")
    );
    // Armed once on expansion and never restarted, the countdown measured time
    // since EXPANSION rather than since the last touch, so a drag begun four
    // seconds in collapsed under the finger.
    expect(grant).toMatch(/if \(isExpandedRef\.current\) armCollapseRef\.current\(\)/);
  });

  it("and restarts it again from the moment it is let go", () => {
    const release = source.slice(
      source.indexOf("onPanResponderRelease"),
      source.indexOf("viewRef.current?.measureInWindow")
    );
    expect(release).toMatch(/if \(isExpandedRef\.current\) armCollapseRef\.current\(\)/);
  });

  it("reaches armCollapse through a ref, since the responder is built once", () => {
    expect(source).toMatch(/armCollapseRef\.current = armCollapse/);
  });
});

// The pill does not live in a fixed frame. It rides inside the Reader's audio
// wrapper, which is lifted while the bars are up and dropped when they hide —
// and touching the player is what restarts the countdown that hides them.
describe("the drag floor reserves the drop that is coming", () => {
  const release = source.slice(
    source.indexOf("onPanResponderRelease"),
    source.indexOf("// \u2500\u2500 Progress arc")
  );

  it("adds the wrapper's pending drop to the floor", () => {
    // Without it, a pill parked on the floor with the bars up was exactly
    // barsDrop below it four seconds later — under the system navigation bar
    // and off the screen, with nothing to re-run the clamp.
    expect(release).toMatch(/const BOTTOM = dragBottomMargin \+ dropReserveRef\.current/);
  });

  it("reserves nothing when the bars are already down", () => {
    // Nothing left to fall, so the pill keeps its full range.
    expect(source).toMatch(/dropReserveRef\.current = isNavBarVisible \? barsDrop : 0/);
  });

  it("reaches the value through a ref, since the responder is built once", () => {
    const grantToRelease = source.slice(0, source.indexOf("onPanResponderGrant"));
    expect(grantToRelease).toMatch(/const dropReserveRef = useRef\(0\)/);
  });

  it("re-renders when the drop changes, so the ref cannot go stale", () => {
    expect(source).toMatch(/prevProps\.barsDrop !== nextProps\.barsDrop/);
  });
});

// The player parks wherever it is dropped — the old bottom strip is gone.
// Only the system chrome bounds it: status bar above, navigation bar and
// progress track below.
describe("free vertical placement", () => {
  const release = source.slice(
    source.indexOf("onPanResponderRelease"),
    source.indexOf("// ── Progress arc")
  );

  it("clamps the ceiling at the status bar, not at a bottom strip", () => {
    expect(source).not.toMatch(/dragStripHeight/);
    expect(release).toMatch(/const TOP = dragTopMargin \+ liftReserveRef\.current/);
  });

  it("keeps the parked player clear of the status bar", () => {
    expect(source).toMatch(/dragTopMargin: insetTop \+ Math\.round\(16 \* scale\)/);
  });

  it("reserves the wrapper's coming lift, mirroring the floor's drop reserve", () => {
    // Parked at the ceiling with the bars down, the wrapper's lift when they
    // return would carry the player under the status bar — same failure as the
    // floor's, in the other direction.
    expect(source).toMatch(/liftReserveRef\.current = isNavBarVisible \? 0 : barsDrop/);
  });
});

// The Reader is the one that knows the distance.
describe("the Reader hands down its own lift", () => {
  const reader = fs.readFileSync(path.join(__dirname, "..", "..", "..", "index.jsx"), "utf8");

  it("passes the gap between the lifted and resting positions", () => {
    expect(reader).toMatch(/barsDrop=\{navChromeHeight - chromeRestLift\}/);
  });

  it("measures that gap against where the wrapper actually rests", () => {
    // `chromeRestLift` is the resting end of the very animation this drop
    // describes, and it is NOT the raw inset — iOS caps it so the progress
    // track does not float a band of blank page above the screen bottom. Any
    // drift between the two ends leaves the pill's drag floor reserving a drop
    // the wrapper never makes, which is how a parked pill left the screen with
    // the bars in the first place.
    expect(reader).toMatch(/toValue: isHeader \? -navChromeHeight : -chromeRestLift/);
    expect(reader).toMatch(/toValue: isHeader \? -\(navChromeHeight - 5\) : -chromeRestLift/);
  });
});

// The reading-progress track is a thin bar pinned along the bottom of the
// Reader, and the player's resting spot is already above it. Nothing enforced
// that during the drag itself.
describe("the drag cannot go below the resting spot", () => {
  const move = source.slice(
    source.indexOf("onPanResponderMove"),
    source.indexOf("onPanResponderTerminationRequest")
  );

  it("clamps downward travel while the finger is still down", () => {
    // A bare Animated.event tracks the finger anywhere and only springs back on
    // release, so the player could be parked under the progress track for the
    // length of the drag.
    expect(move).not.toMatch(/Animated\.event/);
    expect(move).toMatch(/Math\.min\(g\.dy, -lastOffset\.current\.y\)/);
  });

  it("leaves sideways and upward travel free", () => {
    expect(move).toMatch(/pan\.x\.setValue\(g\.dx\)/);
  });

  it("books the clamped travel on release, not the finger's raw travel", () => {
    // The move handler stops the pill at the floor while the finger keeps
    // going. Release used to record the raw g.dy anyway, so the spring's
    // target — built from lastOffset — animated the pill down to a position
    // the drag itself had refused to draw, just under the progress track.
    const release = source.slice(
      source.indexOf("onPanResponderRelease"),
      source.indexOf("viewRef.current?.measureInWindow")
    );
    expect(release).toMatch(/const clampedDy = Math\.min\(g\.dy, -lastOffset\.current\.y\)/);
    expect(release).toMatch(/y: lastOffset\.current\.y \+ clampedDy/);
    expect(release).not.toMatch(/y: lastOffset\.current\.y \+ g\.dy/);
  });

  it("measures from the offset the grant handler set", () => {
    const grant = source.slice(
      source.indexOf("onPanResponderGrant"),
      source.indexOf("onPanResponderMove")
    );
    // The clamp reads the resting position as 0, which only holds because the
    // offset is set and the value zeroed together here.
    expect(grant).toMatch(/pan\.setOffset\(lastOffset\.current\)/);
    expect(grant).toMatch(/pan\.setValue\(\{ x: 0, y: 0 \}\)/);
  });
});
