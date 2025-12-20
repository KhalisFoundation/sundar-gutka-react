import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { HomeIcon, SettingsIcon, MusicIcon, ReadIcon } from "@common/icons";
import { CustomText, actions, constant, STRINGS, SafeArea } from "@common";
import createStyles from "./style";

const BottomNavigation = ({ activeKey }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAudio = useSelector((state) => state.isAudio);
  const [isSettings, setIsSettings] = useState(false);
  const [previousRouteName, setPreviousRouteName] = useState(null);

  // Helper function to get current route name
  const getCurrentRouteName = useCallback(() => {
    const navState = navigation.getState();
    return navState?.routes[navState?.index]?.name;
  }, [navigation]);

  useEffect(() => {
    const updateIsSettings = () => {
      const state = navigation.getState?.();
      if (!state) return;

      const topRoute = state.routes[state.index];
      let currentRouteName = topRoute?.name;

      // Handle nested navigators just in case
      if (topRoute?.state && typeof topRoute.state.index === "number") {
        const nestedRoute = topRoute.state.routes[topRoute.state.index];
        currentRouteName = nestedRoute?.name ?? currentRouteName;
      }

      // When entering Settings, check the previous route in navigation stack
      if (currentRouteName === constant.SETTINGS) {
        // Get the previous route from navigation state
        if (state.index > 0) {
          const prevRoute = state.routes[state.index - 1];
          let prevRouteName = prevRoute?.name;
          if (prevRoute?.state && typeof prevRoute.state.index === "number") {
            const nestedRoute = prevRoute.state.routes[prevRoute.state.index];
            prevRouteName = nestedRoute?.name ?? prevRouteName;
          }
          setPreviousRouteName(prevRouteName);
        }
      } else {
        // Update previous route when not on Settings
        setPreviousRouteName(currentRouteName);
      }

      setIsSettings(currentRouteName === constant.SETTINGS);
    };

    // Run once on mount
    updateIsSettings();

    // Subscribe to navigation state changes
    const unsubscribe =
      navigation.addListener?.("state", () => {
        updateIsSettings();
      }) || undefined;

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigation]);

  const navigationItems = [
    {
      key: "Home",
      icon: HomeIcon,
      handlePress: () => {
        navigation.popToTop();
      },
      text: STRINGS.HOME,
    },
    {
      key: "Read",
      icon: ReadIcon,
      handlePress: () => {
        const currentNavRoute = getCurrentRouteName();

        if (currentNavRoute === constant.SETTINGS) {
          navigation.goBack();
        }
        if (isAudio) {
          dispatch(actions.toggleAudio(false));
        }
      },
      text: STRINGS.READ,
    },
    {
      key: "Music",
      icon: MusicIcon,
      handlePress: () => {
        const currentNavRoute = getCurrentRouteName();

        if (currentNavRoute === constant.SETTINGS) {
          navigation.goBack();
        }

        dispatch(actions.toggleAutoScroll(false));

        // If coming from Settings and previous route was Reader, keep audio ON
        if (currentNavRoute === constant.SETTINGS && isAudio) {
          dispatch(actions.toggleAudio(true));
        } else {
          dispatch(actions.toggleAudio(!isAudio));
        }
      },
      text: STRINGS.MUSIC,
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

  // Filter out Read and Music when on Settings page, but keep them if previous route was Read
  const shouldHideReadAndMusic = isSettings && previousRouteName !== constant.READER;
  const filteredNavigationItems = shouldHideReadAndMusic
    ? navigationItems.filter((item) => item.key !== "Read" && item.key !== "Music")
    : navigationItems;

  return (
    <SafeArea backgroundColor={theme.colors.primary} edges={["bottom"]} flex={0}>
      <View style={[styles.container]}>
        <View style={styles.navigationBar}>
          {filteredNavigationItems.map((item) => {
            const IconComponent = item.icon;

            return (
              <Pressable
                key={item.key}
                style={[styles.iconContainer, item.key === activeKey && styles.activeIconContainer]}
                onPress={item.handlePress}
                accessibilityRole="button"
                accessibilityLabel={`bottomnav-${item.key}`}
              >
                <IconComponent
                  size={24}
                  color={
                    item.key === activeKey ? theme.colors.primary : theme.staticColors.WHITE_COLOR
                  }
                />
                {activeKey !== item.key && (
                  <CustomText style={styles.iconText}>{item.text}</CustomText>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeArea>
  );
};

BottomNavigation.propTypes = {
  activeKey: PropTypes.string.isRequired,
};

export default BottomNavigation;
