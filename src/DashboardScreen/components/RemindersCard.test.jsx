/* eslint-env jest */
import React from "react";
import { AppState } from "react-native";

import { act, fireEvent, render } from "@testing-library/react-native";

import RemindersCard from "./RemindersCard";

// The Dashboard card is the second way to turn reminders on, and it shipped
// without the three fixes Settings had: it flipped the master switch after
// the notification check alone, used the native alert plus the app-info page,
// and wrote four default reminders into the store whenever the list was empty
// — which the account sync then carried to every device as new reminders.

const mockDispatch = jest.fn();
const mockCheckPermissions = jest.fn();
const mockHasNotificationPermission = jest.fn();
const mockCanScheduleExactAlarms = jest.fn();
const mockShowConfirm = jest.fn();
const mockOpenExactAlarmSettings = jest.fn();
const mockOpenNotificationSettings = jest.fn();
const mockScheduleReminders = jest.fn(() => Promise.resolve({ scheduled: 1, blocked: false }));
const mockTrack = jest.fn();
const mockEditSheet = jest.fn();

let mockState;
jest.mock("react-redux", () => ({
  useDispatch: () => mockDispatch,
  useSelector: (fn) => fn(mockState),
}));

jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({ navigate: jest.fn() }) }));

jest.mock("react-native-svg", () => {
  const { View } = require("react-native");
  const Stub = () => null;
  return { __esModule: true, default: View, Circle: Stub, Path: Stub, Line: Stub };
});

jest.mock("@common/icons", () => ({ SunriseIcon: () => null, SunsetIcon: () => null }));
// The sheet itself is Settings' and tested there; this records what it is handed.
jest.mock("../../Settings/components/reminders/ReminderOptions/components", () => ({
  ReminderEditSheet: (props) => {
    mockEditSheet(props);
    return null;
  },
}));
jest.mock("@common/hooks/useBaniLookup", () => ({
  __esModule: true,
  default: () => ({ nameOf: () => "" }),
  toTitleCase: (t) => t,
}));
jest.mock("./dashboardTheme", () => () => ({
  accentBlue: "#00f",
  gold: "#fc0",
  mutedText: "#888",
  separator: "#eee",
  palette: {},
}));
jest.mock("./SectionLabel", () => () => null);

jest.mock("@common", () => {
  const ReactModule = require("react");
  const { Pressable, Text } = require("react-native");
  return {
    STRINGS: {
      cancel: "Cancel",
      openSettings: "Open Settings",
      OPEN_SETTINGS: "Open settings",
      permissionTitle: "Notification Permission Required",
      premissionDescription: "Please enable notifications.",
      ALARM_PERM_TITLE: "Allow alarms & reminders",
      ALARM_PERM_BODY: "Android needs exact alarms.",
      time_for: "Time for",
      REMINDERS_TITLE: "Reminders",
      ADD_REMINDER: "Add a reminder",
      EDIT: "Edit",
      AMRIT_VELA: "Amrit Vela",
      MORNING_NITNEM: "Morning",
      AFTERNOON_TIME: "Afternoon",
      EVENING_TIME: "Evening",
      NIGHT_TIME: "Night",
    },
    CustomText: ({ children }) => ReactModule.createElement(Text, null, children),
    ThemedSwitch: ({ value, onValueChange }) =>
      ReactModule.createElement(Pressable, {
        testID: "reminder-switch",
        onPress: () => onValueChange(!value),
      }),
    actions: {
      toggleReminders: (value) => ({ type: "TOGGLE_REMINDERS", value }),
      setReminderBanis: (value) => ({ type: "SET_REMINDER_BANIS", value }),
    },
    canScheduleExactAlarms: (...a) => mockCanScheduleExactAlarms(...a),
    checkPermissions: (...a) => mockCheckPermissions(...a),
    hasNotificationPermission: (...a) => mockHasNotificationPermission(...a),
    openExactAlarmSettings: (...a) => mockOpenExactAlarmSettings(...a),
    openNotificationSettings: (...a) => mockOpenNotificationSettings(...a),
    showConfirm: (...a) => mockShowConfirm(...a),
    scheduleReminders: (...a) => mockScheduleReminders(...a),
    trackDashboardEvent: (...a) => mockTrack(...a),
    logError: jest.fn(),
  };
});

