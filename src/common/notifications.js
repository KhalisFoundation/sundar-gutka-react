import { Linking, Platform } from "react-native";
import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
} from "@notifee/react-native";
import { navy } from "@theme/palette";
import constant from "./constant";
import { logError, logMessage } from "./firebase/crashlytics";
import { reminderTitle } from "./reminders/title";

/**
 * Whether the OS will let us schedule a reminder at an exact time.
 *
 * ANDROID 12+ ONLY. `SCHEDULE_EXACT_ALARM` is declared (notifee merges it into
 * the manifest) but, for an app targeting SDK 33 or higher on Android 14+, it
 * is NOT granted on install — the user has to turn "Alarms & reminders" on
 * themselves. Until they do, `createTriggerNotification` does not schedule
 * anything and does not throw, so every reminder silently never fires.
 *
 * That was the bug: `dumpsys alarm` showed ZERO alarms registered for the app
 * while reminders appeared switched on in Settings.
 *
 * iOS has no equivalent — a scheduled UNNotificationRequest needs only the
 * notification permission — so this is true there and the caller carries on.
 *
 * @see https://notifee.app/react-native/docs/triggers
 * @see https://developer.android.com/about/versions/14/changes/schedule-exact-alarms
 */
export const canScheduleExactAlarms = async () => {
  if (Platform.OS !== "android") return true;
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.android?.alarm === AndroidNotificationSetting.ENABLED;
  } catch (error) {
    logError(error);
    // Assume we can, and let the scheduling attempt be the judge — better to
    // try and fail than to block reminders because a settings read broke.
    return true;
  }
};

/**
 * Opens the page where the notification permission actually lives.
 *
 * `Linking.openSettings()` lands on the app's info page, and from there the
 * user still has to find "Notifications" — which is what "open settings does
 * not even take me to the permission" was. notifee opens the app's own
 * notification settings on Android (the app-info page below API 26). On iOS
 * that call is a documented no-op, and the app settings page IS where the
 * toggle is, so it opens that.
 */
