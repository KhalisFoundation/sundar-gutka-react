import React from "react";
import { View, Pressable } from "react-native";
import PropTypes from "prop-types";
import { CloseIcon } from "@common/icons";
import { useTheme, useThemedStyles, CustomText, STRINGS } from "@common";
import createStyles from "./styles";

const ErrorFallback = ({
  isInitializing,
  initializationErrorMessage,
  retryInitialization,
  handleClose,
}) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();

  return (
    <View testID="error-fallback-container" style={styles.statusContainer}>
      <Pressable testID="close-button" style={styles.closeButton} onPress={handleClose}>
        <CloseIcon size={30} color={theme.colors.audioTitleText} />
      </Pressable>
      <CustomText testID="status-title" style={styles.statusTitle}>
        {STRINGS.PREPARING_AUDIO_PLAYER}
      </CustomText>
      {!isInitializing && (
        <>
          <CustomText testID="status-subtitle" style={styles.statusSubtitle}>
            {initializationErrorMessage}
          </CustomText>
          <Pressable testID="retry-button" style={styles.retryButton} onPress={retryInitialization}>
            <CustomText testID="retry-button-text" style={styles.retryButtonText}>
              {STRINGS.PLEASE_TRY_AGAIN}
            </CustomText>
          </Pressable>
        </>
      )}
    </View>
  );
};

ErrorFallback.propTypes = {
  isInitializing: PropTypes.bool.isRequired,
  initializationErrorMessage: PropTypes.string.isRequired,
  retryInitialization: PropTypes.func.isRequired,
  handleClose: PropTypes.func.isRequired,
};

export default ErrorFallback;
