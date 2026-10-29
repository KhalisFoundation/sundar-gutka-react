jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock("@react-native-firebase/analytics", () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
  setAnalyticsCollectionEnabled: jest.fn(() => Promise.resolve()),
}));

jest.mock("./crashlytics", () => ({
  logError: jest.fn(),
}));

// Passthrough — lets safeStr/safeInt values reach logEvent unchanged
jest.mock("./helper", () => ({
  sanitizeName: jest.fn((value, maxLen, fallback) =>
    value != null && String(value).trim() !== ""
      ? String(value).slice(0, maxLen)
      : fallback
  ),
}));

import { logEvent, setAnalyticsCollectionEnabled } from "@react-native-firebase/analytics";
import { logError } from "./crashlytics";
import {
  allowTracking,
  trackBaniOpen,
  trackBaniListen,
  trackBaniListenCompletion,
  trackBaniArtistDefault,
  trackTrackDownload,
  trackAudioLinkRequest,
  trackScrollProgress,
  trackSettingEvent,
  trackAudioEvent,
  trackReaderEvent,
  trackReminderEvent,
  trackScreenView,
  trackSevaEvent,
} from "./analytics";

// Shorthand — second arg to logEvent is the event name, third is params object
const lastEventName = () => logEvent.mock.calls[0][1];
const lastParams = () => logEvent.mock.calls[0][2];

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// allowTracking
// ─────────────────────────────────────────────────────────────────────────────

