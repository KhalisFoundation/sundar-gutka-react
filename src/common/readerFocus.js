import { useEffect, useState } from "react";

// Whether the Reader is the screen currently on top.
//
// It exists for the app's two ROOT-LEVEL overlay hosts — the confirm dialog and
// the toast. Both are mounted in app.js as siblings of <Navigation/>, so they
// sit outside the navigation tree and cannot use useIsFocused(), and outside the
// Reader's subtree so they cannot inherit its theme scope either. But a
// "Remove downloaded audio?" dialog raised from the audio player appears ON the
// reading page, and an app-blue card over a parchment page reads as broken.
//
// A module-level store rather than context or redux:
//   • context would mean wrapping app.js in another provider whose value only
//     two leaves read, and re-rendering the whole tree on every navigation;
//   • redux would put transient navigation state into a persisted store.
// It mirrors the imperative `hostListener` pattern ConfirmDialog already uses
// for the same reason — these hosts are driven from outside React.
//
// Written by the navigation container's state listener, which is the one place
// that already knows the current route.

let focused = false;
const listeners = new Set();

/** Called by the navigation container whenever the route changes. */
export const setReaderFocused = (next) => {
  const value = Boolean(next);
  if (value === focused) return;
  focused = value;
  listeners.forEach((listener) => listener(value));
};

export const isReaderFocused = () => focused;

/** Re-renders the caller whenever the Reader gains or loses focus. */
export const useReaderFocused = () => {
  const [value, setValue] = useState(focused);
  useEffect(() => {
    listeners.add(setValue);
    // Sync on mount: a host can mount after the route has already settled, and
    // a toast host in particular mounts once and outlives every screen.
    setValue(focused);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
};

export default useReaderFocused;