export const openNotificationSettings = async () => {
  try {
    if (Platform.OS === "android") {
      await notifee.openNotificationSettings();
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    logError(error);
  }
};

/** Opens the system "Alarms & reminders" screen. Android-only; a no-op on iOS. */
export const openExactAlarmSettings = async () => {
  if (Platform.OS !== "android") return;
  try {
    await notifee.openAlarmPermissionSettings();
  } catch (error) {
    logError(error);
  }
};

/**
 * Parse a time string like "h:m A" (e.g. "9:30 AM") into a future timestamp (ms).
 * Uses native Date instead of moment.js to avoid bundling that large library (~270 KB).
 */
const parseTimeString = (timeStr) => {
  const [timePart, meridiem] = timeStr.trim().split(" ");
  const [hoursRaw, minutes] = timePart.split(":").map(Number);
  let hours = hoursRaw % 12;
  if (meridiem && meridiem.toUpperCase() === "PM") hours += 12;
  const now = new Date();
  const result = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  return result.getTime();
};

/**
 * The reminder sound as iOS wants it.
 *
 * iOS DOES NOT SUPPORT MP3 for notification sounds. `UNNotificationSound`
 * accepts Linear PCM / MA4 / µLaw / aLaw in an aiff, wav or caf container, and
 * notifee's own iOS docs list the same three. Hand it an `.mp3` and it does not
 * error — it silently plays the DEFAULT tone, which is why the custom reminder
 * sound appears to be ignored on iPhone while working on Android.
 *
 * The app ships `waheguru_soul.mp3` / `wake_up_jap.mp3`, used as-is on Android
 * (where mp3 in `res/raw` is fine) and swapped to `.caf` here. THE .caf FILES
 * MUST BE ADDED TO THE iOS BUNDLE for this to do anything — until they are,
 * iOS falls back to the default tone exactly as it does today, so this is safe
 * to ship ahead of them. To generate, on a Mac:
 *
 *   afconvert -d LEI16 -f caff -c 1 waheguru_soul.mp3 waheguru_soul.caf
 *
 * then add both to the Xcode target's Copy Bundle Resources.
 *
 * @see https://notifee.app/react-native/docs/ios/behaviour
 */
export const iosSoundName = (sound) => {
  if (!sound || sound === constant.DEFAULT.toLowerCase()) return "default";
  return sound.replace(/\.[^.]+$/, ".caf");
};

/**
 * Bump this whenever a channel's SOUND, importance or vibration changes.
 *
 * An Android notification channel is IMMUTABLE once created: after the first
 * `createChannel`, only its name and description can ever be changed again.
 * Calling `createChannel` with new sound on an existing id is not an error and
 * not a no-op you can see — it silently keeps the OLD sound, for as long as the
 * app stays installed. The documented way out is to create a channel under a new
 * id and delete the old one.
 *   https://developer.android.com/develop/ui/views/notifications/channels
 *
 * Without this version the app could ship a new reminder tone and every existing
 * user would keep hearing the previous one, with nothing in the code to explain
 * why. Bumping it is the whole migration.
 */
export const CHANNEL_VERSION = 1;

/**
 * The Android channel a given reminder sound plays through.
 *
 * One channel per sound, because the sound belongs to the channel and cannot be
 * set per-notification on Android 8+. Versioned — see `CHANNEL_VERSION`.
 */
export const channelIdFor = (sound) => {
  const base =
    !sound || sound === constant.DEFAULT.toLowerCase()
      ? constant.SOUND.toLowerCase()
      : sound.split(".")[0];
  return `${base}_v${CHANNEL_VERSION}`;
};

/**
 * Removes channels this build no longer uses.
 *
 * Old-version channels would otherwise sit in the system settings screen for
 * ever, so the user sees several near-identical "Reminders" entries and can
 * silence one that is not the one being used.
 */
export const pruneStaleChannels = async (keepIds) => {
  if (Platform.OS !== "android") return;
  try {
    const existing = await notifee.getChannels();
    await Promise.all(
      existing
        .filter((ch) => /_v\d+$/.test(ch.id) && !keepIds.includes(ch.id))
        .map((ch) => notifee.deleteChannel(ch.id))
    );
  } catch (error) {
    // Never let housekeeping stop a reminder being scheduled.
    logError(error);
  }
};

export const createReminder = async (notification, sound, isTransliteration = false) => {
  const androidChannel = {
    channelId: channelIdFor(sound),
    // NOT ic_launcher_foreground. That resource exists only as
    // mipmap-anydpi-v26 (an adaptive icon), so on Android 7 — which the app
    // still supports — it has no loadable configuration. System UI draws the
    // notification from OUR resources, fails to create the icon, and kills the
    // app with "Bad notification posted: Couldn't create icon". ic_notification
    // is a white silhouette present at every density with no version
    // qualifier, which is what a small icon is supposed to be.
    smallIcon: "ic_notification",
    // The silhouette above is drawn on a tile of this colour. Unset, skins that
    // frame the small icon (rather than showing the launcher icon, as Android 16
    // on Pixel does) fill that tile black, so it no longer looks like the app.
    color: navy[800],
    pressAction: {
      id: "default",
      launchActivity: "default", // This should match your configured activity
      mainComponent: "default", // Ensure your activity is correctly referenced
    },
  };

  const currentTime = Date.now();
  let notificationTime = parseTimeString(notification.time);
  if (notificationTime < currentTime) {
    notificationTime += 24 * 60 * 60 * 1000; // add one day in milliseconds
  }
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: notificationTime,
    repeatFrequency: RepeatFrequency.DAILY,
    // Fire even when the device has dozed off. Without this a reminder set for
    // an early hour lands whenever the phone next wakes up, which for a Nitnem
    // reminder is the difference between useful and pointless. Android-only
    // key; notifee ignores it on iOS.
    alarmManager: { allowWhileIdle: true },
  };

  try {
    // Create notification
    await notifee.createTriggerNotification(
      {
        // Resolved at SCHEDULE time, not read from the stored string: the name
        // must follow the transliteration setting, and a title written months
        // ago cannot know what that setting is now.
        title: reminderTitle(notification, isTransliteration),
        body: notification.time,
        data: {
          id: notification.id.toString(),
          // Strings only, and every one of them coerced the same way. notifee
          // rejects a non-string value here, and `String(x) || ""` does not
          // guard a missing field: String(undefined) is the truthy text
          // "undefined", so the fallback never fires and that is what gets stored.
          gurmukhi: String(notification.gurmukhi || ""),
          translit: String(notification.translit || ""),
        },
        android: androidChannel,
        ios: {
          badgeCount: 1,
          // Not `sound` — iOS cannot play the .mp3 the Android channel uses.
          sound: iosSoundName(sound),
        },
      },
      trigger
    );
  } catch (error) {
    // Logged and swallowed: one reminder failing to schedule must not take the
    // rest of the batch with it. There is deliberately nothing shown here -
    // this runs in the background with no UI of its own, and the error screen
    // it used to call belongs to an error boundary. Invoking that component as
    // a plain function ran its hooks outside React's render, so the handler
    // threw "Invalid hook call" and buried the failure it was meant to report.
    logError(error);
    logMessage("createReminder: Failed to create reminder");
  }
};