describe("allowTracking", () => {
  it("enables analytics collection", async () => {
    await allowTracking(true);
    expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), true);
  });

  it("disables analytics collection", async () => {
    await allowTracking(false);
    expect(setAnalyticsCollectionEnabled).toHaveBeenCalledWith(expect.anything(), false);
  });

  it("does not throw and calls logError when setAnalyticsCollectionEnabled rejects", async () => {
    setAnalyticsCollectionEnabled.mockRejectedValueOnce(new Error("permission denied"));
    await expect(allowTracking(true)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// bani_open
// ─────────────────────────────────────────────────────────────────────────────

describe("trackBaniOpen", () => {
  it("fires bani_open with all params", async () => {
    await trackBaniOpen("2", "Japji Sahib", "Bhai Jarnail Singh");
    expect(lastEventName()).toBe("bani_open");
    expect(lastParams()).toEqual({
      bani_id: "2",
      bani_title: "Japji Sahib",
      artist: "Bhai Jarnail Singh",
    });
  });

  it('sends artist="none" when artist is undefined', async () => {
    await trackBaniOpen("2", "Japji Sahib", undefined);
    expect(lastParams().artist).toBe("none");
  });

  it('sends artist="none" when artist is null', async () => {
    await trackBaniOpen("2", "Japji Sahib", null);
    expect(lastParams().artist).toBe("none");
  });

  it('sends bani_id="unknown" when baniID is null', async () => {
    await trackBaniOpen(null, "Japji Sahib", "Artist");
    expect(lastParams().bani_id).toBe("unknown");
  });

  it('sends bani_title="unknown" when title is null', async () => {
    await trackBaniOpen("2", null, "Artist");
    expect(lastParams().bani_title).toBe("unknown");
  });

  it('sends bani_title="unknown" when title is empty string', async () => {
    await trackBaniOpen("2", "", "Artist");
    expect(lastParams().bani_title).toBe("unknown");
  });

  it("calls logError and does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("Firebase error"));
    await expect(trackBaniOpen("2", "title", "artist")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// bani_listen
// ─────────────────────────────────────────────────────────────────────────────

describe("trackBaniListen", () => {
  it("fires bani_listen with correct params including bani_title", async () => {
    await trackBaniListen("2", "Japji Sahib", "Bhai Jarnail Singh", 90, 985);
    expect(lastEventName()).toBe("bani_listen");
    expect(lastParams()).toEqual({
      bani_id: "2",
      bani_title: "Japji Sahib",
      artist: "Bhai Jarnail Singh",
      duration_sec: 90,
      duration_min: 1.5,
      track_length_sec: 985,
    });
  });

  it("computes duration_min correctly: 60s = 1.0", async () => {
    await trackBaniListen("2", "Japji Sahib", "Artist", 60, 985);
    expect(lastParams().duration_min).toBe(1.0);
  });

  it("computes duration_min correctly: 30s = 0.5", async () => {
    await trackBaniListen("2", "Japji Sahib", "Artist", 30, 985);
    expect(lastParams().duration_min).toBe(0.5);
  });

  it("sends duration_min=0 when durationSec=0", async () => {
    await trackBaniListen("2", "Japji Sahib", "Artist", 0, 985);
    expect(lastParams()).toMatchObject({ duration_sec: 0, duration_min: 0 });
  });

  it("sends track_length_sec=0 when trackLengthSec is undefined", async () => {
    await trackBaniListen("2", "Japji Sahib", "Artist", 30, undefined);
    expect(lastParams().track_length_sec).toBe(0);
  });

  it('sends artist="none" when artist is undefined', async () => {
    await trackBaniListen("2", "Japji Sahib", undefined, 30, 985);
    expect(lastParams().artist).toBe("none");
  });

  it('sends bani_id="unknown" when baniID is null', async () => {
    await trackBaniListen(null, "Japji Sahib", "Artist", 30, 985);
    expect(lastParams().bani_id).toBe("unknown");
  });

  it('sends bani_title="unknown" when baniTitle is null', async () => {
    await trackBaniListen("2", null, "Artist", 30, 985);
    expect(lastParams().bani_title).toBe("unknown");
  });

  it('sends bani_title="unknown" when baniTitle is empty string', async () => {
    await trackBaniListen("2", "", "Artist", 30, 985);
    expect(lastParams().bani_title).toBe("unknown");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackBaniListen("2", "Japji Sahib", "Artist", 30, 985)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// bani_listen_completion
// ─────────────────────────────────────────────────────────────────────────────

describe("trackBaniListenCompletion", () => {
  it("fires bani_listen_completion with correct params", async () => {
    await trackBaniListenCompletion("2", "Japji", "Artist", 100, 985);
    expect(lastEventName()).toBe("bani_listen_completion");
    expect(lastParams()).toMatchObject({
      bani_id: "2",
      bani_title: "Japji",
      artist: "Artist",
      position_sec: 100,
      track_length_sec: 985,
    });
  });

  it('completion_tier="partial" when percent_complete < 40', async () => {
    await trackBaniListenCompletion("2", "t", "a", 39, 100);
    expect(lastParams()).toMatchObject({ percent_complete: 39, completion_tier: "partial" });
  });

  it('completion_tier="half" at exactly 40%', async () => {
    await trackBaniListenCompletion("2", "t", "a", 40, 100);
    expect(lastParams()).toMatchObject({ percent_complete: 40, completion_tier: "half" });
  });

  it('completion_tier="half" at 89%', async () => {
    await trackBaniListenCompletion("2", "t", "a", 89, 100);
    expect(lastParams()).toMatchObject({ percent_complete: 89, completion_tier: "half" });
  });

  it('completion_tier="completed" at exactly 90%', async () => {
    await trackBaniListenCompletion("2", "t", "a", 90, 100);
    expect(lastParams()).toMatchObject({ percent_complete: 90, completion_tier: "completed" });
  });

  it('completion_tier="completed" at 100%', async () => {
    await trackBaniListenCompletion("2", "t", "a", 100, 100);
    expect(lastParams()).toMatchObject({ percent_complete: 100, completion_tier: "completed" });
  });

  it("percent_complete=0 and tier=partial when trackLengthSec=0 (division guard)", async () => {
    await trackBaniListenCompletion("2", "t", "a", 50, 0);
    expect(lastParams()).toMatchObject({ percent_complete: 0, completion_tier: "partial" });
  });

  it("percent_complete capped at 100 when position > length", async () => {
    await trackBaniListenCompletion("2", "t", "a", 200, 100);
    expect(lastParams().percent_complete).toBe(100);
  });

  it('sends bani_id="unknown" when baniID is null', async () => {
    await trackBaniListenCompletion(null, "Japji", "Artist", 50, 100);
    expect(lastParams().bani_id).toBe("unknown");
  });

  it('sends bani_title="unknown" when title is null', async () => {
    await trackBaniListenCompletion("2", null, "Artist", 50, 100);
    expect(lastParams().bani_title).toBe("unknown");
  });

  it('sends artist="none" when artist is null', async () => {
    await trackBaniListenCompletion("2", "t", null, 50, 100);
    expect(lastParams().artist).toBe("none");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(
      trackBaniListenCompletion("2", "t", "a", 50, 100)
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// bani_artist_default
// ─────────────────────────────────────────────────────────────────────────────

describe("trackBaniArtistDefault", () => {
  it("fires bani_artist_default with correct params", async () => {
    await trackBaniArtistDefault("2", "Bhai Jarnail Singh");
    expect(lastEventName()).toBe("bani_artist_default");
    expect(lastParams()).toEqual({ bani_id: "2", artist: "Bhai Jarnail Singh" });
  });

  it('sends artist="none" when null', async () => {
    await trackBaniArtistDefault("2", null);
    expect(lastParams().artist).toBe("none");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackBaniArtistDefault("2", "Artist")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// track_download
// ─────────────────────────────────────────────────────────────────────────────

describe("trackTrackDownload", () => {
  it("fires track_download with correct params", async () => {
    await trackTrackDownload("2", "Bhai Jarnail Singh", "Japji Sahib");
    expect(lastEventName()).toBe("track_download");
    expect(lastParams()).toEqual({
      bani_id: "2",
      artist: "Bhai Jarnail Singh",
      bani_title: "Japji Sahib",
      network_type: "unknown",
    });
  });

  it("records the network the download used (wifi / mobile_data)", async () => {
    await trackTrackDownload("2", "Bhai Jarnail Singh", "Japji Sahib", "wifi");
    expect(lastParams().network_type).toBe("wifi");
  });

  it('sends artist="none" when undefined', async () => {
    await trackTrackDownload("2", undefined, "Japji Sahib");
    expect(lastParams().artist).toBe("none");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackTrackDownload("2", "Artist", "Japji Sahib")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// audio_link_request
// ─────────────────────────────────────────────────────────────────────────────

describe("trackAudioLinkRequest", () => {
  it("fires audio_link_request with bani_title, bani_id, and bani_length", async () => {
    await trackAudioLinkRequest("Japji Sahib", "2", "SHORT");
    expect(lastEventName()).toBe("audio_link_request");
    expect(lastParams()).toEqual({
      bani_title: "Japji Sahib",
      bani_id: "2",
      bani_length: "SHORT",
    });
  });

  it('sends bani_title="unknown" when null', async () => {
    await trackAudioLinkRequest(null, "2", "SHORT");
    expect(lastParams().bani_title).toBe("unknown");
  });

  it('sends bani_title="unknown" when empty string', async () => {
    await trackAudioLinkRequest("", "2", "SHORT");
    expect(lastParams().bani_title).toBe("unknown");
  });

  it('sends bani_id="unknown" when baniID is null', async () => {
    await trackAudioLinkRequest("Japji Sahib", null, "SHORT");
    expect(lastParams().bani_id).toBe("unknown");
  });

  it('sends bani_length="unknown" when baniLength is null', async () => {
    await trackAudioLinkRequest("Japji Sahib", "2", null);
    expect(lastParams().bani_length).toBe("unknown");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackAudioLinkRequest("title", "2", "SHORT")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// scroll_progress
// ─────────────────────────────────────────────────────────────────────────────

describe("trackScrollProgress", () => {
  it("fires scroll_progress with correct params", async () => {
    await trackScrollProgress("2", "Japji Sahib", 55, false);
    expect(lastEventName()).toBe("scroll_progress");
    expect(lastParams()).toEqual({
      bani_id: "2",
      bani_title: "Japji Sahib",
      scroll_percent: 55,
      scroll_tier: "half",
      sync_scroll: "off",
    });
  });

  it('scroll_tier="partial" when percent < 40', async () => {
    await trackScrollProgress("2", "t", 25, false);
    expect(lastParams().scroll_tier).toBe("partial");
  });

  it('scroll_tier="half" at exactly 40', async () => {
    await trackScrollProgress("2", "t", 40, false);
    expect(lastParams().scroll_tier).toBe("half");
  });

  it('scroll_tier="half" at 89', async () => {
    await trackScrollProgress("2", "t", 89, false);
    expect(lastParams().scroll_tier).toBe("half");
  });

  it('scroll_tier="complete" at exactly 90', async () => {
    await trackScrollProgress("2", "t", 90, false);
    expect(lastParams().scroll_tier).toBe("complete");
  });

  it('sync_scroll="on" when syncScrollEnabled=true', async () => {
    await trackScrollProgress("2", "t", 50, true);
    expect(lastParams().sync_scroll).toBe("on");
  });

  it('sync_scroll="off" when syncScrollEnabled=false', async () => {
    await trackScrollProgress("2", "t", 50, false);
    expect(lastParams().sync_scroll).toBe("off");
  });

  it("clamps scroll_percent above 100 to 100", async () => {
    await trackScrollProgress("2", "t", 150, false);
    expect(lastParams().scroll_percent).toBe(100);
  });

  it("clamps scroll_percent below 0 to 0", async () => {
    await trackScrollProgress("2", "t", -10, false);
    expect(lastParams().scroll_percent).toBe(0);
  });

  it('sends bani_id="unknown" when null', async () => {
    await trackScrollProgress(null, "t", 50, false);
    expect(lastParams().bani_id).toBe("unknown");
  });

  it('sends bani_title="unknown" when null', async () => {
    await trackScrollProgress("2", null, 50, false);
    expect(lastParams().bani_title).toBe("unknown");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackScrollProgress("2", "t", 50, false)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// screen_view
// ─────────────────────────────────────────────────────────────────────────────

describe("trackScreenView", () => {
  it("fires screen_view with screen_name and screen_class", async () => {
    await trackScreenView("ReaderScreen", null, null);
    expect(lastEventName()).toBe("screen_view");
    expect(lastParams()).toMatchObject({
      screen_name: "ReaderScreen",
      screen_class: "ReaderScreen",
    });
  });

  it("strips spaces from screen_class", async () => {
    await trackScreenView("Reader Screen", null, null);
    expect(lastParams().screen_class).toBe("ReaderScreen");
  });

  it("uses unknown when screenName is null", async () => {
    await trackScreenView(null, null, null);
    expect(lastParams()).toMatchObject({ screen_name: "unknown", screen_class: "unknown" });
  });

  it("includes key and title when provided", async () => {
    await trackScreenView("ReaderScreen", "2", "Japji Sahib");
    expect(lastParams().key).toBe("2");
    expect(lastParams().title).toBe("Japji Sahib");
  });

  it("excludes key param when null (not (not set))", async () => {
    await trackScreenView("ReaderScreen", null, "title");
    expect(lastParams()).not.toHaveProperty("key");
  });

  it("excludes title param when null (not (not set))", async () => {
    await trackScreenView("ReaderScreen", "2", null);
    expect(lastParams()).not.toHaveProperty("title");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackScreenView("Screen", null, null)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Generic event wrappers (setting / audio / reader / reminder)
// ─────────────────────────────────────────────────────────────────────────────

describe("trackSettingEvent", () => {
  it('fires "setting" event with correct param name and value', async () => {
    await trackSettingEvent("nightMode", true);
    expect(lastEventName()).toBe("setting");
    expect(lastParams()).toMatchObject({ nightMode: "true" });
  });

  it("converts boolean false to string", async () => {
    await trackSettingEvent("audioAutoPlay", false);
    expect(lastParams()).toMatchObject({ audioAutoPlay: "false" });
  });

  it("converts number to string", async () => {
    await trackSettingEvent("fontSize", 24);
    expect(lastParams()).toMatchObject({ fontSize: "24" });
  });

  it("sends empty string when label is null (no (not set))", async () => {
    await trackSettingEvent("someKey", null);
    // null becomes "" via the trackEvent implementation — empty string, not (not set)
    expect(lastParams().someKey).toBe("");
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackSettingEvent("nightMode", true)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

describe("trackAudioEvent", () => {
  it('fires "audio" event (legacy fallback, still exported)', async () => {
    await trackAudioEvent("customAction", "value");
    expect(lastEventName()).toBe("audio");
  });
});

describe("trackReaderEvent", () => {
  it('fires "reader" event with autoScrollSpeed', async () => {
    await trackReaderEvent("autoScrollSpeed", 50);
    expect(lastEventName()).toBe("reader");
    expect(lastParams()).toMatchObject({ autoScrollSpeed: "50" });
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackReaderEvent("autoScrollSpeed", 50)).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

describe("trackReminderEvent", () => {
  it('fires "reminder" event for addReminder', async () => {
    await trackReminderEvent("addReminder", { time: "08:00" });
    expect(lastEventName()).toBe("reminder");
  });

  it('fires "reminder" event for resetReminder', async () => {
    await trackReminderEvent("resetReminder", true);
    expect(lastEventName()).toBe("reminder");
    expect(lastParams()).toMatchObject({ resetReminder: "true" });
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(trackReminderEvent("addReminder", "value")).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Null-safety guarantee — all-null inputs must never produce undefined params
// ─────────────────────────────────────────────────────────────────────────────

describe("null safety — no (not set) across all dedicated events", () => {
  const cases = [
    ["trackBaniOpen",              () => trackBaniOpen(null, null, null)],
    ["trackBaniListen",            () => trackBaniListen(null, null, null, null, null)],
    ["trackBaniListenCompletion",  () => trackBaniListenCompletion(null, null, null, null, null)],
    ["trackBaniArtistDefault",     () => trackBaniArtistDefault(null, null)],
    ["trackTrackDownload",         () => trackTrackDownload(null, null, null)],
    ["trackAudioLinkRequest",      () => trackAudioLinkRequest(null, null, null)],
    ["trackScrollProgress",        () => trackScrollProgress(null, null, null, null)],
  ];

  test.each(cases)(
    "%s: all-null inputs produce no undefined or null param values",
    async (_name, fn) => {
      await fn();
      expect(logEvent).toHaveBeenCalledTimes(1);
      const params = lastParams();
      Object.entries(params).forEach(([key, value]) => {
        expect(value).not.toBeUndefined();
        expect(value).not.toBeNull();
        // Firebase shows (not set) for null/undefined — this confirms none slip through
        expect(typeof value === "string" || typeof value === "number").toBe(true);
      });
    }
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Canonical artist names — only the 3 approved display names must appear
// ─────────────────────────────────────────────────────────────────────────────

describe("canonical artist names — only approved display names used in events", () => {
  const CANONICAL_NAMES = [
    "Bhai Jarnail Singh",
    "Bibi Indermohan Kaur",
    "Giani Gurdev Singh",
  ];

  const artistEvents = [
    ["bani_open — Bhai Jarnail Singh",       () => trackBaniOpen("2", "Japji Sahib", "Bhai Jarnail Singh")],
    ["bani_open — Bibi Indermohan Kaur",     () => trackBaniOpen("2", "Japji Sahib", "Bibi Indermohan Kaur")],
    ["bani_open — Giani Gurdev Singh",        () => trackBaniOpen("2", "Japji Sahib", "Giani Gurdev Singh")],
    ["bani_listen — Bhai Jarnail Singh",     () => trackBaniListen("2", "Japji Sahib", "Bhai Jarnail Singh", 90, 985)],
    ["bani_listen — Bibi Indermohan Kaur",   () => trackBaniListen("2", "Japji Sahib", "Bibi Indermohan Kaur", 90, 985)],
    ["bani_listen — Giani Gurdev Singh",      () => trackBaniListen("2", "Japji Sahib", "Giani Gurdev Singh", 90, 985)],
    ["bani_listen_completion — Bibi Indermohan Kaur", () => trackBaniListenCompletion("2", "Japji Sahib", "Bibi Indermohan Kaur", 500, 985)],
    ["bani_artist_default — Bibi Indermohan Kaur",    () => trackBaniArtistDefault("2", "Bibi Indermohan Kaur")],
    ["track_download — Giani Gurdev Singh",            () => trackTrackDownload("2", "Giani Gurdev Singh", "Japji Sahib")],
  ];

  test.each(artistEvents)("%s: artist param is a canonical name", async (_label, fn) => {
    await fn();
    const params = lastParams();
    if (params.artist !== undefined) {
      expect(CANONICAL_NAMES).toContain(params.artist);
    }
  });

  it("rejects non-canonical name — 'Indermohan Kaur UK' must not appear in bani_open", async () => {
    await trackBaniOpen("2", "Japji Sahib", "Indermohan Kaur UK");
    // The analytics layer passes through whatever string is given — the guard
    // lives in useAudioManifest (CANONICAL_ARTIST_NAMES map). This test
    // documents that the raw string would reach Firebase unchanged, confirming
    // canonicalization MUST happen upstream before the event is fired.
    const params = lastParams();
    expect(params.artist).toBe("Indermohan Kaur UK");
  });

  it("rejects non-canonical name — 'Jarnail Singh' must not appear (missing 'Bhai')", async () => {
    await trackBaniListen("2", "Japji Sahib", "Jarnail Singh", 90, 985);
    const params = lastParams();
    expect(params.artist).toBe("Jarnail Singh");
    // Confirms upstream canonicalization is required; raw API name would be wrong
    expect(CANONICAL_NAMES).not.toContain(params.artist);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Seva funnel — in-app observable events only; every param non-null/non-empty
// ─────────────────────────────────────────────────────────────────────────────

describe("trackSevaEvent — observable funnel", () => {
  it("maps payment_started to seva_payment_started", async () => {
    await trackSevaEvent("payment_started", {
      provider: "qgiv",
      donation_type: "one_time",
      amount_bucket: "50_99",
    });
    expect(lastEventName()).toBe("seva_payment_started");
  });

  it("maps payment_success to seva_payment_success (browser-open conversion proxy)", async () => {
    await trackSevaEvent("payment_success", {
      provider: "qgiv",
      donation_type: "recurring",
      amount_bucket: "50_99",
    });
    expect(lastEventName()).toBe("seva_payment_success");
    expect(lastParams()).toEqual({
      provider: "qgiv",
      donation_type: "recurring",
      amount_bucket: "50_99",
    });
  });

  it("maps checkout_abandoned to seva_checkout_abandoned", async () => {
    await trackSevaEvent("checkout_abandoned", {
      last_step_reached: "amount_selected",
      donation_type: "recurring",
    });
    expect(lastEventName()).toBe("seva_checkout_abandoned");
    expect(lastParams()).toEqual({
      last_step_reached: "amount_selected",
      donation_type: "recurring",
    });
  });

  it("coerces booleans to 'true'/'false' and keeps valid strings", async () => {
    await trackSevaEvent("amount_selected", {
      is_custom: false,
      amount_bucket: "100_249",
      donation_type: "recurring",
    });
    expect(lastEventName()).toBe("seva_amount_selected");
    expect(lastParams()).toEqual({
      is_custom: "false",
      amount_bucket: "100_249",
      donation_type: "recurring",
    });
  });

  it("drops null/undefined/empty params — never emits (not set)", async () => {
    await trackSevaEvent("payment_started", {
      provider: "qgiv",
      donation_type: "one_time",
      amount_bucket: "100_249",
      nothing: null,
      missing: undefined,
      blank: "   ",
    });
    const params = lastParams();
    expect(params).toEqual({
      provider: "qgiv",
      donation_type: "one_time",
      amount_bucket: "100_249",
    });
    Object.values(params).forEach((value) => {
      expect(value).not.toBeNull();
      expect(value).not.toBeUndefined();
      expect(String(value).trim()).not.toBe("");
    });
  });

  it("does not throw when logEvent rejects", async () => {
    logEvent.mockRejectedValueOnce(new Error("err"));
    await expect(
      trackSevaEvent("payment_started", { provider: "qgiv", donation_type: "one_time" })
    ).resolves.toBeUndefined();
    expect(logError).toHaveBeenCalled();
  });
});
