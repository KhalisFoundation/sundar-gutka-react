import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ListItem, Avatar, Switch } from "@rneui/themed";
import { setTransliteration, toggleTransliteration } from "@common/actions";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { STRINGS, constant } from "@common";
import createStyles from "../styles";
import { ListItemComponent, BottomSheetComponent } from "./comon";
import { getTransliteration } from "./comon/strings";

const TransliterationComponent = () => {
  const styles = useThemedStyles(createStyles);
  const romanizedIcon = require("../../../images/romanizeicon.png");
  const [isVisible, toggleVisible] = useState(false);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const TRANSLITERATION_LANGUAGES = getTransliteration(STRINGS);
  const dispatch = useDispatch();

  // Set default transliteration to English
  useEffect(() => {
    if (!isTransliteration) {
      dispatch(setTransliteration(constant.ENGLISH));
    }
  }, [isTransliteration]);

  return (
    <>
      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <Avatar source={romanizedIcon} avatarStyle={styles.avatarStyle} />
        <ListItem.Content>
          <ListItem.Title style={styles.listItemTitle} allowFontScaling={false}>
            {STRINGS.transliteration}
          </ListItem.Title>
        </ListItem.Content>
        <Switch
          value={isTransliteration}
          onValueChange={(value) => dispatch(toggleTransliteration(value))}
        />
      </ListItem>
      {isTransliteration && (
        <ListItemComponent
          icon="subtitles"
          title={STRINGS.language}
          value={transliterationLanguage}
          isAvatar={false}
          actionConstant={TRANSLITERATION_LANGUAGES}
          onPressAction={() => toggleVisible(true)}
        />
      )}
      {isVisible && (
        <BottomSheetComponent
          isVisible={isVisible}
          actionConstant={TRANSLITERATION_LANGUAGES}
          value={transliterationLanguage}
          toggleVisible={toggleVisible}
          title={STRINGS.language}
          action={setTransliteration}
        />
      )}
    </>
  );
};

export default TransliterationComponent;
