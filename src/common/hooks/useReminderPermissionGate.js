import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import {
  STRINGS,
  canScheduleExactAlarms,
  checkPermissions,
  hasNotificationPermission,
  logError,
  openExactAlarmSettings,
  openNotificationSettings,
  showConfirm,
} from "@common";

/**
 * Whether a reminder can go off, and the conversation with the user when it
 * cannot — shared by every surface that turns reminders on, so no screen can
 * reintroduce a switch that reads ON while nothing can fire.
 *
 * Two permissions: notifications on both platforms, and on Android the
 * exact-alarm permission as well. Checked in that order, and the FIRST missing
 * one is explained in the app's own dialog (themed on both platforms, unlike
 * the native alert), whose "Open settings" lands on that permission itself —
 * not the app-info page. Opening settings records which permission the trip
 * was for; when the app comes back, the return picks up where the tap left
 * off: granted → `onReturnGranted` runs, so the thing the user asked for
 * happens without a second tap; still missing → nothing, no nagging, since
 * they have just seen that dialog and said no.
 *
 * Only the user's own tap may PROMPT for the notification permission
 * (`prompt: true`); every other caller reads the state as it is.
 *
 * @param {{ onReturnGranted?: () => Promise<void>|void, onForeground?: () => Promise<void>|void }} handlers
 *   `onForeground` runs on every other return to the foreground — the place
 *   for a caller to notice a permission taken away while its switch read ON.
 * @returns {{ resolvePermissions: (returningFrom?: string|null, options?: { prompt?: boolean }) => Promise<boolean> }}
 */
const useReminderPermissionGate = ({ onReturnGranted, onForeground } = {}) => {
  const awaitingRef = useRef(null);
  // The listener is registered once, so it reaches the CURRENT handlers
  // through a ref — the state they close over may have changed while the user
  // was away in settings.
  const handlersRef = useRef({ onReturnGranted, onForeground });
  handlersRef.current = { onReturnGranted, onForeground };

  const explain = useCallback((permission) => {
    const forNotifications = permission === "notifications";
    showConfirm({
      title: forNotifications ? STRINGS.permissionTitle : STRINGS.ALARM_PERM_TITLE,
      message: forNotifications ? STRINGS.premissionDescription : STRINGS.ALARM_PERM_BODY,
      cancelText: STRINGS.cancel,
      confirmText: forNotifications ? STRINGS.openSettings : STRINGS.OPEN_SETTINGS,
      onConfirm: () => {
        awaitingRef.current = permission;
        if (forNotifications) openNotificationSettings();
        else openExactAlarmSettings();
      },
    });
  }, []);

  const resolvePermissions = useCallback(
    async (returningFrom = null, { prompt = false } = {}) => {
      const notifications = prompt ? await checkPermissions() : await hasNotificationPermission();
      if (!notifications) {
        if (returningFrom !== "notifications") explain("notifications");
        return false;
      }
      if (!(await canScheduleExactAlarms())) {
        if (returningFrom !== "alarms") explain("alarms");
        return false;
      }
      return true;
    },
    [explain]
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      try {
        const returningFrom = awaitingRef.current;
        if (returningFrom) {
          // Back from a trip we sent them on. Granted → finish what they asked
          // for, without a second tap; still missing → no repeat of the dialog.
          awaitingRef.current = null;
          if (await resolvePermissions(returningFrom)) {
            await handlersRef.current.onReturnGranted?.();
          }
          return;
        }
        await handlersRef.current.onForeground?.();
      } catch (error) {
        logError(error);
      }
    });
    return () => sub.remove();
  }, [resolvePermissions]);

  return { resolvePermissions };
};

export default useReminderPermissionGate;
