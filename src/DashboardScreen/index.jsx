import React, { useState, useCallback, useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, InteractionManager } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { themeForScreen } from "@theme/screenPalettes";
import useSsoActions from "@common/hooks/useSsoActions";
import {
  SafeArea,
  StatusBarComponent,
  useTheme,
  logError,
  trackDashboardEvent,
  trackJourneyView,
} from "@common";
import { PullToRefresh } from "../common/components/ui";
import { getOrCreateSummary } from "../database/analytics";
import { useRestoreTick } from "../services/dashboard/restoreSignal";
import { requestPull } from "../services/dashboard/syncSignal";
import { computeStreaks } from "../services/streakEngine";
import DashboardHeader from "./components/DashboardHeader";
import { SECTION_REGISTRY } from "./components/sectionRegistry";
import SectionsModal from "./components/SectionsModal";

// Registry-driven dashboard. Sections render in the user's persisted order and
// visibility (see dashboardLayout slice). Add a new section by registering it in
// sectionRegistry.js + reducer.js DEFAULT_DASHBOARD_ORDER.
const DashboardScreen = () => {
  const { theme } = useTheme();
  // The Dashboard's own colours, resolved through the shared role names.
  const { c } = themeForScreen(theme, "dashboard");
  const navigation = useNavigation();
  useSelector((state) => state.language);
  const layout = useSelector((state) => state.dashboardLayout);

  const [refreshKey, setRefreshKey] = useState(0);
  const [sectionsVisible, setSectionsVisible] = useState(false);

  // Where each section sits down the page, so the Sections sheet can jump to
  // one. Filled by each section's own onLayout — a ref rather than state
  // because nothing renders from it and a setState per section on every layout
  // pass would re-render the whole page for no visible change.
  const scrollRef = useRef(null);
  const sectionTopsRef = useRef({});
  const noteSectionTop = useCallback((key, y) => {
    sectionTopsRef.current[key] = y;
  }, []);

  // Close first, then scroll. Scrolling under a sheet that is still on screen
  // is invisible, and the modal's dismissal animation would race the scroll.
  const jumpToSection = useCallback((key) => {
    setSectionsVisible(false);
    const y = sectionTopsRef.current[key];
    if (y == null) return;
    InteractionManager.runAfterInteractions(() => {
      // A few points above the section, so its heading is not flush against
      // the top edge of the viewport.
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
    });
  }, []);

  // Avatar affordance: sign in directly when signed out, otherwise open
  // Settings, where the account details and sign-out live.
  const { status: authStatus, signIn } = useSsoActions({ entryPoint: "dashboard_header" });
  const handleAvatarPress = useCallback(() => {
    if (authStatus === "signedIn") {
      navigation.navigate("Settings");
      return;
    }
    signIn();
  }, [authStatus, navigation, signIn]);

  // Sync itself runs app-wide from GlobalServices, not here — see
  // services/dashboard/useDashboardSync. This screen only listens for the
  // moment a restore settles.
  const restoreTick = useRestoreTick();

  // Pull to refresh. The scheduled pull is throttled to once every few minutes,
  // which is right for a background poll and wrong for someone who has just
  // walked to their other device and wants their reading to appear. This is the
  // manual override; `requestPull` resolves when the pull has actually
  // finished, so the spinner reflects the request rather than a fixed delay.
  // Only at the top does a downward drag mean a refresh rather than a scroll.
  const [atTop, setAtTop] = useState(true);
  const onRefresh = useCallback(() => {
    trackDashboardEvent("refreshed");
    return requestPull("pull-to-refresh");
  }, []);

  // Sections that fetch their own data on mount (YourPractice, MonthCalendar)
  // race the restore's SQLite writes — on a fresh install, they can fetch
  // before the restore has written anything and then never look again. Force
  // one guaranteed refetch the moment the restore attempt actually settles,
  // instead of relying on the unrelated focus-driven refresh below to happen
  // to land afterward.
  useEffect(() => {
    if (restoreTick > 0) setRefreshKey((k) => k + 1);
  }, [restoreTick]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      // Defer SQLite work until after the navigation animation to avoid bridge
      // contention with the Reader's saveSession writes that fire on blur.
      const task = InteractionManager.runAfterInteractions(async () => {
        try {
          await computeStreaks();
          const summary = await getOrCreateSummary();
          if (active && summary) {
            trackJourneyView(summary.current_streak ?? 0, summary.total_days_active ?? 0).catch(
              () => {}
            );
          }
        } catch (err) {
          logError(err);
        }
        if (active) setRefreshKey((k) => k + 1);
      });
      return () => {
        active = false;
        task.cancel();
      };
    }, [])
  );

  const bg = c.backgroundAlt;
  const visibleSections = layout.order.filter(
    (key) => !layout.hidden.includes(key) && SECTION_REGISTRY[key]
  );

  return (
    <SafeArea backgroundColor={bg} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor="transparent" />

      {/* The app's one pull control, the same component the Folders tab uses,
          so the two screens cannot drift apart and both follow the theme. The
          platform control this replaces could not: on Android `tintColor` is
          ignored, and it drew Android's own white disc and accent arc whatever
          the theme was. */}
      <PullToRefresh atTop={atTop} onRefresh={onRefresh} surface={bg}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: bg }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => setAtTop(event.nativeEvent.contentOffset.y <= 0)}
        >
          <DashboardHeader
            onMenuPress={() => {
              trackDashboardEvent("sections_sheet_opened");
              setSectionsVisible(true);
            }}
            onClosePress={() => navigation.navigate("Home")}
            onAvatarPress={handleAvatarPress}
          />

          {visibleSections.map((key) => {
            const { Component } = SECTION_REGISTRY[key];
            return (
              <View
                key={key}
                style={styles.section}
                // y is relative to the scroll content, which is exactly what
                // scrollTo takes — no measure() round trip needed.
                onLayout={(e) => noteSectionTop(key, e.nativeEvent.layout.y)}
              >
                <Component refreshKey={refreshKey} />
              </View>
            );
          })}
        </ScrollView>
      </PullToRefresh>

      <SectionsModal
        visible={sectionsVisible}
        onClose={() => setSectionsVisible(false)}
        onSelectSection={jumpToSection}
      />
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
  },
});

export default DashboardScreen;
