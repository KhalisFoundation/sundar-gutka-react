import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { CloseIcon } from "@common/icons";
import { CustomText, STRINGS } from "@common";
import { useAudioTheme, useAudioThemedStyles } from "../../useAudioTheme";
import createStyles from "./styles";

const ErrorFallback = ({ title, buttonText, buttonPress, handleClose, baniTitle = "" }) => {
  const fontFace = useSelector((state) => state.fontFace);
  const styles = useAudioThemedStyles(createStyles);
  const { theme } = useAudioTheme();

  const fontStyle = useMemo(
    () => ({
      fontFamily: fontFace,
    }),
    [fontFace]
  );

  return (
    <View testID="error-fallback-container" style={styles.statusContainer}>
      <Pressable testID="close-button" style={styles.closeButton} onPress={handleClose}>
        <CloseIcon size={30} color={theme.c.textBrand} />
      </Pressable>
      <View style={styles.noTracksContainer}>
        <CustomText style={styles.noTracksText}>{STRINGS.MAAFI_JI}</CustomText>
        <CustomText style={styles.noTracksSubtext}>
          <CustomText style={styles.titleText}>{title} </CustomText>
          {!!baniTitle && (
            <>
              <CustomText style={fontStyle}>{baniTitle} </CustomText>
              {STRINGS.YET}
            </>
          )}
        </CustomText>
        <Pressable
          style={styles.joinMailingListButton}
          onPress={buttonPress}
          accessibilityRole="link"
        >
          {/* Arrow is inlined into the label (not a flex sibling) so it hugs the
              last word and wraps with it — otherwise it floats to the row's far
              edge when longer translations (French/Italian) wrap to two lines.
              The non-breaking space keeps it attached to the final word. */}
          <CustomText style={styles.joinMailingListText}>
            {buttonText}
            <CustomText style={styles.joinMailingListArrow}>{" →"}</CustomText>
          </CustomText>
        </Pressable>
      </View>
    </View>
  );
};

ErrorFallback.propTypes = {
  title: PropTypes.string.isRequired,
  baniTitle: PropTypes.string,
  buttonPress: PropTypes.func.isRequired,
  buttonText: PropTypes.string.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default ErrorFallback;
