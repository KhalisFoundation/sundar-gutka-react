// The one way a session begins or ends, wherever it was asked for.
//
// useSsoSession owns the session's lifecycle: the account check before a
// session is announced, the expiry timer, and the Keychain. Sign-in, sign-out
// and account deletion are started from screens (useSsoActions), and each
// used to repeat a part of that by hand. A sign-in on iOS then had no expiry
// timer (its only path), and a session ended by sign-out or deletion left the
// old timer armed to report a second, phantom expiry later. So the mounted
// hook registers its own begin and end here, and every caller goes through
// them.

let handlers = null;

export const registerSessionHandlers = (next) => {
  handlers = next;
  return () => {
    if (handlers === next) handlers = null;
  };
};

/** Account check, then announce the session and arm its expiry timer. */
export const beginSession = async (user, expiresAt) => {
  if (!handlers) throw new Error("SSO session handlers are not mounted");
  return handlers.begin(user, expiresAt);
};

/** Clear the token, the auth slice and any expiry timer. */
export const endSession = async (options) => {
  if (!handlers) throw new Error("SSO session handlers are not mounted");
  return handlers.end(options);
};
