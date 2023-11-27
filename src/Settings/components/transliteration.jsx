import React, { useState } from "react";
import { ListItem, Avatar, Switch } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import STRINGS from "../../common/localization";
import { setTransliteration, toggleTransliteration } from "../../common/actions";
import { TRANSLITERATION_LANGUAGES } from "../../common/actions/constant";
import colors from "../../common/colors";
import { ListItemComponent, BottomSheetComponent } from "./comon";

function TransliterationComponent() {
  const romanizedIcon = require("../../../images/romanizeicon.png");
  const [isVisible, toggleVisible] = useState(false);
  const { transliterationLanguage, isTransliteration, isNightMode } = useSelector((state) => state);
  const dispatch = useDispatch();

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Avatar source={romanizedIcon} />
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
