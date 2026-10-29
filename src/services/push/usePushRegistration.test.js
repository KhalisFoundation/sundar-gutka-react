/* eslint-env jest */
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook } from "@testing-library/react-native";
import usePushRegistration from "./usePushRegistration";

let mockState;
jest.mock("react-redux", () => ({ useSelector: (fn) => fn(mockState) }));
jest.mock("react-native-device-info", () => ({ getVersion: () => "7.0.0" }));

const mockSubscribe = jest.fn(() => Promise.resolve());
const mockUnsubscribe = jest.fn(() => Promise.resolve());
jest.mock("@react-native-firebase/messaging", () => ({
  getMessaging: () => ({}),
  getToken: () => Promise.resolve("fcm-token"),
  onMessage: () => () => {},
  onTokenRefresh: () => () => {},
  subscribeToTopic: (_m, topic) => mockSubscribe(topic),
  unsubscribeFromTopic: (_m, topic) => mockUnsubscribe(topic),
}));
jest.mock("@common/firebase/crashlytics", () => ({ logError: jest.fn(), logMessage: jest.fn() }));
let mockHasPermission = true;
const mockRequestPermission = jest.fn(() => Promise.resolve(true));
jest.mock("@common/notifications", () => ({
  hasNotificationPermission: () => Promise.resolve(mockHasPermission),
  requestNotificationPermission: (...a) => mockRequestPermission(...a),
}));
const mockRegister = jest.fn(() => Promise.resolve({ ok: true, data: {} }));
jest.mock("./pushApi", () => ({
  registerPushDevice: (...a) => mockRegister(...a),
  detachPushDevice: jest.fn(() => Promise.resolve({ ok: true })),
}));
jest.mock("./pushMessages", () => ({
  displayRemoteMessage: jest.fn(),
  ensurePushChannel: () => Promise.resolve(),
}));

const settle = () =>
  act(async () => {
    await new Promise((resolve) => {
      setImmediate(resolve);
    });
  });

describe("usePushRegistration", () => {
  let foreground;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    jest.spyOn(AppState, "addEventListener").mockImplementation((_type, handler) => {
      foreground = () => handler("active");
      return { remove: () => {} };
    });
    mockState = { auth: { status: "signedOut", user: null }, language: "en-US" };
    mockHasPermission = true;
    mockRequestPermission.mockImplementation(() => Promise.resolve(true));
  });

  afterEach(() => jest.useRealTimers());

  // notifee's request never settles on Android 13+ once the user has denied.
  // Unbounded, the registration behind it never finished.
  it("still registers when the permission request never answers", async () => {
    jest.useFakeTimers();
    mockHasPermission = false;
    mockRequestPermission.mockImplementation(() => new Promise(() => {}));
    renderHook(() => usePushRegistration());
    await act(async () => {
      await jest.advanceTimersByTimeAsync(11000);
    });
    expect(mockRegister).toHaveBeenCalledTimes(1);
  });

  it("asks for permission once per install, not on every launch", async () => {
    mockHasPermission = false;
    const first = renderHook(() => usePushRegistration());
    await settle();
    first.unmount();
    renderHook(() => usePushRegistration());
    await settle();
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  // A sign-in landing while the launch registration is out must still attach
  // the device to the account, rather than join a run that read "signed out".
  it("runs again for a sign-in that lands mid-registration", async () => {
    let release;
    mockRegister.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({ ok: true, data: {} });
        })
    );
    const { rerender } = renderHook(() => usePushRegistration());
    await settle();
    expect(mockRegister).toHaveBeenCalledTimes(1);

    mockState = { ...mockState, auth: { status: "signedIn", user: { email: "a@x" } } };
    rerender();
    await act(async () => {
      release();
    });
    await settle();
    expect(mockRegister).toHaveBeenCalledTimes(2);
  });

  // The foreground listener is attached once, on mount. Reading the language
  // from that first render's closure moved the device back to the launch-time
  // language's topics every time the app came back to the front.
  it("registers a return to the foreground in the CURRENT language", async () => {
    const { rerender } = renderHook(() => usePushRegistration());
    await settle();

    mockState = { ...mockState, language: "pa" };
    rerender();
    await settle();

    mockRegister.mockClear();
    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
    await act(async () => {
      foreground();
    });
    await settle();

    expect(mockRegister).not.toHaveBeenCalledWith(expect.objectContaining({ language: "en" }));
    expect(mockSubscribe).not.toHaveBeenCalledWith(expect.stringMatching(/en$/));
    expect(mockUnsubscribe).not.toHaveBeenCalledWith(expect.stringMatching(/pa$/));
  });
});
