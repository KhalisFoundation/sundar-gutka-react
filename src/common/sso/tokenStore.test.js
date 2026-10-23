/* eslint-env jest */
import * as Keychain from "react-native-keychain";
import { saveToken } from "./tokenStore";

jest.mock("../firebase/crashlytics", () => ({ logError: jest.fn() }));

// react-native-keychain reports a failed store by resolving `false`, not by
// throwing. Read as success, a session began with no token behind it.
it("reports a store the Keychain refused as a failure", async () => {
  Keychain.setGenericPassword.mockResolvedValueOnce(false);
  expect(await saveToken("jwt")).toBe(false);
});

it("reports a stored token as saved", async () => {
  Keychain.setGenericPassword.mockResolvedValueOnce({ service: "khalis_sso" });
  expect(await saveToken("jwt")).toBe(true);
});
