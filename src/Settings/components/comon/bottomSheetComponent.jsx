import React, { useEffect, useState } from "react";
import { View, Modal, Text, Dimensions, Pressable, Platform, StyleSheet } from "react-native";
import { Divider, Icon, ListItem } from "@rneui/themed";
import { BlurView } from "@react-native-community/blur";
import { useDispatch, useSelector } from "react-redux";
import { constant } from "@common";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { styles, nightModeStyles, nightModeColor } from "../../styles";

const BottomSheetComponent = ({
  isVisible,
  actionConstant,
  value,
  title,
  action,
  toggleVisible,
}) => {
  const dispatch = useDispatch();
  const isNightMode = useSelector((state) => state.isNightMode);
  const { containerNightStyles, textNightStyle } = nightModeStyles(isNightMode);
  const nightStyles = nightModeColor(isNightMode);
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
  const bottomStyle = [];
  if (Platform.OS === "ios") {
    bottomStyle.push(styles.viewWrapper);
    if (orientation === constant.LANDSCAPE) {
      bottomStyle.push(styles.width_90);
    } else {
      bottomStyle.push(styles.width_100);
    }
  } else {
    bottomStyle.push(styles.androidViewWrapper);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView>
        <Modal
          visible={isVisible}
          animationType="fade"
          transparent
          supportedOrientations={[
            "landscape",
            "landscape-left",
            "landscape-right",
            "portrait",
            "portrait-upside-down",
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => toggleVisible(false)}>
            <BlurView
              reducedTransparencyFallbackColor="white"
              style={styles.blurViewStyle}
              blurType="dark"
              blurAmount={10}
            >
              <View style={bottomStyle}>
                <Text style={[styles.bottomSheetTitle, textNightStyle, containerNightStyles]}>
                  {title}
                </Text>
                <Divider />
                {actionConstant.map((item) => (
                  <ListItem
                    key={item.key}
                    bottomDivider
                    containerStyle={containerNightStyles}
                    onPress={() => {
                      toggleVisible(false);
                      dispatch(action(item.key));
                    }}
                  >
                    <ListItem.Content>
                      <ListItem.Title style={nightStyles}>{item.title}</ListItem.Title>
                    </ListItem.Content>
                    {value === item.key && <Icon color={nightStyles.color} name="check" />}
                  </ListItem>
                ))}
                {Platform.OS === "ios" && (
                  <ListItem bottomDivider containerStyle={containerNightStyles} />
                )}
              </View>
            </BlurView>
          </Pressable>
        </Modal>
      </SafeAreaView>
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
