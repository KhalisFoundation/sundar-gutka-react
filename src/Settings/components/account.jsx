import React from "react";
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
        {/* On both platforms: App Review and Google Play both require an
            in-app way to delete an account the app signs people into, as a
            real control rather than a link to support. Last in the group and
            the only destructive row on the screen; the confirmation, its copy
            and every "what do we clear" decision live in
            useSsoActions.deleteAccount — this is only the way in. */}
        <SettingsRow
          title={STRINGS.DELETE_ACCOUNT}
          icon="delete-forever"
          destructive
          onPress={busy ? undefined : deleteAccount}
          disabled={busy}
          testID="delete-account-row"
        />
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
