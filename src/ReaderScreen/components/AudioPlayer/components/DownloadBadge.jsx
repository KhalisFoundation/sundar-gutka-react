import React from "react";
import { View } from "react-native";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { DownloadIcon } from "@common/icons";
import { STRINGS, CustomText } from "@common";
import { downloadBadgeStyles } from "../style";

const DownloadBadge = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(downloadBadgeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.downloadButton}>
        <DownloadIcon size={20} color={theme.colors.primaryHeaderVariant} />
        <CustomText style={styles.downloadButtonText}>{STRINGS.DOWNLOADING}</CustomText>
      </View>
    </View>
  );
};

DownloadBadge.propTypes = {};

export default DownloadBadge;
