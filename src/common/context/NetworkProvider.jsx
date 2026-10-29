import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import NetInfo from "@react-native-community/netinfo";
import { configureNetwork } from "../services/networkManager";
import NetworkContext, { DEFAULT_NETWORK_STATE } from "./NetworkContext";

// Configure NetInfo once, at import time, before any listener is attached.
configureNetwork();

/**
 * Collapse a raw NetInfo state into our normalized, UI-friendly shape.
 *
 * `isOffline` is intentionally conservative: only an explicit `false` for
 * connection OR validated reachability counts as offline. `null` (the unknown
 * startup window, or before the first reachability probe completes) stays
 * ONLINE so we never falsely degrade the UI. A captive portal — connected but
 * no real internet — correctly resolves to offline via isInternetReachable.
 */
const normalize = (state) => {
  const type = state?.type ?? "unknown";
  const isConnected = state?.isConnected ?? null;
  const isInternetReachable = state?.isInternetReachable ?? null;
  const isOffline = isConnected === false || isInternetReachable === false;

  return {
    isConnected,
    isInternetReachable,
    type,
    isWifi: type === "wifi",
    isCellular: type === "cellular",
    isExpensive: Boolean(state?.details?.isConnectionExpensive),
    isOffline,
    isOnline: !isOffline,
  };
};

/**
 * Subscribes ONCE to the native connectivity signal for the entire app
 * (iOS: NWPathMonitor, Android: ConnectivityManager NetworkCallback) and shares
 * the result via context — so we have a single native listener, not one per
 * component. Push-based: zero cost when idle, instant on change.
 */
const NetworkProvider = ({ children }) => {
  const [state, setState] = useState(DEFAULT_NETWORK_STATE);

  useEffect(() => {
    let isMounted = true;

    // Seed immediately so the first paint isn't stuck on the default longer
    // than necessary, then keep it live via the subscription.
    NetInfo.fetch().then((initial) => {
      if (isMounted) setState(normalize(initial));
    });

    const unsubscribe = NetInfo.addEventListener((next) => {
      if (isMounted) setState(normalize(next));
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

NetworkProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NetworkProvider;
