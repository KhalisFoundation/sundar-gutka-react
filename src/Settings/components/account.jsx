import React from "react";
import { Platform } from "react-native";
import { Spinner } from "@common/components/ui";
import useSsoActions from "@common/hooks/useSsoActions";
import useTokens from "@common/hooks/useTokens";
import { STRINGS } from "@common";
import SettingsRow from "./comon/SettingsRow";

// Khalis SSO account rows. Signed out this is a single "Sign In" row; signed in
// it becomes a non-interactive identity row (name + email) followed by a
// "Sign Out" row.
//
// Sign-out deliberately lives here and nowhere else — the Dashboard avatar only
// navigates here — so the app has exactly one destructive surface.
const Account = () => {
  const { c } = useTokens();
  const { status, user, busy, signIn, signOut, deleteAccount } = useSsoActions({
    entryPoint: "settings",
  });

  // iOS ONLY, and that is the whole scope of this change.
  //
  // App Review requires an in-app way to delete the account for any app that
  // creates one, and requires it to be a real control in the app rather than a
  // link to support — which is why it sits here in Settings beside Sign Out.
  // Play has no equivalent requirement today, and the deletion is permanent
  // after its grace period, so it is not offered where it is not asked for.
  const canDeleteAccount = Platform.OS === "ios";

  const spinner = busy ? <Spinner size="small" color={c.textSecondary} /> : undefined;

  if (status === "signedIn" && user) {
    const fullName = [user.firstname, user.lastname].filter(Boolean).join(" ");
    return (
      <>
        {/* No onPress: this row is the account itself, not a way to somewhere.
            SettingsRow only draws a chevron for rows that navigate. */}
        <SettingsRow
          title={fullName || STRINGS.USER}
          subtitle={user.email || undefined}
          icon="account-circle"
        />
        <SettingsRow
          title={STRINGS.SIGN_OUT}
          icon="logout"
          onPress={busy ? undefined : signOut}
          trailing={spinner}
          disabled={busy}
        />
        {canDeleteAccount && (
          /* Last in the group, and the only destructive row on the screen. The
             confirmation, its copy and every "what do we clear" decision live in
             useSsoActions.deleteAccount — this is only the way in. */
          <SettingsRow
            title={STRINGS.DELETE_ACCOUNT}
            icon="delete-forever"
            destructive
            onPress={busy ? undefined : deleteAccount}
            disabled={busy}
            testID="delete-account-row"
          />
        )}
      </>
    );
  }

  // "unknown" means the Keychain read is still in flight. It resolves in well
  // under a second, so the row renders in place but disabled rather than
  // popping in late and shifting the section.
  //
  // The subtitle is the same note the Dashboard carries in its header: what
  // signing in buys. Only on the settled "signedOut" state — during "unknown"
  // an already signed-in person would otherwise be told to sign in.
  return (
    <SettingsRow
      title={STRINGS.SIGN_IN}
      subtitle={status === "signedOut" ? STRINGS.SETTINGS_SIGN_IN_HINT : undefined}
      icon="login"
      onPress={signIn}
      trailing={spinner}
      disabled={status === "unknown" || busy}
    />
  );
};

export default Account;
