import { createContext, useContext } from "react";

/**
 * Optimistic default — used before the first NetInfo result arrives and as a
 * graceful fallback when a consumer renders outside a NetworkProvider (e.g. in
 * unit tests). "Unknown" is deliberately treated as ONLINE so the UI never
 * falsely degrades (greys tracks, blocks features) during the startup window.
 */
export const DEFAULT_NETWORK_STATE = {
  isConnected: null,
  isInternetReachable: null,
  type: "unknown",
  isWifi: false,
  isCellular: false,
  isExpensive: false,
  isOffline: false,
  isOnline: true,
};

const NetworkContext = createContext(DEFAULT_NETWORK_STATE);

/**
 * Single source of truth for connectivity across the whole app (audio today,
 * and any future non-audio features). Real-time and event-driven — re-renders
 * the instant the OS reports a change.
 *
 * Returns:
 *   isConnected           raw link state (null until known)
 *   isInternetReachable   validated real-internet (captive-portal aware)
 *   type                  'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown' | …
 *   isWifi / isCellular   convenience type flags
 *   isExpensive           connection is metered (avoid heavy auto-downloads)
 *   isOffline / isOnline  derived verdict — use these for UI gating
 */
export const useNetwork = () => useContext(NetworkContext);

export default NetworkContext;
