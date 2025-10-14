import React from "react";
import { View, Pressable } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "./style";

const BottomNavigation = ({ navigationItems }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAudio = useSelector((state) => state.isAudio);

  return (
    <View style={[styles.container]}>
      <View style={styles.navigationBar}>
        {navigationItems.map((item) => {
          const isActive = isAudio && item.key === "Music";
          const IconComponent = item.icon;

          return (
            <Pressable
              key={item.key}
              style={[styles.iconContainer, isActive && styles.activeIconContainer]}
              onPress={item.handlePress}
            >
              <IconComponent
                size={24}
                color={isActive ? theme.colors.primary : theme.staticColors.WHITE_COLOR}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

BottomNavigation.propTypes = {
  navigationItems: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      handlePress: PropTypes.func.isRequired,
    })
  ).isRequired,
};

export default BottomNavigation;
