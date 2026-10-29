import { useCallback, useRef } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

/**
 * Handles the Android hardware back button for the screen that is ON SCREEN.
 *
 * ── Why focus and not mount ────────────────────────────────────────────────
 * Mounted is not the same as visible. A bottom-tab screen stays mounted from
 * the first time it is visited, and a native-stack screen stays mounted
 * underneath whatever is pushed on top of it. So at any moment several screens
 * the user cannot see are still mounted.
 *
 * This used to subscribe in a plain `useEffect`, which meant every one of those
 * invisible screens also held a live `hardwareBackPress` listener. BackHandler
 * calls listeners most-recently-registered first and stops at the first one
 * returning true, so a back press was answered by whichever screen happened to
 * subscribe last — not by the one being looked at. Settings' handler in
 * particular returns true unconditionally and asks `canGoBack()` on the TAB
 * navigator, which answers a different question than the root stack was asked.
 *
 * The visible outcome was pressing back on Folders, Manage Downloads, Set
 * Reminder, Database Update or About and having the app exit: those four have
 * no handler of their own, so the press went to a stale listener from a screen
 * elsewhere in the tree instead of popping the stack.
 *
 * `useFocusEffect` subscribes on focus and unsubscribes on blur, so exactly one
 * listener is live — the focused screen's — and screens with no handler of
 * their own fall through to React Navigation's own back behaviour, which pops
 * the stack correctly. This is the pattern React Navigation documents.
 *
 * ── Why the handler lives in a ref ─────────────────────────────────────────
 * Callers pass inline arrows (`useBackHandler(() => {...})`), which are a new
 * function every render. Keying the subscription on that identity would tear
 * down and re-register the listener on every single render. Reading it through
 * a ref keeps one stable subscription per focus while still calling the latest
 * handler.
 *
 * @param {() => boolean} [handleBackPress] Return true to consume the press.
 *   Omit it to get the default: pop this screen.
 */
const useBackHandler = (handleBackPress) => {
  const navigation = useNavigation();
  const handlerRef = useRef(handleBackPress);
  handlerRef.current = handleBackPress;

  useFocusEffect(
    useCallback(() => {
      const handleBack = () => {
        const handler = handlerRef.current;
        if (typeof handler === "function") return handler();
        navigation.goBack();
        return true;
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", handleBack);
      return () => subscription.remove();
    }, [navigation])
  );
};

export default useBackHandler;
