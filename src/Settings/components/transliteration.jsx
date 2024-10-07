import React, { useState } from "react";
import { ListItem, Avatar, Switch } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS, colors } from "@common";
import { setTransliteration, toggleTransliteration } from "@common/actions";
import { ListItemComponent, BottomSheetComponent } from "./comon";
import { styles } from "../styles";

function TransliterationComponent() {
  const romanizedIcon = require("../../../images/romanizeicon.png");
  const [isVisible, toggleVisible] = useState(false);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isNightMode = useSelector((state) => state.isNightMode);
  const TRANSLITERATION_LANGUAGES = [
    { key: "ENGLISH", title: `${STRINGS.english}` },
    { key: "HINDI", title: STRINGS.hindi },
    { key: "SHAHMUKHI", title: STRINGS.shahmukhi },
    { key: "IPA", title: STRINGS.ipa },
  ];
  const dispatch = useDispatch();

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Avatar source={romanizedIcon} avatarStyle={styles.avatarStyle} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
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
}

export default TransliterationComponent;
