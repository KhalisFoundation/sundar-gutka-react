import React from "react";
import { View, Pressable } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { HomeIcon, SettingsIcon, MusicIcon, ReadIcon } from "@common/icons";
import { CustomText, actions, constant } from "@common";
import createStyles from "./style";

const BottomNavigation = ({ navigation, currentRoute }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAudio = useSelector((state) => state.isAudio);
  const currentBani = useSelector((state) => state.currentBani);

  const getActiveKey = (routeName) => {
    switch (routeName) {
      case constant.READER:
        return isAudio ? "Music" : "Read";
      case constant.SETTINGS:
        return "Settings";
      case "Home":
      default:
        return "Home";
    }
  };

  const activeKey = getActiveKey(currentRoute);

  const navigationItems = [
    { key: "Home", icon: HomeIcon, handlePress: () => navigation.navigate("Home"), text: "Home" },
    {
      key: "Read",
      icon: ReadIcon,
      handlePress: () =>
        navigation.navigate(constant.READER, {
          key: `Reader-${currentBani?.id || constant.defaultBani.id}`,
          params: currentBani || constant.defaultBani,
        }),
      text: currentBani?.titleUni?.split(" ")[0] || "Read",
    },
    {
      key: "Music",
      icon: MusicIcon,
      handlePress: () => {
        const state = navigation.getState();
        const route = state?.routes[state?.index]?.name;
        const isReader = route === constant.READER;

        if (!isReader) {
          navigation.navigate(constant.READER, {
            key: `Reader-${currentBani?.id || constant.defaultBani.id}`,
            params: currentBani || constant.defaultBani,
          });
        }
        dispatch(actions.toggleAutoScroll(false));
        dispatch(actions.toggleAudio(!isAudio));
      },
      text: "Music",
    },
    {
      key: "Settings",
      icon: SettingsIcon,
      handlePress: () => navigation.navigate(constant.SETTINGS),
      text: "Settings",
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
  currentRoute: PropTypes.string.isRequired,
};

export default BottomNavigation;
