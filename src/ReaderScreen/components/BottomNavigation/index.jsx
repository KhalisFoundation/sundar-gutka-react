import React from "react";
import { View, Pressable } from "react-native";
import PropTypes from "prop-types";
import { colors } from "@common";
import styles from "./style";

const BottomNavigation = ({ navigationItems, currentRoute }) => {
  return (
    <View style={[styles.container]}>
      <View style={styles.navigationBar}>
        {navigationItems.map((item) => {
          const isActive = currentRoute === item.key;
          const IconComponent = item.icon;

          return (
            <Pressable
              key={item.key}
              style={[styles.iconContainer, isActive && styles.activeIconContainer]}
              onPress={item.handlePress}
            >
              <IconComponent size={24} color={colors.WHITE_COLOR} />
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
