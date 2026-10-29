import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import PropTypes from "prop-types";
import { formatFullDate } from "@common/dateLocale";
import {
  CustomText,
  STRINGS,
  logError,
  logMessage,
  openInAppBrowser,
  showInfoToast,
  trackDashboardEvent,
} from "@common";
import { getDailyVaak } from "../../services/dashboard";
import { OfflineError } from "../../services/dashboard/connectivity";
import { istDateKey } from "../../services/dashboard/dailyVaak";
import { UnavailableError } from "../../services/dashboard/dataFailures";
import DashboardCard from "./DashboardCard";
import useDashboardTheme from "./dashboardTheme";
import OfflineNotice from "./OfflineNotice";
import SkeletonBlock from "./SkeletonBlock";
import useRefetchOnReconnect from "./useRefetchOnReconnect";

// "2026-07-25" (IST calendar date) → localised "Saturday, 25 July 2026". Built
// from the Y/M/D parts so the weekday is the IST date's weekday regardless of
// the device timezone (no UTC-parse drift).
const formatIstDate = (isoDate) => {
  const [y, m, d] = String(isoDate).split("-").map(Number);
  if (!y || !m || !d) return "";
  return formatFullDate(new Date(y, m - 1, d));
};

const ChevronRight = ({ color }) => (
  <Svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
ChevronRight.propTypes = { color: PropTypes.string.isRequired };

// Always open the live daily Hukamnama page on SikhiToTheMax — the same page the
// card's content mirrors.
const HUKAMNAMA_URL = "https://www.sikhitothemax.org/hukamnama";

// Floor on how long the refresh control spins. A cached or fast answer returns
// in a few dozen milliseconds, which is below the threshold at which motion
// registers at all — the button appeared to do nothing.
const MIN_SPIN_MS = 700;

// How often the card looks again while it is showing something other than
// today's hukamnama. Only ever runs during that wait, so it costs nothing for
// the rest of the day.
const AUTO_RECHECK_MS = 10 * 60 * 1000;

const TodaysVaak = ({
  refreshKey = 0,
  embedded = false,
  reloadNonce = 0,
  onLoadingChange = () => {},
}) => {
  const { gold, theme, palette } = useDashboardTheme();
  // The card under these is a deep navy panel in BOTH themes, so the text on
  // it is light in both. Following the theme's text roles here put near-black
  // Gurbani on a navy card in light mode.
  const gurmukhiColor = palette.onVaakCard;
  const translationColor = palette.onVaakCardMuted;
  const gurmukhiFont = theme.typography.fonts.gurbaniHeavy;
  const [vaak, setVaak] = useState(null);
  // null | "offline" | "unavailable" — see the catch below for why the two are
  // not one flag.
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [autoNonce, setAutoNonce] = useState(0);

  // Both counters mean "the user asked for this": skip the cache, spin the
  // control, and say what came of it.
  const manualCount = reloadNonce + retryNonce;
  const lastManualRef = useRef(manualCount);
  // The self-check does skip the cache too — otherwise it would re-read the
  // stand-in it is trying to replace — but silently: no spinner, no toast.
  const lastAutoRef = useRef(autoNonce);

  // What is currently on screen, so a manual refresh can tell whether it
  // actually brought anything new. A ref rather than reading `vaak`, so the
  // fetch effect does not re-run every time it changes.
  const shownRef = useRef(null);
  useEffect(() => {
    shownRef.current = vaak;
  }, [vaak]);

  useEffect(() => {
    let active = true;
    let settleTimer = null;
    let verdict = null;
    const manual = manualCount !== lastManualRef.current;
    lastManualRef.current = manualCount;
    const auto = autoNonce !== lastAutoRef.current;
    lastAutoRef.current = autoNonce;
    // Both bypass the cache; only the manual one is announced.
    const force = manual || auto;
    const startedAt = Date.now();
    if (manual) {
      setRefreshing(true);
      // Drop the previous verdict for the duration. Leaving "not available yet"
      // on screen while we are in the middle of finding out contradicts the
      // spinner next to it, and makes a refresh that is working look inert.
      setProblem(null);
    }
    // The vaak is the real daily Hukamnama — require connectivity so we never
    // present stale/placeholder lines as if they were today's official vaak.
    getDailyVaak({ requireOnline: true, force })
      .then((v) => {
        if (!active) return;
        setProblem(null);
        setVaak(v);
        if (!manual) return;
        // A refresh that finds nothing new changes NOTHING on screen, so
        // without this the control reads as broken. Say which of the two
        // happened rather than leaving the user to guess.
        //
        // Held until the spinner stops rather than shown here: the answer
        // usually arrives in a few dozen milliseconds, so announcing it on
        // arrival puts the verdict on screen before the control has visibly
        // done anything, which reads as the app ignoring the tap.
        const prev = shownRef.current;
        const same = prev && prev.istDate === v.istDate && prev.shabadId === v.shabadId;
        verdict = same ? STRINGS.VAAK_ALREADY_LATEST : STRINGS.VAAK_UPDATED;
      })
      .catch((err) => {
        if (!active) return;
        // Never fabricate a hukamnama — but do not misreport why there isn't
        // one either. Being offline is the user's to fix; the source not having
        // published today's vaak yet is not, and telling someone with a working
        // connection to turn on the internet is simply false.
        const isOffline = err instanceof OfflineError;
        // Neither is a fault of ours: whatever failed behind an "unavailable"
        // was already logged where it happened, so recording it again here
        // only filed the same outage twice.
        if (err instanceof UnavailableError) logMessage(err.message);
        else if (!isOffline) logError(err);
        setProblem(isOffline ? "offline" : "unavailable");
      })
      .finally(() => {
        if (!active) return;
        const settle = () => {
          settleTimer = null;
          setLoading(false);
          setRefreshing(false);
          if (verdict) showInfoToast(verdict);
        };
        // A cached-or-fast answer returns in well under the blink of an eye, so
        // the spinner would appear and vanish before it registered as motion —
        // which reads as a dead button. Hold it long enough to be seen.
        const remaining = manual ? MIN_SPIN_MS - (Date.now() - startedAt) : 0;
        if (remaining > 0) settleTimer = setTimeout(settle, remaining);
        else settle();
      });
    return () => {
      active = false;
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [refreshKey, manualCount, autoNonce]);

  // Reported upward so whichever refresh control is on screen can spin and
  // refuse repeat taps — same contract as RandomShabad's shuffle.
  const busy = loading || refreshing;
  useEffect(() => {
    onLoadingChange(busy);
  }, [busy, onLoadingChange]);

  // Showing the day before, because today's has not been read at the darbar yet.
  const showingOlderDay = !!vaak?.istDate && vaak.istDate !== istDateKey();

  // Look again on our own while what we hold is not today's — a stand-in from
  // the day before, or nothing at all. The hukamnama is read around 05:00–05:30
  // IST and published some unknown while after, so rather than leave the user
  // tapping refresh to find out, the card watches for it and swaps itself over.
  // The manual control stays for the impatient; it should rarely be needed.
  //
  // Deliberately not while OFFLINE: there is nothing to fetch, and a timer
  // firing into a dead network just burns battery. The reconnect edge below
  // covers that case instead.
  const awaitingToday = showingOlderDay || problem === "unavailable";
  const recheck = useCallback(() => setAutoNonce((n) => n + 1), []);
  useEffect(() => {
    if (!awaitingToday) return undefined;
    const id = setInterval(recheck, AUTO_RECHECK_MS);
    return () => clearInterval(id);
  }, [awaitingToday, recheck]);

  // Connectivity coming back is the other moment worth another look — for the
  // offline case it is the ONLY one, since nothing above is running then. Same
  // silent path as the timer: no spinner, no toast, the card just fills in.
  useRefetchOnReconnect(showingOlderDay || !!problem, recheck);

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

  // The skeleton also covers a refresh that has nothing to sit behind it — one
  // taken from the error state, where clearing the message would otherwise
  // leave an empty card until the request lands.
  if (loading || (refreshing && !vaak)) {
    const skeleton = (
      <View style={styles.skeletonInner}>
        <SkeletonBlock style={styles.lineSkeletonWide} />
        <SkeletonBlock style={styles.lineSkeletonWide} />
        <SkeletonBlock style={styles.lineSkeletonNarrow} />
      </View>
    );
    if (embedded) return skeleton;
    return (
      <View style={styles.wrap}>
        <DashboardCard style={styles.card}>{skeleton}</DashboardCard>
      </View>
    );
  }

  if (problem) {
    const isOffline = problem === "offline";
    return (
      <OfflineNotice
        compact={embedded}
        variant={isOffline ? "offline" : "waiting"}
        message={isOffline ? STRINGS.VAAK_OFFLINE : STRINGS.VAAK_UNAVAILABLE}
        onRetry={retry}
      />
    );
  }

  // No shabadId (e.g. a degraded backend fallback) → hide the Ang·Raag + Read
  // row, same guard Random Shabad uses.
  const showFooter = !!vaak?.shabadId;

  const body = (
    <>
      {/* When embedded in the Shabad/Vaak tab card the active tab is the title. */}
      {embedded ? null : (
        <CustomText style={[styles.cardTitle, { color: gold }]}>
          {STRINGS.TODAYS_VAAK.toUpperCase()}
        </CustomText>
      )}
      {/* Hukamnama date — shown in IST (the day rolls over at Sri Darbar Sahib),
          localised to the app language at render (so a language switch applies
          without waiting for the next day's fetch). Falls back to a legacy
          pre-formatted dateLabel from an older cached vaak. */}
      {vaak?.istDate || vaak?.dateLabel ? (
        <CustomText style={[styles.dateLine, { color: translationColor }]}>
          {/* Before the darbar has read the new day's hukamnama there is no
              today's to show, so this is the day before. The date already says
              so, but a date alone reads as an error rather than as an
              explanation — name it, so nobody takes it for today's. */}
          {showingOlderDay ? `${STRINGS.VAAK_LATEST_AVAILABLE} · ` : ""}
          {`${vaak?.istDate ? formatIstDate(vaak.istDate) : vaak.dateLabel} · IST`}
        </CustomText>
      ) : null}
      {/* dailyVaak.js already filters the heading verse out and picks exactly
          2 lines, matching Random Shabad's short preview. */}
      {(vaak?.lines ?? []).map((line, i) => (
        <CustomText key={i} style={[styles.gurmukhi, { color: gurmukhiColor, fontFamily: gurmukhiFont }]}>
          {line}
        </CustomText>
      ))}
      {/* Gurbani only on this card — the translation belongs in the Reader,
          where the user's own translation settings apply. */}

      {showFooter ? (
        <>
          <View style={[styles.footerDivider, { backgroundColor: translationColor }]} />
          <View style={styles.footer}>
            {/* No line cap — same reason as Random Shabad's identical footer:
                one line clipped "Ang 1234 · Raag Gauri" as soon as the OS text
                size grew, and the Read link beside it does not shrink. */}
            {/* The card's OWN muted ink, not the screen's. `mutedText` is paired with
                the light page behind this card, so on the card itself it fell to
                2.42:1 in light mode — below AA, and the reason the Ang line was
                hard to read. `onVaakCardMuted` is the same role measured against
                this card, and the pair is re-derived together for every designed
                theme, so no theme can drift back apart. */}
            <CustomText style={[styles.meta, { color: translationColor }]}>
              {[vaak.ang ? `${STRINGS.ANG} ${vaak.ang}` : null, vaak.raag || null]
                .filter(Boolean)
                .join(" · ")}
            </CustomText>
            {/* Tap to read the full hukamnama on SikhiToTheMax. */}
            <Pressable
              style={styles.readLink}
              onPress={() => {
                trackDashboardEvent("vaak_open", {
                  ang: vaak.ang,
                  raag: vaak.raag,
                  ist_date: vaak.istDate,
                  // Whether they were reading the previous day's, which is the
                  // one case where the card is not showing today's hukamnama.
                  showing_older_day: showingOlderDay,
                });
                openInAppBrowser(HUKAMNAMA_URL);
              }}
              hitSlop={6}
              accessibilityRole="button"
            >
              <CustomText style={[styles.readText, { color: gurmukhiColor }]}>
                {STRINGS.READ_HUKAMNAMA}
              </CustomText>
              <ChevronRight color={gurmukhiColor} />
            </Pressable>
          </View>
        </>
      ) : null}
    </>
  );

  // Embedded inside the Shabad/Vaak tab card → render bare (the parent provides
  // the card). Standalone → wrap in its own card.
  if (embedded) return body;
  return (
    <View style={styles.wrap}>
      <DashboardCard style={styles.card}>{body}</DashboardCard>
    </View>
  );
};

TodaysVaak.propTypes = {
  refreshKey: PropTypes.number,
  embedded: PropTypes.bool,
  reloadNonce: PropTypes.number,
  onLoadingChange: PropTypes.func,
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  card: { padding: 22 },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 14,
  },
  dateLine: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 14,
  },
  gurmukhi: {
    fontSize: 19,
    textAlign: "center",
    marginBottom: 6,
    lineHeight: 31,
    paddingHorizontal: 4,
  },
  footerDivider: { height: 1, marginVertical: 16 },
  // `space-between` only yields a gap while there is room to spare; once there
  // is not, the two halves butt together ("…ਰਾਗੁ ਸੋਰਠਿRead Hukamnama") and the
  // link runs off the card. Same defect as RandomShabad, same fix.
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  meta: { fontSize: 13, flexShrink: 1 },
  // Shrinks and wraps like the "Ang · Raag" meta beside it — same reasoning as
  // Random Shabad's identical footer: one half wrapping while the other held
  // its line read as lopsided. The chevron keeps its size either way.
  readLink: { flexDirection: "row", alignItems: "center", gap: 2, flexShrink: 1 },
  // No fontWeight — matches the "Ang · Raag" meta text beside it (Baloo Paaji
  // Regular via CustomText's default resolution) instead of the bold brand font.
  readText: { fontSize: 14, fontWeight: "600", flexShrink: 1 },
  skeletonInner: { alignItems: "center", gap: 10, paddingVertical: 6 },
  lineSkeletonWide: { width: "80%", height: 18 },
  lineSkeletonNarrow: { width: "55%", height: 18 },
});

export default TodaysVaak;