// Enough banis for the default indexes [0, 1, 19, 21].
const mockBanis = Array.from({ length: 24 }, (_, i) => ({
  id: 100 + i,
  gurmukhi: `ਬਾਣੀ ${i}`,
  translit: `bani ${i}`,
}));
jest.mock("@database", () => ({ getBaniList: jest.fn(() => Promise.resolve(mockBanis)) }));

const flush = () => act(() => Promise.resolve());
const dispatched = (type) => mockDispatch.mock.calls.filter(([a]) => a.type === type);

const open = async () => {
  const utils = render(<RemindersCard />);
  await flush();
  await flush();
  return utils;
};

let appStateHandler;
beforeEach(() => {
  jest.clearAllMocks();
  mockState = {
    isReminders: false,
    reminderBanis: "[]",
    reminderSound: "default",
    transliterationLanguage: "ENGLISH",
    isTransliteration: false,
  };
  mockHasNotificationPermission.mockImplementation(() => mockCheckPermissions());
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, cb) => {
    appStateHandler = cb;
    return { remove: jest.fn() };
  });
});

describe("an empty list", () => {
  it("shows the four suggested rows without writing anything to the store", async () => {
    const { getAllByTestId } = await open();

    expect(getAllByTestId("reminder-switch")).toHaveLength(4);
    // The old card dispatched setReminderBanis here — the write the account
    // sync carried to every device as four new reminders.
    expect(dispatched("SET_REMINDER_BANIS")).toHaveLength(0);
  });
});

describe("turning the first reminder on", () => {
  it("stays off and explains, in the app's own dialog, when notifications are refused", async () => {
    mockCheckPermissions.mockResolvedValue(false);
    const { getAllByTestId } = await open();

    fireEvent.press(getAllByTestId("reminder-switch")[0]);
    await flush();
    await flush();

    expect(dispatched("TOGGLE_REMINDERS")).toHaveLength(0);
    expect(dispatched("SET_REMINDER_BANIS")).toHaveLength(0);
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Notification Permission Required" })
    );
    mockShowConfirm.mock.calls[0][0].onConfirm();
    expect(mockOpenNotificationSettings).toHaveBeenCalled();
  });

  it("stays off when notifications are allowed but exact alarms are not", async () => {
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(false);
    const { getAllByTestId } = await open();

    fireEvent.press(getAllByTestId("reminder-switch")[0]);
    await flush();
    await flush();

    // This is the exact fault: the switch used to flip on here.
    expect(dispatched("TOGGLE_REMINDERS")).toHaveLength(0);
    expect(mockShowConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Allow alarms & reminders" })
    );
    mockShowConfirm.mock.calls[0][0].onConfirm();
    expect(mockOpenExactAlarmSettings).toHaveBeenCalled();
  });

  it("turns the system on, stores the list with that row enabled, and schedules", async () => {
    mockCheckPermissions.mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    const { getAllByTestId } = await open();

    fireEvent.press(getAllByTestId("reminder-switch")[1]);
    await flush();
    await flush();

    expect(dispatched("TOGGLE_REMINDERS")).toEqual([[{ type: "TOGGLE_REMINDERS", value: true }]]);
    const [write] = dispatched("SET_REMINDER_BANIS");
    const list = JSON.parse(write[0].value);
    expect(list.map((r) => r.enabled)).toEqual([false, true, false, false]);
    expect(mockScheduleReminders).toHaveBeenCalledWith(true, "default", write[0].value, false);
  });

  it("finishes the tap when the user comes back from settings with the permission", async () => {
    mockCheckPermissions.mockResolvedValueOnce(false).mockResolvedValue(true);
    mockCanScheduleExactAlarms.mockResolvedValue(true);
    const { getAllByTestId } = await open();

    fireEvent.press(getAllByTestId("reminder-switch")[0]);
    await flush();
    mockShowConfirm.mock.calls[0][0].onConfirm();
    await act(async () => {
      await appStateHandler("active");
    });
    await flush();

    expect(dispatched("TOGGLE_REMINDERS")).toEqual([[{ type: "TOGGLE_REMINDERS", value: true }]]);
    expect(dispatched("SET_REMINDER_BANIS")).toHaveLength(1);
  });
});

