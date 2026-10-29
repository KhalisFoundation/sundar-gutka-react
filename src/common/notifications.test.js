import { Platform } from "react-native";
import notifee, { AndroidNotificationSetting } from "@notifee/react-native";
import { navy } from "@theme/palette";
import { logError } from "./firebase/crashlytics";
import {
  canScheduleExactAlarms,
  channelIdFor,
  createReminder,
  iosSoundName,
  rearmReminders,
  updateReminders,
} from "./notifications";

// Reminders silently never fired: on Android 12+ the exact-alarm permission is
// not granted on install, and without it `createTriggerNotification` schedules
// nothing AND throws nothing. `dumpsys alarm` showed zero alarms registered
// while the app's own Settings screen showed reminders as on.
//
// These pin the two halves of the fix — that we ask first, and that we report
// back when the answer is no — because neither is visible from the UI.

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue("ch"),
    getChannels: jest.fn().mockResolvedValue([]),
    deleteChannel: jest.fn().mockResolvedValue(undefined),
    createTriggerNotification: jest.fn().mockResolvedValue(undefined),
    cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
    cancelTriggerNotifications: jest.fn().mockResolvedValue(undefined),
    setBadgeCount: jest.fn().mockResolvedValue(undefined),
    getNotificationSettings: jest.fn(),
    requestPermission: jest.fn(),
    openNotificationSettings: jest.fn().mockResolvedValue(undefined),
  },
  TriggerType: { TIMESTAMP: 0 },
  RepeatFrequency: { DAILY: 1 },
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationSetting: { ENABLED: 1, DISABLED: 0 },
  AuthorizationStatus: { DENIED: 0, AUTHORIZED: 1 },
}));

jest.mock("./firebase/crashlytics", () => ({ logError: jest.fn(), logMessage: jest.fn() }));

const reminder = (over = {}) => ({
  key: 1,
  id: 1,
  gurmukhi: "g",
  translit: "t",
  enabled: true,
  title: "Time for Japji",
  time: "5:30 AM",
  ...over,
});

const listOf = (...items) => JSON.stringify(items);

const allowAlarms = (allowed) =>
  notifee.getNotificationSettings.mockResolvedValue({
    android: {
      alarm: allowed ? AndroidNotificationSetting.ENABLED : AndroidNotificationSetting.DISABLED,
    },
  });

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
});