/**
 * Rewrites the pending schedule without disturbing anything already on screen.
 *
 * `updateReminders` calls `cancelAllNotifications()`, which clears DELIVERED
 * notifications as well as pending triggers. That is right when the user has
 * just changed a setting, but wrong for the periodic re-arm: it would wipe the
 * reminder currently sitting in the shade before the user had read it. This
 * cancels only the TRIGGERS.
 *
 * Silent by design — it runs on app launch, where a permission prompt would be
 * ambush. If exact alarms are not permitted it simply does nothing; the
 * Settings screen is where the user is asked.
 *
 * @returns {Promise<number>} how many reminders were re-armed.
 */
export const rearmReminders = async (sound, remindersList, isTransliteration = false) => {
  if (!(await canScheduleExactAlarms())) return 0;

  let reminders;
  try {
    reminders = JSON.parse(remindersList).filter((item) => item.enabled);
  } catch (error) {
    logError(error);
    return 0;
  }
  if (reminders.length === 0) return 0;

  await notifee.cancelTriggerNotifications();
  await Promise.all(
    reminders.map((reminder) => createReminder(reminder, sound, isTransliteration))
  );
  return reminders.length;
};

export const resetBadgeCount = async () => {
  await notifee.setBadgeCount(0);
};

// NET-04: Return the scheduled notification IDs so callers can use them
export const getScheduleNotifications = async () => {
  return notifee.getTriggerNotificationIds();
};

export const removeAllDeliveredNotifications = async () => {
  resetBadgeCount();
  await notifee.cancelDisplayedNotification();
};

export const cancelAllReminders = async () => {
  resetBadgeCount();
  await notifee.cancelAllNotifications();
};

export const updateReminders = async (
  remindersOn,
  sound,
  remindersList,
  isTransliteration = false
) => {
  await cancelAllReminders();
  const channels = [
    {
      id: constant.SOUND,
      name: constant.REMINDERS_DEFAULT,
      sound: constant.DEFAULT.toLowerCase(),
    },
    {
      id: constant.WAHEGURU_SOUL,
      name: constant.REMINDERS_WAHEGURU_SOUL,
      sound: constant.WAHEGURU_SOUL,
    },
    {
      id: constant.WAKE_UP_JAP,
      name: constant.REMINDERS_WAKE_UP,
      sound: constant.WAKE_UP_JAP,
    },
  ];

  const channelIds = channels.map((channel) => channelIdFor(channel.sound));

  await Promise.all(
    channels.map((channel, i) =>
      notifee.createChannel({
        id: channelIds[i],
        name: channel.name,
        sound: channel.sound,
        description: constant.ALERT_DESCRIPTION,
        importance: AndroidImportance.HIGH,
      })
    )
  );
  // Drop channels from earlier versions so the settings screen does not fill up
  // with near-identical entries the app no longer posts to.
  await pruneStaleChannels(channelIds);

  if (!remindersOn) return { scheduled: 0, blocked: false };

  const array = JSON.parse(remindersList);
  const reminders = array.filter((item) => item.enabled); // Filter only enabled reminders

  // Nothing to schedule — don't send the user to a permission screen for it.
  if (reminders.length === 0) return { scheduled: 0, blocked: false };

  // Ask BEFORE scheduling. Without the exact-alarm permission every
  // createTriggerNotification below is a silent no-op, so the app would report
  // reminders as on while the OS had none registered.
  if (!(await canScheduleExactAlarms())) {
    logMessage("updateReminders: exact alarms not permitted; nothing scheduled");
    return { scheduled: 0, blocked: true };
  }

  await Promise.all(
    reminders.map((reminder) => createReminder(reminder, sound, isTransliteration))
  );
  return { scheduled: reminders.length, blocked: false };
};

