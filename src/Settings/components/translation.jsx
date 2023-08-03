import React, { useState } from "react";
import { ListItem, Avatar, Switch } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import colors from "../../common/colors";
import STRINGS from "../../common/localization";
import {
  toggleEnglishTranslation,
  togglePunjabiTranslation,
  toggleSpanishTranslation,
} from "../../common/actions";

function TranslationComponent({ isNightMode, dispatch }) {
  const translationAvatar = require("../../../images/englishicon.png");
  const { isEnglishTranslation, isSpanishTranslation, isPunjabiTranslation } = useSelector(
    (state) => state
  );
  const [isExpanded, toggleIsExpanded] = useState(false);

  return (
    <ListItem.Accordion
      bottomDivider
      containerStyle={[isNightMode && { backgroundColor: colors.NIGHT_GREY_COLOR }]}
      isExpanded={isExpanded}
      onPress={() => toggleIsExpanded(!isExpanded)}
      content={
        <>
          <Avatar source={translationAvatar} />
          <ListItem.Content>
            <ListItem.Title
              style={[{ paddingLeft: 16 }, isNightMode && { color: colors.WHITE_COLOR }]}
            >
              {STRINGS.translations}
            </ListItem.Title>
          </ListItem.Content>
        </>
      }
    >
      <ListItem
        bottomDivider
        containerStyle={[isNightMode && { backgroundColor: colors.NIGHT_GREY_COLOR }]}
      >
        <Avatar />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.en_translations}
          </ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isEnglishTranslation}
          onValueChange={(value) => dispatch(toggleEnglishTranslation(value))}
        />
      </ListItem>

      <ListItem
        bottomDivider
        containerStyle={[isNightMode && { backgroundColor: colors.NIGHT_GREY_COLOR }]}
      >
        <Avatar />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.pu_translations}
          </ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isPunjabiTranslation}
          onValueChange={(value) => dispatch(togglePunjabiTranslation(value))}
        />
      </ListItem>

      <ListItem
        bottomDivider
        containerStyle={[isNightMode && { backgroundColor: colors.NIGHT_GREY_COLOR }]}
      >
        <Avatar />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.es_translations}
          </ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isSpanishTranslation}
          onValueChange={(value) => dispatch(toggleSpanishTranslation(value))}
        />
      </ListItem>
    </ListItem.Accordion>
  );
}

TranslationComponent.propTypes = {
  isNightMode: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};

export default TranslationComponent;
