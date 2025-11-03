import React from "react";
import { View, Pressable } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { HomeIcon, SettingsIcon, MusicIcon, ReadIcon } from "@common/icons";
import { CustomText, actions, constant } from "@common";
import createStyles from "./style";

const BottomNavigation = ({ navigation, activeKey }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAudio = useSelector((state) => state.isAudio);
  const currentBani = useSelector((state) => state.currentBani);
  const navigationItems = [
    { key: "Home", icon: HomeIcon, handlePress: () => navigation.navigate("Home") },
    {
      key: "Read",
      icon: ReadIcon,
      handlePress: () =>
        navigation.navigate(constant.READER, {
          key: `Reader-${currentBani?.id || constant.defaultBani.id}`,
          params: currentBani || constant.defaultBani,
        }),
    },
    {
      key: "Music",
      icon: MusicIcon,
      handlePress: () => {
        const state = navigation.getState();
        const currentRoute = state?.routes[state?.index]?.name;
        const isReader = currentRoute === constant.READER;

        if (!isReader) {
          navigation.navigate(constant.READER, {
            key: `Reader-${currentBani?.id || constant.defaultBani.id}`,
            params: currentBani || constant.defaultBani,
          });
        }
        dispatch(actions.toggleAutoScroll(false));
        dispatch(actions.toggleAudio(!isAudio));
      },
    },
    {
      key: "Settings",
      icon: SettingsIcon,
      handlePress: () => navigation.navigate(constant.SETTINGS),
    },
  ];

  return (
    <View style={[styles.container]}>
      <View style={styles.navigationBar}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;

          return (
            <Pressable
              key={item.key}
              style={[styles.iconContainer, item.key === activeKey && styles.activeIconContainer]}
              onPress={item.handlePress}
            >
              <IconComponent
                size={activeKey === item.key ? 24 : 24}
                color={
                  item.key === activeKey ? theme.colors.primary : theme.staticColors.WHITE_COLOR
                }
              />
              {activeKey !== item.key && (
                <CustomText style={styles.iconText}>{item.key}</CustomText>
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
