import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Pressable, Animated, AppState, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import components, { bottomNavInset } from "@theme/components";
import { useReaderScopedTheme, useReaderScopedStyles } from "@theme/reader";
import PropTypes from "prop-types";
import {
  ListIcon,
  SettingsIcon,
  MusicIcon,
  ReadIcon,
  DashboardIcon,
  SevaIcon,
} from "@common/icons";
import { pauseTrack } from "@common/TrackPlayerUtils";
import { CustomText, actions, constant, STRINGS, SafeArea } from "@common";
import { getSevaConfig, subscribeSevaDot } from "../../../services/sevaConfig";
import createStyles from "./style";

const BottomNavigation = ({
  activeKey,
  context = "home",
  visible = true,
  navigation: propNavigation,
  themed = undefined,
}) => {
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  const dispatch = useDispatch();
  // WHICH buttons to show comes from `context`; whether to wear the READING
  // theme is a separate question. The two coincide on the Reader, so the default
  // follows context — but Settings opened from the Reader keeps the reader
  // buttons while explicitly opting out of the theme.
  //
  // Off the Reader this resolves to false, so the Home, Dashboard, Seva and
  // Settings tabs are untouched and keep the app appearance.
  const wearsReadingTheme = themed ?? context === "reader";
  const { theme } = useReaderScopedTheme("nav", wearsReadingTheme);
  const styles = useReaderScopedStyles(createStyles, "nav", wearsReadingTheme);

  // iOS pads the bottom inset ITSELF, capped — see below. Android is untouched:
  // it keeps the bottom-edge SafeArea padding the whole navigation-bar inset,
  // which is the behaviour already verified on device.
  const capsOwnInset = Platform.OS === "ios";
  const { bottom: insetBottom } = useSafeAreaInsets();
  const iosInsetPad = capsOwnInset ? bottomNavInset(insetBottom) : 0;

  const isAudio = useSelector((state) => state.isAudio);
  const isAutoScroll = useSelector((state) => state.isAutoScroll);
  const isAudioFeatureEnabled = useSelector((state) => state.isAudioFeatureEnabled);
  const language = useSelector((state) => state.language); // also drives the Seva content language
  const isAudioFeatureOn = isAudioFeatureEnabled ?? true;

  // 0 = no dot, 1 = plain dot, 2+ = numbered badge (see render below).
  const [sevaDotCount, setSevaDotCount] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;

  // Helper function to get current route name
  const getCurrentRouteName = useCallback(() => {
    const navState = navigation.getState();
    return navState?.routes[navState?.index]?.name;
  }, [navigation]);

  // Animate visibility (slide down when hidden). Stop the animation on unmount
  // so a mid-flight native-driver animation can't try to connect to a view that
  // was already torn down (the "Animated node does not exist" native crash —
  // this component mounts/unmounts a lot across screens).
  useEffect(() => {
    const anim = Animated.timing(translateY, {
      toValue: visible ? 0 : 100,
      duration: 300,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      translateY.stopAnimation();
    };
  }, [visible, translateY]);

  // Load the seva dot state from config, then stay subscribed: markSevaSeen()
  // (fired when the user opens the Seva page) pushes an immediate clear here, so
  // the dot disappears without waiting for the next refetch. Also re-checks on
  // every foreground — without this, a version bump pushed while the app was
  // already open (backgrounded or just idle) would never surface until the
  // user fully force-closed and relaunched, which for most users is rare to
  // never once the app is already installed and running.
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      getSevaConfig(language)
        .then((cfg) => {
          if (!cancelled) setSevaDotCount(cfg?.sevaDotCount ?? 0);
        })
        .catch(() => {});
    };
    refresh();
    const unsubscribe = subscribeSevaDot((count) => {
      if (!cancelled) setSevaDotCount(count);
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      cancelled = true;
      unsubscribe();
      appStateSub.remove();
    };
  }, []);

  // Connectivity is handled globally and event-driven now: NetworkProvider is
  // the single source of truth, and useOfflinePlaybackGuard (mounted once in
  // GlobalServices) stops streaming playback when real internet is lost. The
  // old per-instance polling watchdog that lived here has been removed.

  // Standard home screen navigator items
  const homeNavigationItems = [
    {
      key: "Home",
      // "All Banis" list tab — a list icon + label instead of the old Home
      // house icon / "Home" string (the Home tab IS the full Banis list).
      icon: ListIcon,
      handlePress: () => {
        navigation.navigate("Home");
      },
      text: STRINGS.ALL_BANIS,
    },
    {
      key: "Dashboard",
      icon: DashboardIcon,
      handlePress: () => {
        navigation.navigate(constant.DASHBOARD);
      },
      text: STRINGS.DASHBOARD,
    },
    {
      key: "Seva",
      icon: SevaIcon,
      showDot: sevaDotCount,
      handlePress: () => {
        navigation.navigate(constant.SEVA);
      },
      text: STRINGS.SEVA,
    },
    {
      key: "Settings",
      icon: SettingsIcon,
      handlePress: () => {
        navigation.navigate(constant.SETTINGS);
      },
      text: STRINGS.SETTINGS,
    },
  ];

  // Reader-specific navigation items (strictly matches all logic & dispatches)
  const readerNavigationItems = [
    {
      key: "Home",
      icon: ListIcon,
      handlePress: async () => {
        if (isAudio) {
          await pauseTrack();
          dispatch(actions.toggleAudio(false));
        }
        navigation.popToTop();
      },
      text: STRINGS.ALL_BANIS, // Maps to "All Banis" localization key
    },
    {
      key: "Read",
      icon: ReadIcon,
      handlePress: async () => {
        if (isAudio) {
          await pauseTrack();
          dispatch(actions.toggleAudio(false));
        }

        const currentNavRoute = getCurrentRouteName();
        if (currentNavRoute === constant.SETTINGS) {
          navigation.goBack();
        }
      },
      text: STRINGS.READ,
    },
    {
      key: "Music",
      icon: MusicIcon,
      handlePress: async () => {
        if (!isAudioFeatureOn) {
          dispatch(actions.toggleAudioFeatureEnabled(true));
        }

        if (isAutoScroll) {
          dispatch(actions.toggleAutoScroll(false));
          dispatch(actions.toggleAudioFeatureEnabled(true));
        }

        const currentNavRoute = getCurrentRouteName();

        if (currentNavRoute === constant.SETTINGS) {
          if (isAudio) {
            navigation.goBack();
            return;
          }
          navigation.goBack();
        }

        if (isAudio) {
          return;
        }

        dispatch(actions.toggleAudio(true));
      },
      text: STRINGS.MUSIC,
    },
    {
      key: "Settings",
      icon: SettingsIcon,
      handlePress: async () => {
        if (isAudio) {
          await pauseTrack();
        }
        navigation.navigate(constant.SETTINGS, { fromReader: true });
      },
      text: STRINGS.SETTINGS,
    },
  ];

  const navigationItems = context === "reader" ? readerNavigationItems : homeNavigationItems;

  return (
    <Animated.View
      style={{
        transform: [{ translateY }],
      }}
    >
      {/* WHO pads the bottom inset, and how much of it, is the platform
          difference here.

          Android: unchanged. The SafeArea pads the whole inset, because there
          that inset is the system navigation bar — real back/home/recents keys
          on three-button devices — and the bar has to sit clear above it.

          iOS: the SafeArea is given no edges and the container pads a CAPPED
          inset instead (`bottomNavInset`). Letting it pad all 34pt of the home
          indicator put a second gap under a 65pt box that already carries its
          own room below the row, and the bar stood ~99pt tall — the band of nav
          colour below the icons. The indicator is an overlay, not an
          obstruction, so 20pt is clearance enough.

          The pad is added to `minHeight` as well as `paddingBottom`: RN sizes
          minHeight against the PADDING box, so padding alone would have eaten
          the row's own 65pt rather than sitting below it. */}
      <SafeArea backgroundColor={theme.c.primary} edges={capsOwnInset ? [] : ["bottom"]} flex={0}>
        <View
          style={[
            styles.container,
            iosInsetPad
              ? {
                  paddingBottom: iosInsetPad,
                  minHeight: components.bottomNavigation.height + iosInsetPad,
                }
              : null,
          ]}
        >
          <View style={styles.navigationBar}>
            {navigationItems.map((item) => {
              const IconComponent = item.icon;

              return (
                <Pressable
                  key={item.key}
                  style={styles.iconContainer}
                  onPress={item.handlePress}
                  accessibilityRole="button"
                  accessibilityLabel={`bottomnav-${item.key}`}
                >
                  <View style={item.key === activeKey ? styles.activeIconContainer : null}>
                    <View style={{ position: "relative" }}>
                      <IconComponent
                        size={24}
                        color={
                          item.key === activeKey
                            ? theme.c.primary
                            : theme.c.onPrimary
                        }
                      />
                      {item.showDot > 0 && (
                        <View
                          style={{
                            position: "absolute",
                            // A plain dot has no digits to hold, so it is a
                            // small 10px circle; only the numbered badge needs
                            // the larger 16px box (and it sits slightly
                            // further out to clear the icon).
                            top: item.showDot > 1 ? -7 : -4,
                            right: item.showDot > 1 ? -9 : -5,
                            backgroundColor: theme.c.error,
                            borderRadius: item.showDot > 1 ? 9 : 5,
                            minWidth: item.showDot > 1 ? 16 : 10,
                            height: item.showDot > 1 ? 16 : 10,
                            alignItems: "center",
                            justifyContent: "center",
                            paddingHorizontal: item.showDot > 1 ? 2 : 0,
                            borderWidth: 1.2,
                            borderColor:
                              item.key === activeKey
                                ? theme.c.onPrimary
                                : theme.c.primary,
                          }}
                        >
                          {/* 1 = plain dot, no text; 2+ = the real count */}
                          {item.showDot > 1 && (
                            <CustomText
                              style={{
                                color: theme.c.onError,
                                fontSize: 9,
                                fontWeight: "bold",
                                fontFamily: theme.typography.fonts.balooPaajiSemiBold,
                                textAlign: "center",
                                lineHeight: 13,
                              }}
                            >
                              {item.showDot}
                            </CustomText>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                  {activeKey !== item.key && (
                    <CustomText style={styles.iconText}>{item.text}</CustomText>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeArea>
    </Animated.View>
  );
};

BottomNavigation.propTypes = {
  activeKey: PropTypes.string.isRequired,
  context: PropTypes.oneOf(["home", "reader"]),
  visible: PropTypes.bool,
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
  /**
   * Wear the reading theme? Defaults to `context === "reader"`. Set false to
   * keep the reader BUTTONS while staying on the app appearance — Settings
   * opened from the Reader does exactly that.
   */
  themed: PropTypes.bool,
};

export default BottomNavigation;
