import React from "react";
import { View, Pressable } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { colors } from "@common";
import styles from "./style";

const BottomNavigation = ({ navigationItems }) => {
  const isAudio = useSelector((state) => state.isAudio);

  return (
    <View style={[styles.container]}>
      <View style={styles.navigationBar}>
        {navigationItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = isAudio && item.key === "Music";
          return (
            <Pressable
              key={item.key}
              style={[styles.iconContainer, isActive && styles.activeIconContainer]}
              onPress={item.handlePress}
            >
              <IconComponent
                size={24}
                color={isActive ? colors.READER_HEADER_COLOR : colors.WHITE_COLOR}
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
