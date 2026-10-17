import React, { useState } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { ListItem, Icon } from "@rneui/themed";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, CustomText, ListItemTitle, ThemedSwitch } from "@common";
import createStyles from "@settings/styles";
import { BottomSheetComponent, ListItemComponent } from "@settings/components/comon";
import { setKidsReciter, setKidsScoringOptIn, toggleKidsMode } from "./state/actions";
import { DEFAULT_RECITER, RECITERS } from "./reciters";

const KidsModeSetting = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { enabled, scoringOptIn, reciter } = useSelector((state) => state.kidsMode);
  const [isVisible, toggleVisible] = useState(false);
  const dispatch = useDispatch();
  const { KIDS_MODE, KIDS_SCORING_OPT_IN, KIDS_SCORING_OPT_IN_INFO, KIDS_RECITER } = STRINGS;

  return (
    <>
      <CustomText style={styles.displayOptionsText}>{KIDS_MODE}</CustomText>
      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <View style={styles.iconContainerStyle}>
          <Icon
            name="account-child-outline"
            type="material-community"
            size={26}
            color={theme.colors.primaryText}
          />
        </View>
        <ListItem.Content>
          <ListItemTitle title={KIDS_MODE} style={styles.listItemTitle} />
        </ListItem.Content>
        <ThemedSwitch value={enabled} onValueChange={(value) => dispatch(toggleKidsMode(value))} />
      </ListItem>
      {enabled && (
        <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
          <View style={styles.iconContainerStyle}>
            <Icon
              name="cloud-upload-outline"
              type="material-community"
              size={26}
              color={theme.colors.primaryText}
            />
          </View>
          <ListItem.Content>
            <ListItemTitle title={KIDS_SCORING_OPT_IN} style={styles.listItemTitle} />
            <CustomText style={styles.titleInfoStyle}>{KIDS_SCORING_OPT_IN_INFO}</CustomText>
          </ListItem.Content>
          <ThemedSwitch
            value={scoringOptIn}
            onValueChange={(value) => dispatch(setKidsScoringOptIn(value))}
          />
        </ListItem>
      )}
      {enabled && (
        <>
          <ListItemComponent
            icon="record-voice-over"
            title={KIDS_RECITER}
            value={reciter || DEFAULT_RECITER}
            isAvatar={false}
            actionConstant={RECITERS}
            onPressAction={() => toggleVisible(true)}
          />
          {isVisible && (
            <BottomSheetComponent
              isVisible={isVisible}
              action={setKidsReciter}
              actionConstant={RECITERS}
              value={reciter || DEFAULT_RECITER}
              toggleVisible={toggleVisible}
              title={KIDS_RECITER}
            />
          )}
        </>
      )}
    </>
  );
};

export default KidsModeSetting;
