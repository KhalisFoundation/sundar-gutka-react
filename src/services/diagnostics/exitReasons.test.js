/* eslint-env jest */
import { NativeModules, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
// eslint-disable-next-line import/no-named-as-default
import reportRecentExits, { describeExit, exitAttributes, summariseExit } from "./exitReasons";

// The whole point of this module is the deaths Crashlytics never sees. A Low
// Memory Killer reclaim produces no crash report, so if these reports are
// wrong, silent, or duplicated every launch, the diagnosis they exist to
// support is worse than having nothing.

const mockLogError = jest.fn();
const mockLogMessage = jest.fn();
const mockSetCustomKey = jest.fn();
const mockDidCrashLastRun = jest.fn();

jest.mock("../../common/firebase/crashlytics", () => ({
  logError: (...a) => mockLogError(...a),
  logMessage: (...a) => mockLogMessage(...a),
  setCustomKey: (...a) => mockSetCustomKey(...a),
  didCrashLastRun: (...a) => mockDidCrashLastRun(...a),
}));

const exit = (over = {}) => ({
  reason: 3,
  reasonName: "LOW_MEMORY",
  status: 0,
  importance: 100,
  pss: 268435456,
  rss: 314572800,
  timestamp: 2000,
  description: "",
  processName: "com.WahegurooNetwork.SundarGutka",
  ...over,
});

beforeEach(async () => {
  jest.clearAllMocks();
  Platform.OS = "android";
  await AsyncStorage.clear();
  NativeModules.ExitReasons = { getRecentExits: jest.fn() };
  mockDidCrashLastRun.mockResolvedValue(false);
});

describe("reportRecentExits", () => {
  it("reports a low-memory kill, which leaves no crash report of its own", async () => {
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([exit()]);

    await expect(reportRecentExits()).resolves.toBe(1);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError.mock.calls[0][0].message).toBe("App process died: LOW_MEMORY");
  });

  it("attaches the footprint, which is the number device free memory cannot give", async () => {
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([exit()]);

    await reportRecentExits();

    expect(mockSetCustomKey).toHaveBeenCalledWith(
      expect.objectContaining({ exit_reason: "LOW_MEMORY", exit_pss: "256MB", exit_rss: "300MB" })
    );
  });

  it("reports each death once, not on every launch", async () => {
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([exit()]);

    await reportRecentExits();
    await reportRecentExits();

    expect(mockLogError).toHaveBeenCalledTimes(1);
  });

  it("still reports a newer death after an older one was seen", async () => {
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([exit()]);
    await reportRecentExits();

    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([
      exit({ timestamp: 3000, reasonName: "CRASH_NATIVE", reason: 5 }),
      exit(),
    ]);
    await expect(reportRecentExits()).resolves.toBe(1);

    expect(mockLogError).toHaveBeenCalledTimes(2);
    expect(mockLogError.mock.calls[1][0].message).toBe("App process died: CRASH_NATIVE");
  });

  it("stays quiet about an ordinary close", async () => {
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([
      exit({ reasonName: "EXIT_SELF", reason: 1 }),
    ]);

    await expect(reportRecentExits()).resolves.toBe(0);
    expect(mockLogError).not.toHaveBeenCalled();
  });

  it("never lets a diagnostic break the launch", async () => {
    NativeModules.ExitReasons.getRecentExits.mockRejectedValue(new Error("nope"));

    await expect(reportRecentExits()).resolves.toBe(0);
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockLogMessage).toHaveBeenCalled();
  });

  it("survives the module itself throwing on access, as it did on Android 9 and 10", async () => {
    Object.defineProperty(NativeModules, "ExitReasons", {
      configurable: true,
      get: () => {
        throw new Error(
          "Exception in HostObject::get for prop 'ExitReasons': java.lang.NoClassDefFoundError"
        );
      },
    });

    await expect(reportRecentExits()).resolves.toBe(0);
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockLogMessage.mock.calls[0][0]).toContain("NoClassDefFoundError");

    Object.defineProperty(NativeModules, "ExitReasons", {
      configurable: true,
      writable: true,
      value: undefined,
    });
  });

  it("logs every new exit, reported or not, so silence never has to be interpreted", async () => {
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([
      exit({ reasonName: "USER_REQUESTED", reason: 10, timestamp: 1000 }),
      exit({ reasonName: "OTHER", reason: 13, timestamp: 1500 }),
    ]);

    await expect(reportRecentExits()).resolves.toBe(0);

    const line = mockLogMessage.mock.calls[0][0];
    expect(line).toMatch(
      /^Previous exits \(2, crashed last run: no\): OTHER at .*; USER_REQUESTED at /
    );
  });

  it("files the newest exit when the previous run crashed and nothing explains it", async () => {
    mockDidCrashLastRun.mockResolvedValue(true);
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([
      exit({ reasonName: "USER_REQUESTED", reason: 10, timestamp: 1000 }),
      exit({ reasonName: "OTHER", reason: 13, timestamp: 5000 }),
    ]);

    await expect(reportRecentExits()).resolves.toBe(1);

    expect(mockLogError.mock.calls[0][0].message).toBe("App process died: OTHER");
    expect(mockSetCustomKey).toHaveBeenCalledWith(
      expect.objectContaining({ exit_after_crash: "true", exit_time: "1970-01-01T00:00:05.000Z" })
    );
  });

  it("does not file a Java crash twice: Crashlytics already has its stack", async () => {
    mockDidCrashLastRun.mockResolvedValue(true);
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([
      exit({ reasonName: "CRASH", reason: 4, timestamp: 1000 }),
      exit({ reasonName: "USER_REQUESTED", reason: 10, timestamp: 5000 }),
    ]);

    await expect(reportRecentExits()).resolves.toBe(0);
    expect(mockLogMessage.mock.calls[0][0]).toContain("crashed last run: yes");
  });

  it("marks a noteworthy exit as following a crash", async () => {
    mockDidCrashLastRun.mockResolvedValue(true);
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([
      exit({ reasonName: "CRASH_NATIVE", reason: 5, timestamp: 1000 }),
      exit({ reasonName: "USER_REQUESTED", reason: 10, timestamp: 5000 }),
    ]);

    await expect(reportRecentExits()).resolves.toBe(1);
    expect(mockLogError.mock.calls[0][0].message).toBe("App process died: CRASH_NATIVE");
    expect(mockSetCustomKey).toHaveBeenCalledWith(
      expect.objectContaining({ exit_after_crash: "true" })
    );
  });

  it("puts a native crash's tombstone on its report", async () => {
    const tombstone = [
      "signal SIGSEGV (SEGV_MAPERR) fault addr 0x10",
      "thread: RenderThread (tid 42)",
      "#00 pc 00000000002a3c40  /apex/com.android.art/lib64/libart.so (art::Foo+12)",
    ];
    NativeModules.ExitReasons.getRecentExits.mockResolvedValue([
      exit({ reasonName: "CRASH_NATIVE", reason: 5, tombstone }),
    ]);

    await reportRecentExits();

    const logged = mockLogMessage.mock.calls.map((c) => c[0]);
    tombstone.forEach((l) => expect(logged).toContain(`tombstone: ${l}`));
    expect(mockSetCustomKey).toHaveBeenCalledWith(
      expect.objectContaining({ exit_tombstone: tombstone.join(" | ") })
    );
  });

  it("does nothing where the API does not exist", async () => {
    NativeModules.ExitReasons = undefined;
    await expect(reportRecentExits()).resolves.toBe(0);

    NativeModules.ExitReasons = { getRecentExits: jest.fn() };
    Platform.OS = "ios";
    await expect(reportRecentExits()).resolves.toBe(0);
    expect(NativeModules.ExitReasons.getRecentExits).not.toHaveBeenCalled();
  });
});

describe("shaping", () => {
  it("groups every low-memory kill as one issue rather than one per device", () => {
    expect(describeExit(exit())).toBe(describeExit(exit({ pss: 1, rss: 2, timestamp: 9 })));
  });

  it("summarises an exit on one line with its time and footprint", () => {
    expect(summariseExit(exit({ timestamp: 0 }))).toBe(
      "LOW_MEMORY at unknown pss=256MB importance=100"
    );
  });

  it("reports unknown footprints honestly instead of as zero", () => {
    expect(exitAttributes(exit({ pss: 0, rss: 0 }))).toEqual(
      expect.objectContaining({ exit_pss: "unknown", exit_rss: "unknown" })
    );
  });
});
