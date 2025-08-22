import React, { useState } from "react";
import { ListItem, Avatar, Switch } from "@rneui/themed";
import { useSelector, useDispatch } from "react-redux";
import { STRINGS } from "@common";
import {
  toggleEnglishTranslation,
  togglePunjabiTranslation,
  toggleSpanishTranslation,
} from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import createStyles from "../styles";

const TranslationComponent = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const translationAvatar = require("../../../images/englishicon.png");
  const isEnglishTranslation = useSelector((state) => state.isEnglishTranslation);
  const isSpanishTranslation = useSelector((state) => state.isSpanishTranslation);
  const isPunjabiTranslation = useSelector((state) => state.isPunjabiTranslation);

  const dispatch = useDispatch();
  const [isExpanded, toggleIsExpanded] = useState(false);
  return (
    <ListItem.Accordion
      bottomDivider
      containerStyle={styles.containerNightStyles}
      isExpanded={isExpanded}
      onPress={() => toggleIsExpanded(!isExpanded)}
      content={
        <>
          <Avatar source={translationAvatar} avatarStyle={styles.avatarStyle} />
          <ListItem.Content>
            <ListItem.Title style={[{ paddingLeft: 16 }, styles.listItemTitle]}>
              {STRINGS.translations}
            </ListItem.Title>
          </ListItem.Content>
        </>
      }
      icon={{
        name: "chevron-down",
        type: "material-community",
        color: theme.colors.primaryText,
        size: 26,
      }}
    >
      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <Avatar />
        <ListItem.Content>
          <ListItem.Title style={styles.listItemTitle}>{STRINGS.en_translations}</ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isEnglishTranslation}
          onValueChange={(value) => dispatch(toggleEnglishTranslation(value))}
        />
      </ListItem>

      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <Avatar />
        <ListItem.Content>
          <ListItem.Title style={styles.listItemTitle}>{STRINGS.pu_translations}</ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isPunjabiTranslation}
          onValueChange={(value) => dispatch(togglePunjabiTranslation(value))}
        />
      </ListItem>

      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <Avatar />
        <ListItem.Content>
          <ListItem.Title style={styles.listItemTitle}>{STRINGS.es_translations}</ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isSpanishTranslation}
          onValueChange={(value) => dispatch(toggleSpanishTranslation(value))}
        />
      </ListItem>
    </ListItem.Accordion>
  );
};

export default TranslationComponent;