describe("exact-alarm permission gate", () => {
  it("reports blocked and schedules NOTHING when the OS has not granted it", async () => {
    allowAlarms(false);
    const result = await updateReminders(true, "default", listOf(reminder()));

    expect(result).toEqual({ scheduled: 0, blocked: true });
    // The whole point: no silent partial success.
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it("schedules every enabled reminder once granted", async () => {
    allowAlarms(true);
    const result = await updateReminders(
      true,
      "default",
      listOf(reminder(), reminder({ key: 2, time: "6:00 PM" }))
    );

    expect(result).toEqual({ scheduled: 2, blocked: false });
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(2);
  });

  it("skips disabled reminders", async () => {
    allowAlarms(true);
    const result = await updateReminders(
      true,
      "default",
      listOf(reminder(), reminder({ key: 2, enabled: false }))
    );

    expect(result.scheduled).toBe(1);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(1);
  });

  it("does not send the user to a permission screen when there is nothing to schedule", async () => {
    allowAlarms(false);
    const result = await updateReminders(true, "default", listOf(reminder({ enabled: false })));

    expect(result).toEqual({ scheduled: 0, blocked: false });
  });

  it("clears the schedule when reminders are switched off, without prompting", async () => {
    allowAlarms(false);
    const result = await updateReminders(false, "default", listOf(reminder()));

    expect(result).toEqual({ scheduled: 0, blocked: false });
    expect(notifee.cancelAllNotifications).toHaveBeenCalled();
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it("is an Android-only concept — iOS never blocks", async () => {
    Platform.OS = "ios";
    // Deliberately the DISABLED answer: iOS has no exact-alarm permission, so
    // reading one must not gate scheduling there.
    allowAlarms(false);

    expect(await canScheduleExactAlarms()).toBe(true);
    const result = await updateReminders(true, "default", listOf(reminder()));
    expect(result).toEqual({ scheduled: 1, blocked: false });
  });

  it("assumes permitted if the settings read itself fails", async () => {
    notifee.getNotificationSettings.mockRejectedValue(new Error("bridge died"));
    // Better to try and fail than to block reminders on a broken read.
    expect(await canScheduleExactAlarms()).toBe(true);
  });
});

describe("the scheduled trigger", () => {
  beforeEach(() => allowAlarms(true));

  it("fires daily, and while the device is dozing", async () => {
    await updateReminders(true, "default", listOf(reminder()));

    const [, trigger] = notifee.createTriggerNotification.mock.calls[0];
    expect(trigger.repeatFrequency).toBe(1); // DAILY
    // Without allowWhileIdle an early-morning Nitnem reminder lands whenever
    // the phone next wakes up, which is useless for its purpose.
    expect(trigger.alarmManager).toEqual({ allowWhileIdle: true });
  });

  it("rolls a time that has already passed today on to tomorrow", async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    await updateReminders(true, "default", listOf(reminder({ time: "5:30 AM" })));

    const [, trigger] = notifee.createTriggerNotification.mock.calls[0];
    expect(new Date(trigger.timestamp).getDate()).toBe(16);
    jest.useRealTimers();
  });

  it("posts to a channel that was actually created", async () => {
    await updateReminders(true, "default", listOf(reminder()));

    const created = notifee.createChannel.mock.calls.map(([ch]) => ch.id);
    const [notification] = notifee.createTriggerNotification.mock.calls[0];
    // A notification posted to a channel id that does not exist is dropped by
    // Android without an error, so this pairing has to hold.
    expect(created).toContain(notification.android.channelId);
  });

  it("uses the matching sound channel when a custom sound is chosen", async () => {
    await updateReminders(true, "waheguru_soul.mp3", listOf(reminder()));

    const created = notifee.createChannel.mock.calls.map(([ch]) => ch.id);
    const [notification] = notifee.createTriggerNotification.mock.calls[0];
    // Asserted through the helper, so bumping CHANNEL_VERSION cannot leave the
    // scheduled notification pointing at a channel that no longer exists.
    expect(notification.android.channelId).toBe(channelIdFor("waheguru_soul.mp3"));
    expect(created).toContain(channelIdFor("waheguru_soul.mp3"));
    // iOS cannot play mp3 — it gets the .caf name instead.
    expect(notification.ios.sound).toBe("waheguru_soul.caf");
  });

  it("frames the silhouette icon in the brand navy, not the skin's default black", async () => {
    await updateReminders(true, "default", listOf(reminder()));

    const [notification] = notifee.createTriggerNotification.mock.calls[0];
    expect(notification.android.smallIcon).toBe("ic_notification");
    expect(notification.android.color).toBe(navy[800]);
  });
});

describe("iOS sound names", () => {
  // iOS silently plays the DEFAULT tone for an unsupported format rather than
  // erroring, so a wrong extension here is invisible until someone notices the
  // custom sound never plays on an iPhone.
  it("swaps the Android mp3 for the iOS caf", () => {
    expect(iosSoundName("waheguru_soul.mp3")).toBe("waheguru_soul.caf");
    expect(iosSoundName("wake_up_jap.mp3")).toBe("wake_up_jap.caf");
  });

  it("leaves the system default alone", () => {
    expect(iosSoundName("default")).toBe("default");
    expect(iosSoundName("")).toBe("default");
    expect(iosSoundName(undefined)).toBe("default");
  });
});

describe("re-arming on app foreground", () => {
  // RepeatFrequency.DAILY is reported not to repeat on Android (notifee #601,
  // closed stale, repo archived). Re-arming on every launch is the safety net.
  beforeEach(() => allowAlarms(true));

  it("rewrites the pending triggers", async () => {
    const n = await rearmReminders("default", listOf(reminder(), reminder({ key: 2 })));
    expect(n).toBe(2);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(2);
  });

  it("cancels only TRIGGERS, never what is already on screen", async () => {
    await rearmReminders("default", listOf(reminder()));
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalled();
    // cancelAllNotifications would dismiss the reminder the user is reading.
    expect(notifee.cancelAllNotifications).not.toHaveBeenCalled();
  });

  it("is silent when exact alarms are not permitted", async () => {
    allowAlarms(false);
    expect(await rearmReminders("default", listOf(reminder()))).toBe(0);
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it("survives corrupt stored reminders", async () => {
    expect(await rearmReminders("default", "{not json")).toBe(0);
  });
});

// The sound is baked into a notification AT SCHEDULE TIME — on Android it picks
// the channel, on iOS it names the file. Storing a new sound therefore changes
// nothing already sitting in the OS queue, which is why a reminder kept firing
// with the previous tone until something else happened to reschedule it.
// Editing a reminder's TIME did, which made the bug look intermittent.
describe("changing the sound rewrites what is already scheduled", () => {
  it("reschedules every enabled reminder against the new sound", async () => {
    await updateReminders(true, "default", listOf(reminder()));
    notifee.createTriggerNotification.mockClear();

    await updateReminders(true, "wake_up_jap.mp3", listOf(reminder()));

    const [notification] = notifee.createTriggerNotification.mock.calls[0];
    expect(notification.android.channelId).toBe(channelIdFor("wake_up_jap.mp3"));
    expect(notification.ios.sound).toBe("wake_up_jap.caf");
  });

  it("clears the old schedule first, so no reminder fires twice", async () => {
    await updateReminders(true, "wake_up_jap.mp3", listOf(reminder()));
    expect(notifee.cancelAllNotifications).toHaveBeenCalled();
  });
});

describe("channels are versioned, because Android will not let them change", () => {
  it("keeps the id stable for one version and distinct per sound", () => {
    expect(channelIdFor("wake_up_jap.mp3")).toBe(channelIdFor("wake_up_jap.mp3"));
    expect(channelIdFor("wake_up_jap.mp3")).not.toBe(channelIdFor("waheguru_soul.mp3"));
  });

  it("gives the default sound its own channel rather than none", () => {
    expect(channelIdFor("default")).toContain("sound");
    expect(channelIdFor(undefined)).toBe(channelIdFor("default"));
  });

  it("carries a version marker, so a future tone change can migrate", () => {
    // A channel is immutable once created: calling createChannel again with a
    // new sound silently keeps the old one. A new id is the documented way out.
    expect(channelIdFor("wake_up_jap.mp3")).toMatch(/_v\d+$/);
  });

  it("deletes channels left behind by an earlier version", async () => {
    notifee.getChannels.mockResolvedValueOnce([
      { id: "wake_up_jap_v0" },
      { id: channelIdFor("wake_up_jap.mp3") },
      { id: "some_other_channel" },
    ]);

    await updateReminders(true, "wake_up_jap.mp3", listOf(reminder()));

    expect(notifee.deleteChannel).toHaveBeenCalledWith("wake_up_jap_v0");
    // The one in use, and anything not ours, are left alone.
    expect(notifee.deleteChannel).not.toHaveBeenCalledWith(channelIdFor("wake_up_jap.mp3"));
    expect(notifee.deleteChannel).not.toHaveBeenCalledWith("some_other_channel");
  });
});

// requestPermission() on Android 13+ hangs once the user has denied: there is
// no prompt left to show and the promise settles only on the next foreground.
// So the prompt goes out at most once per session, raced against a timeout,
// and every later check is a plain read.
describe("checkPermissions", () => {
  const load = () => {
    let mod;
    jest.isolateModules(() => {
      mod = require("./notifications");
    });
    return mod;
  };
  const denied = { authorizationStatus: 0 };
  const granted = { authorizationStatus: 1 };

  beforeEach(() => {
    jest.useRealTimers();
    notifee.requestPermission.mockReset();
    notifee.getNotificationSettings.mockReset();
  });

  it("is true from the plain read when already granted, without prompting", async () => {
    notifee.getNotificationSettings.mockResolvedValue(granted);
    expect(await load().checkPermissions()).toBe(true);
    expect(notifee.requestPermission).not.toHaveBeenCalled();
  });

  it("prompts once, and returns what the prompt decided", async () => {
    notifee.getNotificationSettings.mockResolvedValue(denied);
    notifee.requestPermission.mockResolvedValue(granted);
    expect(await load().checkPermissions()).toBe(true);
    expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("never prompts a second time in the session — a denied user gets the answer at once", async () => {
    const { checkPermissions } = load();
    notifee.getNotificationSettings.mockResolvedValue(denied);
    notifee.requestPermission.mockResolvedValue(denied);
    expect(await checkPermissions()).toBe(false);
    expect(await checkPermissions()).toBe(false);
    expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("still sees a grant made in system settings after the one prompt", async () => {
    const { checkPermissions } = load();
    notifee.getNotificationSettings.mockResolvedValue(denied);
    notifee.requestPermission.mockResolvedValue(denied);
    await checkPermissions();
    notifee.getNotificationSettings.mockResolvedValue(granted);
    expect(await checkPermissions()).toBe(true);
    expect(notifee.requestPermission).toHaveBeenCalledTimes(1);
  });

  it("treats a prompt that never settles as not granted, instead of hanging the tap", async () => {
    jest.useFakeTimers();
    const { checkPermissions } = load();
    notifee.getNotificationSettings.mockResolvedValue(denied);
    notifee.requestPermission.mockReturnValue(new Promise(() => {}));
    const result = checkPermissions();
    await Promise.resolve();
    await Promise.resolve();
    jest.advanceTimersByTime(4000);
    expect(await result).toBe(false);
  });
});

describe("openNotificationSettings", () => {
  it("opens the app's notification settings on Android", async () => {
    Platform.OS = "android";
    await require("./notifications").openNotificationSettings();
    expect(notifee.openNotificationSettings).toHaveBeenCalled();
  });

  it("opens the app settings page on iOS, where notifee's call is a no-op", async () => {
    Platform.OS = "ios";
    const { Linking } = require("react-native");
    const spy = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    await require("./notifications").openNotificationSettings();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("a reminder that cannot be scheduled", () => {
  it("logs and moves on instead of throwing a second error over the first", async () => {
    // The catch used to call FallBack(), the error-boundary SCREEN, as a plain
    // function. That ran its hooks outside React's render and threw "Invalid
    // hook call", which buried the real failure and reported a React bug
    // instead. Nothing can be rendered from here: this runs in the background.
    notifee.createTriggerNotification.mockRejectedValueOnce(new Error("no slots"));

    await expect(
      createReminder({ id: 1, time: "6:00 AM", gurmukhi: "g", translit: "t" }, "sound")
    ).resolves.toBeUndefined();

    expect(logError).toHaveBeenCalled();
  });
});
