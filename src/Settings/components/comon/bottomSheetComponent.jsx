import React, { useEffect, useState } from "react";
import { View, Modal, Dimensions, Pressable, Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import SoundPlayer from "react-native-sound-player";
import { useDispatch } from "react-redux";
import { BlurView } from "@react-native-community/blur";
import { Divider, Icon, ListItem } from "@rneui/themed";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { constant, CustomText } from "@common";
import createStyles from "../../styles";

const BottomSheetComponent = ({
  isVisible,
  actionConstant,
  value,
  title,
  action,
  toggleVisible,
}) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dispatch = useDispatch();
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
    bottomStyle.push(orientation === constant.LANDSCAPE ? styles.width_90 : styles.width_100);
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
              reducedTransparencyFallbackColor={theme.staticColors.NIGHT_OPACITY_BLACK}
              style={styles.blurViewStyle}
              blurType="dark"
              enabled
            />
            <View style={bottomStyle}>
              <CustomText
                style={[styles.bottomSheetTitle, styles.listItemTitle, styles.containerNightStyles]}
              >
                {title}
              </CustomText>
              <Divider />
              {actionConstant.map((item) => (
                <ListItem
                  key={item.key}
                  bottomDivider
                  containerStyle={styles.containerNightStyles}
                  onPress={() => {
                    toggleVisible(false);
                    dispatch(action(item.key));
                    if (item.key.includes(".mp3")) {
                      const soundTitle = item.key.split(".mp3")[0];
                      SoundPlayer.playSoundFile(soundTitle, ".mp3");
                    }
                  }}
                >
                  <ListItem.Content>
                    <ListItem.Title style={styles.listItemTitle} allowFontScaling={false}>
                      {item.title}
                    </ListItem.Title>
                  </ListItem.Content>
                  {value === item.key && <Icon color={theme.colors.primaryText} name="check" />}
                </ListItem>
              ))}
              {Platform.OS === "ios" && (
                <ListItem bottomDivider containerStyle={styles.containerNightStyles} />
              )}
            </View>
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
