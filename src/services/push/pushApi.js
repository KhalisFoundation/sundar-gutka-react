import { readToken } from "@common/sso/tokenStore";
import { constant } from "@common";
import { request } from "../khalisRequest";

// The Khalis push device registry — khalis-users-api, src/push.
//
//   PUT    /push/devices           register or refresh this device's token;
//                                  attaches it to the account when a bearer
//                                  token is sent, registers anonymously when not
//   DELETE /push/devices/:token    detach from the account (sign-out); the row
//                                  stays so broadcast campaigns still arrive
//   DELETE /push/devices/:token?forget=1   forget the token entirely
//
// Registration deliberately does not go through `authedRequest`: that answers
// `401 signed-out` without a token, and a signed-out device still has to
// register so a campaign to everyone reaches it.

const BASE = constant.PUSH_DEVICES_API_URL;

export const registerPushDevice = async (body) => {
  const token = await readToken();
  return request(BASE, { method: "PUT", body, token: token || undefined });
};

export const detachPushDevice = (fcmToken) =>
  request(`${BASE}/${encodeURIComponent(fcmToken)}`, { method: "DELETE" });

export const forgetPushDevice = (fcmToken) =>
  request(`${BASE}/${encodeURIComponent(fcmToken)}?forget=1`, { method: "DELETE" });

export default { registerPushDevice, detachPushDevice, forgetPushDevice };
