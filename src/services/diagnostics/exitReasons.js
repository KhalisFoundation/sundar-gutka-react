import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logError, logMessage, setCustomKey } from "../../common/firebase/crashlytics";

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
// Only deaths Crashlytics does not already report. Native crashes (via the NDK
// reporter) and ANRs are filed by Crashlytics itself, so reporting them here
// too would count each one twice, under a second issue.
const NOTEWORTHY = new Set([
  "LOW_MEMORY",
  "EXCESSIVE_RESOURCE_USAGE",
  "SIGNALED",
  "INITIALIZATION_FAILURE",
]);

// RunningAppProcessInfo.IMPORTANCE_PERCEPTIBLE. At or below it the app was
// something the user could see or hear: on screen, or playing audio in its
// foreground service. Above it (cached, background) Android reclaiming the
// process is routine housekeeping, and on 2-4GB phones it happens most
// sessions; reporting those would bury the deaths this module is looking for.
const IMPORTANCE_PERCEPTIBLE = 230;

const worthReporting = (exit) =>
  NOTEWORTHY.has(exit.reasonName) && Number(exit.importance) <= IMPORTANCE_PERCEPTIBLE;

const megabytes = (bytes) => (bytes > 0 ? `${Math.round(bytes / 1048576)}MB` : "unknown");

/**
 * Summarise one exit for the report title. Kept short and stable so Crashlytics
 * groups all low-memory kills together rather than one issue per device.
 */
export const describeExit = (exit) => `App process died: ${exit.reasonName}`;

/**
 * The detail worth attaching. pss is the honest number for "how much memory was
 * this app actually holding", since it apportions shared pages.
 */
// Named for what they are: the PREVIOUS process. Custom keys stay on every
// later report in the session, so a crash after this one still carries them,
// and under this name that reads as context, not as a claim about that crash.
export const exitAttributes = (exit) => ({
  previous_exit_reason: exit.reasonName,
  previous_exit_pss: megabytes(exit.pss),
  previous_exit_rss: megabytes(exit.rss),
  previous_exit_importance: String(exit.importance),
  previous_exit_status: String(exit.status),
  previous_exit_description: String(exit.description || "").slice(0, 200),
});

// The same figures as one log line. Logs are append-only and are read when the
// event is written, so the report filed right after this always carries its
// own exit's numbers, whatever the keys say by then.
const exitBreadcrumb = (exit) =>
  `Previous process exit: ${Object.entries(exitAttributes(exit))
    .map(([key, value]) => `${key.replace("previous_exit_", "")}=${value}`)
    .join(" ")}`;

/**
 * Report any newly-recorded exits, once each.
 *
 * The system keeps a rolling history, so every launch would otherwise re-report
 * the same deaths. The newest timestamp already reported is remembered and only
 * records newer than it are sent.
 *
 * Never throws: a diagnostic that can break a launch is worse than no
 * diagnostic at all.
 */
export const reportRecentExits = async () => {
  if (Platform.OS !== "android") return 0;
  const native = NativeModules.ExitReasons;
  if (!native?.getRecentExits) return 0;

  try {
    const fetched = await native.getRecentExits(10);
    const exits = Array.isArray(fetched) ? fetched : [];

    const raw = await AsyncStorage.getItem(SEEN_KEY);
    if (raw === null) {
      // First run with this code: Android still holds up to ten exits from the
      // previous version. Reporting them now would file old deaths under this
      // release, so take them as the baseline and report only what follows.
      // Saved even when there is nothing to baseline ("0"): otherwise a fresh
      // install with no recorded exits would skip this, and the next launch
      // would take its first session's deaths as the baseline instead.
      const newestKnown = exits.reduce((max, e) => Math.max(max, Number(e.timestamp) || 0), 0);
      await AsyncStorage.setItem(SEEN_KEY, String(newestKnown));
      logMessage(`Exit-reason baseline set (${exits.length} earlier exits not reported)`);
      return 0;
    }
    if (exits.length === 0) return 0;
    const lastSeen = Number(raw) || 0;
    const fresh = exits.filter((e) => Number(e.timestamp) > lastSeen);
    if (fresh.length === 0) return 0;

    // Remember the newest BEFORE reporting. A crash midway through reporting
    // would otherwise replay the whole history on the next launch.
    const newest = fresh.reduce((max, e) => Math.max(max, Number(e.timestamp) || 0), lastSeen);
    await AsyncStorage.setItem(SEEN_KEY, String(newest));

    let reported = 0;
    fresh.forEach((exit) => {
      if (!worthReporting(exit)) return;
      logMessage(exitBreadcrumb(exit));
      // An error, not a breadcrumb: these are the deaths that currently leave
      // no trace, and they need to be countable and groupable on their own.
      logError(new Error(describeExit(exit)));
      reported += 1;
    });

    // The keys describe ONE exit, so set them once, from the newest reported
    // exit. Android lists exits newest first, so setting them inside the loop
    // left the OLDEST one behind for the rest of the session.
    const newestReported = fresh
      .filter(worthReporting)
      .reduce(
        (latest, exit) =>
          !latest || Number(exit.timestamp) > Number(latest.timestamp) ? exit : latest,
        null
      );
    if (newestReported) setCustomKey(exitAttributes(newestReported));

    if (reported === 0) logMessage(`Previous exits were unremarkable (${fresh.length} seen)`);
    return reported;
  } catch (error) {
    logMessage(`Could not read process exit reasons: ${error?.message || error}`);
    return 0;
  }
};

export default reportRecentExits;
