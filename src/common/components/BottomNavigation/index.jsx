import React from "react";
import { View, Pressable } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { colors } from "@common";
import styles from "./style";

const BottomNavigation = ({ navigationItems, currentRoute }) => {
  const isNightMode = useSelector((state) => state.isNightMode);

  const getIconColor = (isActive) => {
    if (isActive) {
      return colors.READER_HEADER_COLOR; // Dark blue for active icon
    }
    return colors.WHITE;
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.navigationBar,
          { backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.READER_HEADER_COLOR },
        ]}
      >
        {navigationItems.map((item) => {
          const isActive = currentRoute === item.key;
          const IconComponent = item.icon;
          const iconColor = getIconColor(isActive);

          return (
            <Pressable
              key={item.key}
              style={[styles.iconContainer, isActive && styles.activeIconContainer]}
              onPress={item.handlePress}
            >
              <IconComponent size={22} color={iconColor} isActive={isActive} />
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
  currentRoute: PropTypes.string.isRequired,
};

export default BottomNavigation;
