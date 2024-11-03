import React from "react";
import { View } from "react-native";
import { Text, BottomSheet, Divider } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { styles, nightModeStyles } from "../../styles";
import RenderBottomSheetItem from "./render";

const BottomSheetComponent = ({
  isVisible,
  actionConstant,
  value,
  title,
  action,
  toggleVisible,
}) => {
  const isNightMode = useSelector((state) => state.isNightMode);
  const { containerNightStyles, textNightStyle } = nightModeStyles(isNightMode);
  return (
    <BottomSheet
      modalProps={{
        supportedOrientations: [
          "portrait",
          "portrait-upside-down",
          "landscape-left",
          "landscape-right",
        ],
      }}
      isVisible={isVisible}
      onBackdropPress={() => toggleVisible(false)}
    >
      <View style={styles.viewWrapper}>
        <Text style={[styles.bottomSheetTitle, textNightStyle, containerNightStyles]}>{title}</Text>
        <Divider />
        {actionConstant.map((item) => (
          <RenderBottomSheetItem
            key={item.key}
            item={item}
            toggleVisible={toggleVisible}
            value={value}
            action={action}
          />
        ))}
      </View>
    </BottomSheet>
  );
};
BottomSheetComponent.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  actionConstant: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  value: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired,
  toggleVisible: PropTypes.func.isRequired,
};
export default BottomSheetComponent;