// Explicitly prompt for notification permission (Android 13+ POST_NOTIFICATIONS /
// iOS alert). Used before the first download so the foreground-service download
// notification is actually visible instead of silently denied.
export const requestNotificationPermission = async () => {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch (_) {
    return false;
  }
};

/**
 * Whether the app may post notifications.
 *
 * Reads the CURRENT state and only prompts when it has to. Both parts matter —
 * this function had two separate ways of hanging forever, and each one made the
 * Reminders switch impossible to turn on:
 *
 *  1. It began by awaiting
 *     `PermissionsAndroid.check("BROADCAST_CLOSE_SYSTEM_DIALOGS")`. That
 *     permission is signature-level and is NOT declared in this app's manifest,
 *     and its result was only ever used to write a log line — it never affected
 *     the return value. The check never settled.
 *
 *  2. With that removed, `notifee.requestPermission()` then hung on its own.
 *     It does not resolve on Android 13+ when the permission is ALREADY
 *     granted (invertase/notifee#609, #1237), which is the normal case for any
 *     returning user. `getNotificationSettings()` is a plain read and always
 *     resolves, so the prompt is now reached only when genuinely needed.
 *
 * Both were verified on device: `handleReminders` logged on every tap while the
 * line after this call never did, first stopping at (1) and then at (2).
 * Turning reminders OFF always worked because that path returns before here.
 */
//
// And a THIRD, found on device after the two above: once the user has DENIED,
// `requestPermission()` hangs as well. Android 13+ shows the system prompt
// once; after a denial there is no prompt to show, and the promise simply never
// settles until the app next comes to the foreground — so the tap did nothing,
// and the answer (still denied) arrived on the next focus, which is when the
// "permission required" dialog appeared out of nowhere. Two guards:
//
//   - the prompt is requested at most once per app session; every later check
//     is the plain read, which is all that is needed to see a grant made in
//     system settings;
//   - the one request is raced against a timeout, so even that first tap can
//     never be swallowed. A timeout is treated as "not granted", which is what
//     it means in practice.
const PERMISSION_PROMPT_TIMEOUT_MS = 4000;
let permissionPromptShown = false;

const isAuthorized = (settings) => settings?.authorizationStatus >= AuthorizationStatus.AUTHORIZED;

/**
 * The notification permission as it stands, with NO prompt. For every check
 * that is not the user's own tap on the switch: coming back from settings, and
 * noticing on foreground or on opening Settings that a permission was taken
 * away — a system prompt popping up on any of those is not what the user did.
 */
export const hasNotificationPermission = async () => {
  try {
    return isAuthorized(await notifee.getNotificationSettings());
  } catch (error) {
    logError(error);
    return false;
  }
};

export const checkPermissions = async () => {
  const current = await notifee.getNotificationSettings();
  if (isAuthorized(current)) return true;
  if (permissionPromptShown) return false;
  permissionPromptShown = true;

  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(null), PERMISSION_PROMPT_TIMEOUT_MS);
  });
  try {
    const settings = await Promise.race([notifee.requestPermission(), timeout]);
    return isAuthorized(settings);
  } catch (error) {
    logError(error);
    return false;
  } finally {
    clearTimeout(timer);
  }
};

// Uses ic_notification — see createReminder for why the launcher icon cannot be a
// notification small icon on Android 7.
export const displayNotification = async () => {
  await notifee.displayNotification({
    title: "Test Notification",
    body: "This is a test notification.",
    android: { channelId: constant.SOUND, smallIcon: "ic_notification" },
  });
};
