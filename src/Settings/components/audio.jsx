import React from "react";
import { View } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { ListItem, Icon } from "@rneui/themed";
import { toggleAudioAutoPlay, toggleAudioLoopPlayback } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, ListItemTitle, ThemedSwitch } from "@common";
import createStyles from "../styles";

const Audio = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isAudioAutoPlay = useSelector((state) => state.isAudioAutoPlay);
  const isAudioLoopPlayback = useSelector((state) => state.isAudioLoopPlayback);
  const dispatch = useDispatch();
  const { AUDIO_AUTO_PLAY, AUDIO_LOOP_PLAYBACK } = STRINGS;

  return (
    <View>
      <ListItem
        bottomDivider
        containerStyle={{ backgroundColor: theme.colors.surfaceGrey }}
      >
        <View style={styles.iconContainerStyle}>
          <Icon color={theme.colors.primaryText} name="play-circle-outline" type="material" size={26} />
        </View>
        <ListItem.Content>
          <ListItemTitle title={AUDIO_AUTO_PLAY} style={styles.listItemTitle} />
        </ListItem.Content>
        <ThemedSwitch
          value={isAudioAutoPlay}
          onValueChange={(value) => dispatch(toggleAudioAutoPlay(value))}
        />
      </ListItem>

      <ListItem
        bottomDivider
        containerStyle={{ backgroundColor: theme.colors.surfaceGrey }}
      >
        <View style={styles.iconContainerStyle}>
          <Icon color={theme.colors.primaryText} name="replay" type="material" size={26} />
        </View>
        <ListItem.Content>
          <ListItemTitle title={AUDIO_LOOP_PLAYBACK} style={styles.listItemTitle} />
        </ListItem.Content>
        <ThemedSwitch
          value={isAudioLoopPlayback}
          onValueChange={(value) => dispatch(toggleAudioLoopPlayback(value))}
        />
      </ListItem>
    </View>
  );
};

export default Audio;
