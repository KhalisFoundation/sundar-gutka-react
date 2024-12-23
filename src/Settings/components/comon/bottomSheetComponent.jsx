import React, { useState, useEffect } from "react";
import { View, Dimensions } from "react-native";
import { Text, BottomSheet, Divider } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { constant } from "@common";
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
  const { width, height } = Dimensions.get("window");

  const [orientation, setOrientation] = useState(width < height ? "PORTRAIT" : "LANDSCAPE");
  useEffect(() => {
    Dimensions.addEventListener("change", ({ window: { widthDimension, heightDimenstion } }) => {
      if (widthDimension < heightDimenstion) {
        setOrientation(constant.PORTRAIT);
      } else {
        setOrientation(constant.LANDSCAPE);
      }
    });
  }, []);
  return (
    <SafeAreaProvider>
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
        backdropStyle={styles.backdropStyle}
        onBackdropPress={() => toggleVisible(false)}
      >
        <View
          style={[
            styles.viewWrapper,
            orientation === constant.LANDSCAPE ? styles.width_90 : styles.width_100,
          ]}
        >
          <Text style={[styles.bottomSheetTitle, textNightStyle, containerNightStyles]}>
            {title}
          </Text>
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
    </SafeAreaProvider>
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
