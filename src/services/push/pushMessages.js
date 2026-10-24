import { Platform } from "react-native";
import notifee, { AndroidImportance, AndroidStyle } from "@notifee/react-native";
import { logError } from "@common/firebase/crashlytics";

// What happens to a push message once it reaches the device.
//
// FCM shows a message in the tray by itself only when the app is in the
// background AND the message carries a `notification` block. Everything else
// is the app's job: a message that arrives while the app is open is handed to
// onMessage and shown to no one unless the app displays it; a data-only
// message is handed to the background handler the same way. Both paths land
// here and post a local notification through notifee, so a campaign looks the
// same however it arrived.
//
// The data payload rides along on the local notification untouched: notifee
// reports it back on tap, and pushRouting decides where it goes.

// v2: importance raised from DEFAULT to HIGH. DEFAULT makes a sound and puts
// the notification in the tray but NEVER shows a heads-up banner, so a campaign
// arrived silently on screen and was only found by pulling the shade down. The
// id has to change with it — see the note on ensurePushChannel.
export const PUSH_CHANNEL_ID = "general_v2";

/** Deleted on first use of v2, so Settings does not list both. */
const LEGACY_PUSH_CHANNEL_ID = "general_v1";

let channelReady = null;

/**
 * The Android channel campaigns post to. Created once per process; the id is
 * also declared in firebase.json so FCM's own tray notifications use it.
 *
 * Versioned the way the reminder channels are (see notifications.js): a channel
 * is IMMUTABLE once created, so calling createChannel again with a new
 * importance is not an error and not a visible no-op — it silently keeps the
 * old one for as long as the app stays installed. Changing importance means a
 * new id, and the old one is deleted so the system settings screen does not
 * collect near-identical entries.
 *
 * HIGH, matching the reminder channels: that is the level that shows a heads-up
 * banner. At DEFAULT the notification only makes a sound and sits in the tray.
 */
export const ensurePushChannel = () => {
  if (Platform.OS !== "android") return Promise.resolve(PUSH_CHANNEL_ID);
  if (!channelReady) {
    channelReady = notifee
      .createChannel({
        id: PUSH_CHANNEL_ID,
        name: "Updates",
        importance: AndroidImportance.HIGH,
      })
      // Resolve with the ID, not with the delete's result: callers use this
      // promise's value as the channelId they post to.
      .then(async () => {
        await notifee.deleteChannel(LEGACY_PUSH_CHANNEL_ID).catch(() => {});
        return PUSH_CHANNEL_ID;
      })
      .catch((error) => {
        channelReady = null;
        throw error;
      });
  }
  return channelReady;
};

/** Title and body from either block; a data-only campaign puts them in data. */
const textOf = (remoteMessage) => {
  const n = remoteMessage?.notification || {};
  const d = remoteMessage?.data || {};
  return {
    title: n.title || d.title || "",
    body: n.body || d.body || "",
  };
};

/**
 * Show one remote message as a local notification. Silent when the message
 * has nothing to say — a data-only message meant for the app, not the user.
 */
export const displayRemoteMessage = async (remoteMessage) => {
  const { title, body } = textOf(remoteMessage);
  if (!title && !body) return false;
  try {
    const channelId = await ensurePushChannel();
    await notifee.displayNotification({
      title,
      body,
      // Strings only: notifee (and the tray) reject nested objects here.
      data: Object.fromEntries(
        Object.entries(remoteMessage?.data || {}).map(([k, v]) => [k, String(v)])
      ),
      android: {
        channelId,
        // Without a style Android gives the body ONE line, collapsed and
        // expanded alike: there is nothing to expand into, so a two-sentence
        // campaign is simply cut off. BigText is the template that gives the
        // notification a growing text area, and it is the only way to show a
        // long message in full — the system-drawn FCM notification has no way
        // to ask for it, which is why campaigns are drawn here instead.
        //
        // It also carries the OS text-size setting: the expanded area grows
        // with the font scale rather than clipping, so a large-display or
        // large-font device shows the same words, taller.
        style: { type: AndroidStyle.BIGTEXT, text: body },
        // Android 7.0 and 7.1 (the minSdk floor) predate channels entirely, so
        // the channel's HIGH importance means nothing to them and notifee
        // falls back to DEFAULT — a sound and a tray entry, no banner. This is
        // the per-notification equivalent, and it is ignored from API 26 up
        // where the channel decides instead.
        importance: AndroidImportance.HIGH,
        smallIcon: "ic_notification",
        pressAction: { id: "default" },
      },
      // iOS needs nothing here for a banner: notifee presents a notification
      // heads-up while the app is foregrounded by default, and the OS draws it
      // from the APNs payload when it is not.
      ios: { sound: "default" },
    });
    return true;
  } catch (error) {
    logError(error);
    return false;
  }
};

/**
 * The background handler, registered in index.js before the app itself so it
 * runs headless. It must not touch UI or Redux; displaying is all it does.
 * FCM has already shown a `notification` message in the tray by the time this
 * runs, so only a data-only message needs posting.
 */
export const handleBackgroundMessage = async (remoteMessage) => {
  if (remoteMessage?.notification) return;
  await displayRemoteMessage(remoteMessage);
};
