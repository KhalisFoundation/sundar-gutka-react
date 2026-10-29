import React from "react";
import { View } from "react-native";
import { DownloadIcon } from "@common/icons";
import { STRINGS, CustomText } from "@common";
import { downloadBadgeStyles } from "../style";
import { useAudioTheme, useAudioThemedStyles } from "../useAudioTheme";

const DownloadBadge = () => {
  const { theme } = useAudioTheme();
  const styles = useAudioThemedStyles(downloadBadgeStyles);

  return (
    <View style={styles.container}>
      <View style={styles.downloadButton}>
        <DownloadIcon size={20} color={theme.c.headerFg} />
        <CustomText style={styles.downloadButtonText} numberOfLines={1}>
          {STRINGS.DOWNLOADING}
        </CustomText>
      </View>
    </View>
  );
};

DownloadBadge.propTypes = {};

export default DownloadBadge;
