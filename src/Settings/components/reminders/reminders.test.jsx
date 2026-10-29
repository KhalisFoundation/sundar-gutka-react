/* eslint-env jest */
import React from "react";
import { AppState } from "react-native";

import { act, fireEvent, render } from "@testing-library/react-native";

import RemindersComponent from "./reminders";

const mockDispatch = jest.fn();
const mockCheckPermissions = jest.fn();
const mockHasNotificationPermission = jest.fn();
const mockCanScheduleExactAlarms = jest.fn();
const mockShowConfirm = jest.fn();
const mockCancelAll = jest.fn(() => Promise.resolve());
const mockOpenExactAlarmSettings = jest.fn();
const mockOpenNotificationSettings = jest.fn();
const mockSetDefaultReminders = jest.fn(() => Promise.resolve());

let mockState;
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn(mockState),
}));

jest.mock("@common", () => ({
  STRINGS: {
    reminders: "Reminders",
    cancel: "Cancel",
    openSettings: "Open Settings",
    OPEN_SETTINGS: "Open settings",
    permissionTitle: "Notification Permission Required",
    premissionDescription: "Please enable notifications.",
    ALARM_PERM_TITLE: "Allow alarms & reminders",
    ALARM_PERM_BODY: "Android needs exact alarms.",
    set_reminder_options: "Set Reminder Options",
    reminder_sound: "Reminder Sound",
  },
  cancelAllReminders: (...a) => mockCancelAll(...a),
  canScheduleExactAlarms: (...a) => mockCanScheduleExactAlarms(...a),
  checkPermissions: (...a) => mockCheckPermissions(...a),
  hasNotificationPermission: (...a) => mockHasNotificationPermission(...a),
  openExactAlarmSettings: (...a) => mockOpenExactAlarmSettings(...a),
  openNotificationSettings: (...a) => mockOpenNotificationSettings(...a),
  showConfirm: (...a) => mockShowConfirm(...a),
  actions: { toggleReminders: (value) => ({ type: "TOGGLE_REMINDERS", value }) },
  logError: jest.fn(),
  logMessage: jest.fn(),
  FallBack: jest.fn(),
  scheduleReminders: jest.fn(() => Promise.resolve()),
}));

jest.mock("@database", () => ({ getBaniList: jest.fn(() => Promise.resolve([])) }));
jest.mock("./ReminderOptions/utils", () => ({
  __esModule: true,
  default: (...a) => mockSetDefaultReminders(...a),
}));
jest.mock("../comon", () => ({ ListItemComponent: () => null, BottomSheetComponent: () => null }));
jest.mock("../comon/strings", () => ({ getReminderSound: () => [] }));
jest.mock("../comon/SettingsRow", () => {
  const ReactModule = require("react");
  const { Pressable, Text } = require("react-native");
  const Row = ({ title }) => ReactModule.createElement(Text, null, title);
  const Toggle = ({ title, value, onValueChange }) =>
    ReactModule.createElement(
      Pressable,
      { testID: "reminders-toggle", onPress: () => onValueChange(!value) },
      ReactModule.createElement(Text, null, `${title}:${value ? "on" : "off"}`)
    );
  return { __esModule: true, default: Row, SettingsToggleRow: Toggle };
});

const flush = () => act(() => Promise.resolve());
const enabledDispatches = () =>
  mockDispatch.mock.calls.filter(([a]) => a.type === "TOGGLE_REMINDERS" && a.value === true);

