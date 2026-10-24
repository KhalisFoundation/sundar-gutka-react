/* eslint-env jest */
import { Platform } from "react-native";
import notifee, { AndroidImportance, AndroidStyle } from "@notifee/react-native";
import { PUSH_CHANNEL_ID } from "./pushMessages";

// The channel decides whether a campaign is SEEN. At DEFAULT importance Android
// makes a sound and files the notification in the tray without ever putting it
// on screen, which is indistinguishable from "push is broken" to everyone who
// is not looking at the shade.

jest.mock("@notifee/react-native", () => ({
  __esModule: true,
  default: {
    // The real one resolves with the channel id — callers post to that value.
    createChannel: jest.fn((channel) => Promise.resolve(channel.id)),
    deleteChannel: jest.fn(() => Promise.resolve()),
    displayNotification: jest.fn(() => Promise.resolve()),
  },
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
  AndroidStyle: { BIGPICTURE: 0, BIGTEXT: 1, INBOX: 2, MESSAGING: 3 },
}));

jest.mock("@common/firebase/crashlytics", () => ({ logError: jest.fn() }));

const freshModule = () => {
  let mod;
  jest.isolateModules(() => {
    // eslint-disable-next-line global-require
    mod = require("./pushMessages");
  });
  return mod;
};

beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
});

describe("ensurePushChannel", () => {
  it("creates the channel at HIGH, which is what shows a heads-up banner", async () => {
    const { ensurePushChannel: ensure } = freshModule();

    await ensure();

    expect(notifee.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ importance: AndroidImportance.HIGH })
    );
  });

  it("resolves with the channel id — callers use it as the channel to post to", async () => {
    const { ensurePushChannel: ensure, PUSH_CHANNEL_ID: id } = freshModule();

    // Regression: chaining the legacy-channel cleanup onto createChannel made
    // this resolve with the DELETE's result instead, so every notification was
    // then posted with `channelId: undefined`.
    await expect(ensure()).resolves.toBe(id);
  });

  it("drops the old channel so Settings does not list two near-identical ones", async () => {
    const { ensurePushChannel: ensure } = freshModule();

    await ensure();

    expect(notifee.deleteChannel).toHaveBeenCalledWith("general_v1");
  });

  it("creates the channel once per process, however many messages arrive", async () => {
    const { ensurePushChannel: ensure } = freshModule();

    await ensure();
    await ensure();
    await ensure();

    expect(notifee.createChannel).toHaveBeenCalledTimes(1);
  });

  it("is a no-op on iOS, which has no channels", async () => {
    Platform.OS = "ios";
    const { ensurePushChannel: ensure, PUSH_CHANNEL_ID: id } = freshModule();

    await expect(ensure()).resolves.toBe(id);
    expect(notifee.createChannel).not.toHaveBeenCalled();
  });
});

describe("displayRemoteMessage", () => {
  it("posts to the versioned channel, not to whatever the OS defaults to", async () => {
    const { displayRemoteMessage: display, PUSH_CHANNEL_ID: id } = freshModule();

    await display({ notification: { title: "Hello", body: "There" } });

    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Hello",
        body: "There",
        android: expect.objectContaining({ channelId: id }),
      })
    );
  });

  it("takes the text from data when the message carries no notification block", async () => {
    const { displayRemoteMessage: display } = freshModule();

    await display({ data: { title: "From data", body: "Drawn by the app" } });

    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: "From data", body: "Drawn by the app" })
    );
  });

  it("stays silent for a data-only message meant for the app, not the user", async () => {
    const { displayRemoteMessage: display } = freshModule();

    const shown = await display({ data: { route: "dashboard" } });

    expect(shown).toBe(false);
    expect(notifee.displayNotification).not.toHaveBeenCalled();
  });

  it("passes the routing data through as strings, which the tray requires", async () => {
    const { displayRemoteMessage: display } = freshModule();

    await display({
      notification: { title: "Read", body: "Japji Sahib" },
      data: { route: "reader", id: 2 },
    });

    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ data: { route: "reader", id: "2" } })
    );
  });
});

describe("PUSH_CHANNEL_ID", () => {
  it("matches the id declared in firebase.json for OS-drawn notifications", () => {
    // eslint-disable-next-line global-require
    const firebaseJson = require("../../../firebase.json");

    // A background campaign is drawn by the OS on the channel named there, and
    // a foreground one by the app on PUSH_CHANNEL_ID. If the two drift, the
    // same campaign behaves differently depending on where the app was.
    expect(firebaseJson["react-native"].messaging_android_notification_channel_id).toBe(
      PUSH_CHANNEL_ID
    );
  });
});

describe("a long campaign body", () => {
  // The message that exposed this: two sentences, then the same again in
  // Punjabi. Android gives an unstyled notification ONE line — collapsed and
  // expanded alike — so the second half was simply not there, and the system
  // notification FCM draws for itself has no way to ask for more.
  const LONG =
    "Flu Season is upon us, please wear a mask when in public. Socially distance, " +
    "wash hands, and stay safe!\n\nਸਰਦੀਆਂ ਦਾ ਮੌਸਮ ਹੈ, ਕਿਰਪਾ ਕਰਕੇ ਮਾਸਕ ਪਾਓ. " +
    "ਸਮਾਜਕ ਤੌਰ 'ਤੇ ਦੂਰੀ ਬਣਾਓ, ਹੱਥ ਧੋਵੋ ਅਤੇ ਸੁਰੱਖਿਅਤ ਰਹੋ!";

  it("expands to the whole message instead of one clipped line", async () => {
    const { displayRemoteMessage: display } = freshModule();

    await display({ notification: { title: "Khalis Foundation", body: LONG } });

    const { android } = notifee.displayNotification.mock.calls[0][0];
    expect(android.style).toEqual({ type: AndroidStyle.BIGTEXT, text: LONG });
  });

  it("styles the body a data-only campaign carries, which is the same text", async () => {
    const { displayRemoteMessage: display } = freshModule();

    await display({ data: { title: "Khalis Foundation", body: LONG } });

    const { android, body } = notifee.displayNotification.mock.calls[0][0];
    expect(body).toBe(LONG);
    expect(android.style.text).toBe(LONG);
  });

  it("keeps the short body and the style in step", async () => {
    const { displayRemoteMessage: display } = freshModule();

    await display({ notification: { title: "Hi", body: "Short" } });

    const call = notifee.displayNotification.mock.calls[0][0];
    expect(call.android.style.text).toBe(call.body);
  });
});
