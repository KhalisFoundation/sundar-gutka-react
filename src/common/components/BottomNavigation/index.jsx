import React, { useState, useEffect } from "react";
import { View, Pressable } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { HomeIcon, SettingsIcon, MusicIcon, ReadIcon } from "@common/icons";
import { CustomText, actions, constant, STRINGS } from "@common";
import createStyles from "./style";

const BottomNavigation = ({ navigation, activeKey }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAudio = useSelector((state) => state.isAudio);
  const currentBani = useSelector((state) => state.currentBani);
  const [isSettings, setIsSettings] = useState(false);

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
        dispatch(actions.toggleAudio(false));
        navigation.navigate(constant.READER, {
          key: `Reader-${currentBani?.id || constant.defaultBani.id}`,
          params: currentBani || constant.defaultBani,
        });
      },
      text: STRINGS.READ,
    },
    {
      key: "Music",
      icon: MusicIcon,
      handlePress: () => {
        const navState = navigation.getState();
        const currentNavRoute = navState?.routes[navState?.index]?.name;
        const isReader = currentNavRoute === constant.READER;

        if (!isReader) {
          navigation.navigate(constant.READER, {
            key: `Reader-${currentBani?.id || constant.defaultBani.id}`,
            params: currentBani || constant.defaultBani,
          });
        }
        dispatch(actions.toggleAutoScroll(false));
        dispatch(actions.toggleAudio(!isAudio));
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

  // Filter out Read and Music when on Settings page
  const filteredNavigationItems = isSettings
    ? navigationItems.filter((item) => item.key !== "Read" && item.key !== "Music")
    : navigationItems;

  return (
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
  );
};

BottomNavigation.propTypes = {
  navigation: PropTypes.shape().isRequired,
  activeKey: PropTypes.string.isRequired,
};

export default BottomNavigation;
