import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useSelector } from "react-redux";
import { useNetwork } from "@common";
import { syncAll } from "./syncRegistry";

/**
 * Runs the bulk two-way sync of every registered feature (see syncRegistry)
 * at the moments the account's changes can have moved on without this phone:
 * signing in, coming back to the foreground, and connectivity returning.
 *
 * The outbox only sends what THIS device changed. Without these moments a
 * phone signed into an account would never take back what another device
 * changed, including on the first sign-in, where the account's settings
 * should arrive at once.
 *
 * Signed in only: signed out there is no account to sync with. `syncAll`
 * joins a run already in flight, so moments that land together cost one sync.
 */
const useAccountSync = () => {
  const signedIn = useSelector((state) => state.auth?.status === "signedIn");
  const { isOffline } = useNetwork();
  const signedInRef = useRef(signedIn);
  signedInRef.current = signedIn;

  // Signing in (including a session restored at launch).
  useEffect(() => {
    if (signedIn) syncAll();
  }, [signedIn]);

  // Connectivity returning — not the first reading, which is not a change.
  const wasOfflineRef = useRef(isOffline);
  useEffect(() => {
    const wasOffline = wasOfflineRef.current;
    wasOfflineRef.current = isOffline;
    if (wasOffline && !isOffline && signedInRef.current) syncAll();
  }, [isOffline]);

  // Back to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && signedInRef.current) syncAll();
    });
    return () => sub.remove();
  }, []);
};

export default useAccountSync;
