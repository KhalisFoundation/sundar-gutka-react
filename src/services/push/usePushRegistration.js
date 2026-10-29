import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { getVersion } from "react-native-device-info";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  subscribeToTopic,
  unsubscribeFromTopic,
} from "@react-native-firebase/messaging";
import { logError, logMessage } from "@common/firebase/crashlytics";
import { hasNotificationPermission, requestNotificationPermission } from "@common/notifications";
import { detachPushDevice, registerPushDevice } from "./pushApi";
import { displayRemoteMessage, ensurePushChannel } from "./pushMessages";
import { topicsFor, topicsToLeave } from "./pushTopics";

// Keeps this device reachable by push, and tells the account which device it
// is.
//
// ── What "registered" means ──────────────────────────────────────────────
// Three things, all idempotent and all redone whenever an input changes:
//   • the FCM token is registered with the Khalis API — anonymously before
//     sign-in, attached to the account after it, detached at sign-out
//   • the device is subscribed to its topics (everyone / platform / language)
//   • foreground messages are displayed, since FCM shows none of its own
//     while the app is open
//
// ── When it runs ─────────────────────────────────────────────────────────
// On mount, on token refresh, when the account changes, when the language
// changes, and on return to the foreground — the last so a permission granted
// in Settings takes effect without a relaunch. The last registration is
// remembered so an unchanged one costs no request.
//
// ── Permission ───────────────────────────────────────────────────────────
// Asked once, on first mount. iOS shows its dialog once ever; Android 13+ the
// same. A refusal is final until the user changes it in Settings, and nothing
// here nags: the token is still registered, so the moment permission is
// granted the device starts receiving.

const LAST_REGISTRATION_KEY = "@push_last_registration_v1";
const LAST_TOPICS_KEY = "@push_last_topics_v1";

/** What the last successful registration looked like, so a repeat is skipped. */
const signatureOf = ({ token, userEmail, language, appVersion }) =>
  [token, userEmail || "", language, appVersion].join("|");

export const PUSH_LANG_FALLBACK = "en";

/** The app's language as a short tag: "pa", "en", … */
const langTag = (language) => {
  const l = String(language || "")
    .trim()
    .toLowerCase();
  if (!l || l === "default") return PUSH_LANG_FALLBACK;
  return l.split(/[-_]/)[0] || PUSH_LANG_FALLBACK;
};

const usePushRegistration = () => {
  const authStatus = useSelector((state) => state.auth?.status);
  const userEmail = useSelector((state) => state.auth?.user?.email ?? null);
  const language = useSelector((state) => state.language);

  const tokenRef = useRef(null);
  const askedRef = useRef(false);
  // The account the token was last attached to — so a sign-out is detected as
  // a transition rather than inferred from "no user right now", which is also
  // what a cold start looks like before the Keychain read resolves.
  const attachedToRef = useRef(null);
  const inFlightRef = useRef(null);

  const register = async (reason) => {
    if (inFlightRef.current) return inFlightRef.current;
    inFlightRef.current = (async () => {
      try {
        const messaging = getMessaging();
        if (!askedRef.current) {
          askedRef.current = true;
          if (!(await hasNotificationPermission())) await requestNotificationPermission();
        }
        await ensurePushChannel();
        const token = tokenRef.current || (await getToken(messaging));
        if (!token) return;
        tokenRef.current = token;

        const lang = langTag(language);
        const appVersion = getVersion();
        const signature = signatureOf({ token, userEmail, language: lang, appVersion });
        const last = await AsyncStorage.getItem(LAST_REGISTRATION_KEY);
        if (last !== signature) {
          const res = await registerPushDevice({
            token,
            platform: Platform.OS,
            appVersion,
            language: lang,
          });
          if (res.ok) {
            await AsyncStorage.setItem(LAST_REGISTRATION_KEY, signature);
            if (userEmail && res.data?.attachedToUser) attachedToRef.current = userEmail;
          } else {
            logMessage(`push: register failed (${res.error ?? res.status}) [${reason}]`);
          }
        } else if (userEmail) {
          attachedToRef.current = userEmail;
        }

        const wanted = topicsFor({ platform: Platform.OS, lang });
        const previous = JSON.parse((await AsyncStorage.getItem(LAST_TOPICS_KEY)) || "[]");
        const stale = topicsToLeave(previous, wanted);
        await Promise.all(stale.map((t) => unsubscribeFromTopic(messaging, t).catch(logError)));
        await Promise.all(wanted.map((t) => subscribeToTopic(messaging, t).catch(logError)));
        await AsyncStorage.setItem(LAST_TOPICS_KEY, JSON.stringify(wanted));
      } catch (error) {
        logError(error);
      } finally {
        inFlightRef.current = null;
      }
    })();
    return inFlightRef.current;
  };

  // Mount, and every return to the foreground.
  useEffect(() => {
    register("mount");
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") register("foreground");
    });
    return () => sub.remove();
    // `register` reads the latest props through closure on each call.
  }, []);

  // Token rotation, and foreground display.
  useEffect(() => {
    const messaging = getMessaging();
    const offRefresh = onTokenRefresh(messaging, (token) => {
      tokenRef.current = token;
      register("token-refresh");
    });
    const offMessage = onMessage(messaging, (remoteMessage) => {
      displayRemoteMessage(remoteMessage).catch(logError);
    });
    return () => {
      offRefresh();
      offMessage();
    };
  }, []);

  // Account or language changed: re-register, or detach on sign-out.
  useEffect(() => {
    if (authStatus === "signedOut" && attachedToRef.current && tokenRef.current) {
      const token = tokenRef.current;
      attachedToRef.current = null;
      AsyncStorage.removeItem(LAST_REGISTRATION_KEY).catch(() => {});
      detachPushDevice(token).then((res) => {
        if (!res.ok) logMessage(`push: detach failed (${res.error ?? res.status})`);
      });
      return;
    }
    if (authStatus === "signedIn" || language) register("account-or-language");
  }, [authStatus, userEmail, language]);
};

export default usePushRegistration;
