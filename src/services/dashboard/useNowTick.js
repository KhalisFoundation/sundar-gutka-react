import { useEffect, useState } from "react";
import { AppState } from "react-native";

// How often the clock this hook hands out is refreshed.
//
// 30s against a label whose finest bucket is a minute: fine enough that "now"
// becomes "1 min ago" within half a minute of it being true, coarse enough to
// be invisible. There is no value in matching the second, because nothing the
// line can say changes that often.
const DEFAULT_INTERVAL_MS = 30 * 1000;

/**
 * A `Date.now()` that refreshes on a timer, so text derived from it stays true.
 *
 * ── Why this is needed at all ──────────────────────────────────────────────
 * An absolute timestamp ("19 Aug, 14:30") is correct forever with no re-render,
 * which is why the header could get away with rendering it once. A RELATIVE one
 * is wrong sixty seconds later.
 *
 * Nothing else would re-render it in time. The sync status store only notifies
 * when a push or pull is actually recorded, and pushes are debounced 20s, held
 * behind a 60s cooldown and mostly fire on backgrounding — so someone sitting
 * on the Dashboard reading would watch "now" stay "now" indefinitely. That is
 * strictly worse than the absolute time it replaced: it states something false
 * rather than something stale.
 *
 * ── Why it stops in the background ─────────────────────────────────────────
 * A timer that keeps firing behind a screen nobody is looking at is pure waste,
 * and re-renders a tree that is not on screen. Coming back to the foreground
 * refreshes immediately rather than waiting out the interval, so the first
 * frame the user sees is already right.
 */
export const useNowTick = (intervalMs = DEFAULT_INTERVAL_MS) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let timer = null;
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const start = () => {
      if (!timer) timer = setInterval(() => setNow(Date.now()), intervalMs);
    };

    start();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") {
        setNow(Date.now());
        start();
        return;
      }
      stop();
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [intervalMs]);

  return now;
};

export default useNowTick;
