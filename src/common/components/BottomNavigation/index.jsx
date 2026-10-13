import React, { useEffect, useCallback, useRef } from "react";
import { View, Pressable, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import components, { bottomNavInset } from "@theme/components";
import { useReaderScopedTheme, useReaderScopedStyles } from "@theme/reader";
import PropTypes from "prop-types";
import { ListIcon, SettingsIcon, MusicIcon, ReadIcon } from "@common/icons";
import { pauseTrack, stopTrack, resetPlayer } from "@common/TrackPlayerUtils";
import {
  CustomText,
  actions,
  constant,
  STRINGS,
  SafeArea,
  showErrorToast,
  useNetwork,
} from "@common";
import createStyles from "./style";

const BottomNavigation = ({
  activeKey,
  context = "reader",
  visible = true,
  navigation: propNavigation = undefined,
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
  // Off the Reader this resolves to false, so screens outside it keep the app
  // appearance.
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
  const isAudioFeatureOn = isAudioFeatureEnabled ?? true;
  const { isOffline } = useNetwork();

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

  // Connectivity is handled globally and event-driven now: NetworkProvider is
  // the single source of truth, and useOfflinePlaybackGuard (mounted once in
  // GlobalServices) pauses streaming playback when real internet is lost. The
  // old per-instance polling watchdog that lived here has been removed. The
  // Music button still checks before starting, below.

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

        // The audio player here streams every track, so there is nothing to
        // play offline. Hard shutdown to clear the Android notification player,
        // and say why. (The downloads PR brings offline playback and drops this.)
        // KNOWN: on iOS `isOffline` means no connection at all: Wi-Fi with no
        // internet (a captive portal) passes, and playback fails in the player
        // instead. Deliberate, since the internet probe that caught it reads as
        // offline wherever its host is blocked (see networkManager.js).
        if (isOffline) {
          await stopTrack();
          await resetPlayer();
          dispatch(actions.toggleAudio(false));
          showErrorToast(STRINGS.NETWORK_ERROR);
          return;
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

  // The home tab bar (All Banis / Dashboard / Seva / Settings) arrives with the
  // tab navigator, together with the first of those tabs.
  const navigationItems = readerNavigationItems;

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
                        color={item.key === activeKey ? theme.c.primary : theme.c.onPrimary}
                      />
                    </View>
                  </View>
                  {activeKey !== item.key && (
                    <CustomText
                      style={styles.iconText}
                      // One line, shrunk to fit: a wrapped label grows the bar
                      // past the height the Reader lays its chrome out from.
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {item.text}
                    </CustomText>
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
  context: PropTypes.oneOf(["reader"]),
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