describe("with reminders already on", () => {
  it("writes a toggle through and reschedules without re-checking permissions", async () => {
    const list = [
      { key: 4, id: 4, time: "5:45 AM", enabled: true, translit: "japji" },
      { key: 6, id: 6, time: "6:00 PM", enabled: false, translit: "rehras" },
    ];
    mockState = { ...mockState, isReminders: true, reminderBanis: JSON.stringify(list) };
    const { getAllByTestId } = await open();

    fireEvent.press(getAllByTestId("reminder-switch")[1]);
    await flush();

    expect(mockCheckPermissions).not.toHaveBeenCalled();
    const [write] = dispatched("SET_REMINDER_BANIS");
    expect(JSON.parse(write[0].value)[1].enabled).toBe(true);
    expect(mockScheduleReminders).toHaveBeenCalledWith(true, "default", write[0].value, false);
  });
});

// A tap on a row opens the same edit sheet a reminder row opens in Settings.
const lastSheet = () => mockEditSheet.mock.calls[mockEditSheet.mock.calls.length - 1][0];

describe("tapping a reminder row", () => {
  const list = [
    { key: 4, id: 4, time: "5:45 AM", enabled: true, translit: "japji", title: "Japji" },
    { key: 6, id: 6, time: "6:00 PM", enabled: false, translit: "rehras", title: "Rehras" },
  ];

  it("opens the edit sheet on that reminder", async () => {
    mockState = { ...mockState, isReminders: true, reminderBanis: JSON.stringify(list) };
    const { getByLabelText } = await open();
    expect(lastSheet().visible).toBe(false);

    fireEvent.press(getByLabelText("rehras, Evening, 6:00 PM"));

    expect(lastSheet()).toEqual(
      expect.objectContaining({ visible: true, section: expect.objectContaining({ key: 6 }) })
    );
    expect(mockTrack).toHaveBeenCalledWith("reminder_edit_opened");
    // Opening a stored reminder writes nothing; the sheet does the editing.
    expect(dispatched("SET_REMINDER_BANIS")).toHaveLength(0);
  });

  it("closes the sheet when it asks to", async () => {
    mockState = { ...mockState, isReminders: true, reminderBanis: JSON.stringify(list) };
    const { getByLabelText } = await open();

    fireEvent.press(getByLabelText("japji, Amrit Vela, 5:45 AM"));
    act(() => lastSheet().onClose());

    expect(lastSheet().visible).toBe(false);
  });

  it("leaves the switch to toggle without opening the sheet", async () => {
    mockState = { ...mockState, isReminders: true, reminderBanis: JSON.stringify(list) };
    const { getAllByTestId } = await open();

    fireEvent.press(getAllByTestId("reminder-switch")[1]);
    await flush();

    expect(lastSheet().visible).toBe(false);
  });

  it("stores a suggested row, still off, before opening it — the sheet edits by stored key", async () => {
    const { getAllByRole, rerender } = await open();

    // The fourth suggestion is the night reminder.
    fireEvent.press(getAllByRole("button")[3]);

    const [write] = dispatched("SET_REMINDER_BANIS");
    const stored = JSON.parse(write[0].value);
    expect(stored).toHaveLength(4);
    expect(stored.every((r) => r.enabled === false)).toBe(true);

    mockState = { ...mockState, reminderBanis: write[0].value };
    rerender(<RemindersCard />);
    expect(lastSheet()).toEqual(
      expect.objectContaining({ visible: true, section: expect.objectContaining({ key: 121 }) })
    );
  });
});