// The switch must never read ON while a reminder cannot fire. It used to turn
// on after the notification check alone, and a trip to system settings that
// came back without the permission left it on too.
describe("enabling reminders", () => {
  let appStateHandler;
  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      isReminders: false,
      reminderSound: "default",
      reminderBanis: "[]",
      isTransliteration: true,
    };
    // The read-only check follows whatever the prompting one would say.
    mockHasNotificationPermission.mockImplementation(() => mockCheckPermissions());
    jest.spyOn(AppState, "addEventListener").mockImplementation((_, cb) => {
      appStateHandler = cb;
      return { remove: jest.fn() };
    });
  });

  const tapToggle = async () => {
    const { getByTestId } = render(<RemindersComponent navigation={{ navigate: jest.fn() }} />);
    fireEvent.press(getByTestId("reminders-toggle"));
    await flush();
    await flush();
  };

  it("turns on only once every permission is there", async () => {
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    await tapToggle();
    expect(enabledDispatches()).toHaveLength(1);
    expect(mockSetDefaultReminders).toHaveBeenCalled();
    expect(mockShowConfirm).not.toHaveBeenCalled();
  });

  // With an account the list may have been built on another phone; switching
  // on here must schedule it, not replace it with the defaults (which the
  // sync layer would carry to every device as deletions).
  it("keeps the reminders already there and only schedules them", async () => {
    const list = JSON.stringify([{ key: 4, id: 4, time: "5:45 AM", enabled: true }]);
    mockState = { ...mockState, reminderBanis: list };
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    await tapToggle();
    expect(enabledDispatches()).toHaveLength(1);
    expect(mockSetDefaultReminders).not.toHaveBeenCalled();
    const { scheduleReminders } = jest.requireMock("@common");
    // The transliteration setting rides along: a reminder title is resolved
    // when the schedule is written, so the scheduler has to know the script.
    expect(scheduleReminders).toHaveBeenCalledWith(true, "default", list, true);
  });

  it("explains a missing notification permission in the app's own dialog and stays off", async () => {
    mockCheckPermissions.mockResolvedValue(false);
    await tapToggle();
    expect(enabledDispatches()).toHaveLength(0);
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Notification Permission Required",
        message: "Please enable notifications.",
        cancelText: "Cancel",
        confirmText: "Open Settings",
      })
    );
    expect(mockCancelAll).toHaveBeenCalled();
    // "Open Settings" lands on the notification permission itself, not the
    // app-info page it used to open.
    mockShowConfirm.mock.calls[0][0].onConfirm();
    expect(mockOpenNotificationSettings).toHaveBeenCalled();
  });

  it("stays off when exact alarms are not permitted, rather than switching on with nothing scheduled", async () => {
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(false);
    await tapToggle();
    expect(enabledDispatches()).toHaveLength(0);
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Allow alarms & reminders", confirmText: "Open settings" })
    );
    mockShowConfirm.mock.calls[0][0].onConfirm();
    expect(mockOpenExactAlarmSettings).toHaveBeenCalled();
  });

  it("switches on by itself when the app returns from settings with the permission granted", async () => {
    mockCheckPermissions.mockResolvedValueOnce(false);
    await tapToggle();
    mockShowConfirm.mock.calls[0][0].onConfirm(); // "Open Settings" — arms the re-check

    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    await act(async () => {
      await appStateHandler("active");
    });
    expect(enabledDispatches()).toHaveLength(1);
  });

  it("stays off when the app returns from settings without the permission", async () => {
    mockCheckPermissions.mockResolvedValue(false);
    await tapToggle();
    mockShowConfirm.mock.calls[0][0].onConfirm();

    await act(async () => {
      await appStateHandler("active");
    });
    expect(enabledDispatches()).toHaveLength(0);
    // …and it does not nag again on its own: one dialog, from the tap.
    expect(mockShowConfirm).toHaveBeenCalledTimes(1);
  });

  it("follows a granted notification permission with the alarm dialog when that is still missing", async () => {
    // Both missing. The user grants notifications in settings and comes back:
    // the switch cannot turn on yet, and the next thing in the way is shown
    // right away rather than leaving them to tap and discover it.
    mockCheckPermissions.mockResolvedValueOnce(false);
    await tapToggle();
    mockShowConfirm.mock.calls[0][0].onConfirm();

    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(false);
    await act(async () => {
      await appStateHandler("active");
    });
    expect(enabledDispatches()).toHaveLength(0);
    expect(mockShowConfirm).toHaveBeenCalledTimes(2);
    expect(mockShowConfirm.mock.calls[1][0].title).toBe("Allow alarms & reminders");
  });

  it("does not repeat the alarm dialog when the user returns from that page without granting", async () => {
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(false);
    await tapToggle();
    mockShowConfirm.mock.calls[0][0].onConfirm();

    await act(async () => {
      await appStateHandler("active");
    });
    expect(enabledDispatches()).toHaveLength(0);
    expect(mockShowConfirm).toHaveBeenCalledTimes(1);
  });

  it("turns the switch off and says why when a permission was revoked while it read ON", async () => {
    // Fine when Settings opened; taken away while the app was in the
    // background; noticed on the way back.
    mockState = { isReminders: true, reminderSound: "default", reminderBanis: "[]" };
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    render(<RemindersComponent navigation={{ navigate: jest.fn() }} />);
    await flush();
    mockCheckPermissions.mockResolvedValue(false);
    await act(async () => {
      await appStateHandler("active");
    });
    const off = mockDispatch.mock.calls.filter(
      ([a]) => a.type === "TOGGLE_REMINDERS" && a.value === false
    );
    expect(off).toHaveLength(1);
    expect(mockCancelAll).toHaveBeenCalled();
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Notification Permission Required" })
    );
  });

  it("leaves a switch that reads ON alone while every permission is still there", async () => {
    mockState = { isReminders: true, reminderSound: "default", reminderBanis: "[]" };
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    render(<RemindersComponent navigation={{ navigate: jest.fn() }} />);
    await act(async () => {
      await appStateHandler("active");
    });
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockShowConfirm).not.toHaveBeenCalled();
  });

  it("notices on opening Settings that a permission was taken away, without prompting", async () => {
    // Revoking "Alarms & reminders" kills the app, so this is caught on the
    // next mount, not on a foreground event. And opening Settings is not a
    // request for anything: the check must be read-only.
    mockState = { isReminders: true, reminderSound: "default", reminderBanis: "[]" };
    mockHasNotificationPermission.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(false);
    render(<RemindersComponent navigation={{ navigate: jest.fn() }} />);
    await flush();
    await flush();
    const off = mockDispatch.mock.calls.filter(
      ([a]) => a.type === "TOGGLE_REMINDERS" && a.value === false
    );
    expect(off).toHaveLength(1);
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Allow alarms & reminders" })
    );
    expect(mockCheckPermissions).not.toHaveBeenCalled();
  });

  it("only the tap itself may raise the system prompt", async () => {
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    await tapToggle();
    expect(mockCheckPermissions).toHaveBeenCalledTimes(1);
  });

  it("ignores a routine foreground that was not a trip to settings", async () => {
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    render(<RemindersComponent navigation={{ navigate: jest.fn() }} />);
    await act(async () => {
      await appStateHandler("active");
    });
    expect(enabledDispatches()).toHaveLength(0);
  });
});
