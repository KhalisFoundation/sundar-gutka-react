import { useCallback, useRef } from "react";
import { openInAppBrowser } from "@common";

/**
 * Opens a URL in the in-app browser, at most one tab at a time, in the screen's
 * own bar colours. `isOpenRef` lets a caller refuse work that only makes sense
 * when the tab actually opens (the Donate funnel events).
 *
 * KNOWN: the guard is released when open() settles. iOS settles it when the
 * browser is dismissed, which backgrounding the app does not do; a promise
 * that never settled would leave links on this screen dead until it remounts.
 * Not seen in practice. A fix (release on refocus) is planned in an upcoming PR.
 */
const useBrowserOnce = (c) => {
  const isOpenRef = useRef(false);
  const open = useCallback(
    async (url) => {
      if (!url || isOpenRef.current) return;
      isOpenRef.current = true;
      try {
        await openInAppBrowser(url, { barColor: c.surface, controlColor: c.textPrimary });
      } finally {
        isOpenRef.current = false;
      }
    },
    [c.surface, c.textPrimary]
  );
  return { open, isOpenRef };
};

export default useBrowserOnce;
