import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  didCrashLastRun,
  logError,
  logMessage,
  setCustomKey,
} from "../../common/firebase/crashlytics";

// Why the last process died, according to the system rather than to us.
//
// Crashlytics can only describe a death it was alive to witness. When Android's
// Low Memory Killer reclaims the app there is no crash and no report at all, so
// a phone losing the app every session looks exactly like one that never opened
// it. That gap is why a cluster of SIGSEGVs inside libart.so and
// libart-compiler.so cannot currently be explained: every one of them lands on
// Android 11, on a 2-4GB device, in the Reader, with under 150MB free, which is
// equally consistent with the app corrupting memory and with the OS killing a
// perfectly healthy app. The two have opposite fixes.
//
// ApplicationExitInfo settles it. The system's own verdict distinguishes
// LOW_MEMORY from CRASH_NATIVE, and it carries the process's real footprint at
// the moment it died — Crashlytics only knows free DEVICE memory, which cannot
// separate "this phone was busy" from "this app used its budget".

const SEEN_KEY = "@diagnostics/lastExitTimestamp";

/**
 * Exits worth a report. A normal EXIT_SELF or USER_REQUESTED is the app closing
 * as designed and would be pure noise; the point of this is the deaths nobody
 * currently sees.
 */
const NOTEWORTHY = new Set([
  "LOW_MEMORY",
  "CRASH_NATIVE",
  "ANR",
  "EXCESSIVE_RESOURCE_USAGE",
  "SIGNALED",
  "INITIALIZATION_FAILURE",
]);

const megabytes = (bytes) => (bytes > 0 ? `${Math.round(bytes / 1048576)}MB` : "unknown");

/**
 * Summarise one exit for the report title. Kept short and stable so Crashlytics
 * groups all low-memory kills together rather than one issue per device.
 */
export const describeExit = (exit) => `App process died: ${exit.reasonName}`;

const isoTime = (timestamp) => {
  const time = Number(timestamp);
  return time > 0 ? new Date(time).toISOString() : "unknown";
};

/**
 * The detail worth attaching. pss is the honest number for "how much memory was
 * this app actually holding", since it apportions shared pages. exit_time is
 * what pairs this report with the crash it explains: Crashlytics shows that
 * crash at the same moment, on the same installation.
 */
export const exitAttributes = (exit, afterCrash = false) => ({
  exit_reason: exit.reasonName,
  exit_time: isoTime(exit.timestamp),
  exit_after_crash: String(afterCrash),
  exit_pss: megabytes(exit.pss),
  exit_rss: megabytes(exit.rss),
  exit_importance: String(exit.importance),
  exit_status: String(exit.status),
  exit_description: String(exit.description || "").slice(0, 200),
  exit_tombstone: Array.isArray(exit.tombstone) ? exit.tombstone.slice(0, 4).join(" | ") : "",
});

/** One exit as a single log line, so every death is on record, reported or not. */
export const summariseExit = (exit) =>
  `${exit.reasonName} at ${isoTime(exit.timestamp)} pss=${megabytes(exit.pss)} importance=${
    exit.importance
  }`;

/**
 * Report any newly-recorded exits, once each.
 *
 * The system keeps a rolling history, so every launch would otherwise re-report
 * the same deaths. The newest timestamp already reported is remembered and only
 * records newer than it are sent.
 *
 * Every new exit goes into the log, whatever its reason, together with whether
 * Crashlytics saw the previous run crash, so a report never has to be inferred
 * from silence. An exit is filed as an issue when its reason is one worth
 * fixing. If the previous run crashed and no record explains it (nothing
 * noteworthy, and no Java CRASH, which Crashlytics already reports in full),
 * the newest exit is filed anyway: the system has classified that crash in a
 * way this list does not expect, and that is itself what needs seeing.
 *
 * Never throws: a diagnostic that can break a launch is worse than no
 * diagnostic at all. That includes reading the native module, which on Android
 * 9 and 10 used to throw from the property access itself.
 */
export const reportRecentExits = async () => {
  if (Platform.OS !== "android") return 0;

  try {
    const native = NativeModules.ExitReasons;
    if (!native?.getRecentExits) return 0;

    const exits = await native.getRecentExits(10);
    if (!Array.isArray(exits) || exits.length === 0) return 0;

    const raw = await AsyncStorage.getItem(SEEN_KEY);
    const lastSeen = Number(raw) || 0;
    const fresh = exits
      .filter((e) => Number(e.timestamp) > lastSeen)
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    if (fresh.length === 0) return 0;

    // Remember the newest BEFORE reporting. A crash midway through reporting
    // would otherwise replay the whole history on the next launch.
    await AsyncStorage.setItem(SEEN_KEY, String(Number(fresh[0].timestamp) || lastSeen));

    const crashedLastRun = await didCrashLastRun();
    const crashed = crashedLastRun ? "yes" : "no";
    const summary = fresh.map(summariseExit).join("; ");
    logMessage(`Previous exits (${fresh.length}, crashed last run: ${crashed}): ${summary}`);
    const unexplained =
      crashedLastRun &&
      !fresh.some((e) => NOTEWORTHY.has(e.reasonName) || e.reasonName === "CRASH");

    let reported = 0;
    fresh.forEach((exit, index) => {
      if (!NOTEWORTHY.has(exit.reasonName) && !(unexplained && index === 0)) return;
      if (Array.isArray(exit.tombstone)) {
        exit.tombstone.forEach((line) => logMessage(`tombstone: ${line}`));
      }
      setCustomKey(exitAttributes(exit, crashedLastRun));
      // An error, not a breadcrumb: these are the deaths that currently leave
      // no trace, and they need to be countable and groupable on their own.
      logError(new Error(describeExit(exit)));
      reported += 1;
    });
    return reported;
  } catch (error) {
    logMessage(`Could not read process exit reasons: ${error?.message || error}`);
    return 0;
  }
};

export default reportRecentExits;
