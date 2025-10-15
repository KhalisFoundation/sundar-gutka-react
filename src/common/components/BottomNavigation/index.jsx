import React from "react";
import { View, Pressable } from "react-native";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "./style";

const BottomNavigation = ({ navigationItems, activeKey }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);

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
                size={24}
                color={
                  item.key === activeKey ? theme.colors.primary : theme.staticColors.WHITE_COLOR
                }
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
  activeKey: PropTypes.string.isRequired,
};

export default BottomNavigation;
