import React, { useState } from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS } from "@common";
import { setVishraamOption, toggleVishraam, setVishraamSource } from "@common/actions";
import { nightModeStyles, iconNightColor } from "../styles";
import { BottomSheetComponent, ListItemComponent } from "./comon";

function VishraamComponent() {
  const [isVishraamOptionVisible, toggleVishraamOptionVisible] = useState(false);
  const [isVishraamSourceVisible, toggleVishraamSourceVisible] = useState(false);
  const isVishraam = useSelector((state) => state.isVishraam);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const vishraamSource = useSelector((state) => state.vishraamSource);
  const isNightMode = useSelector((state) => state.isNightMode);

  const dispatch = useDispatch();
  const { containerNightStyles, textNightStyle } = nightModeStyles(isNightMode);
  const iconColor = iconNightColor(isNightMode);
  const VISHRAAM_OPTIONS = [
    { key: "VISHRAAM_COLORED", title: STRINGS.colored_words },
    { key: "VISHRAAM_GRADIENT", title: STRINGS.gradient_background },
  ];
  const VISHRAAM_SOURCES = [
    { key: "sttm", title: STRINGS.banidb_living_default },
    { key: "igurbani", title: STRINGS.iGurbani },
    { key: "sttm2", title: STRINGS.sttm2 },
  ];

  return (
    <>
      <ListItem bottomDivider containerStyle={containerNightStyles}>
        <Icon color={iconColor} name="pause" size={30} />
        <ListItem.Content>
          <ListItem.Title style={textNightStyle}>{STRINGS.show_vishraams}</ListItem.Title>
        </ListItem.Content>
        <Switch value={isVishraam} onValueChange={(value) => dispatch(toggleVishraam(value))} />
      </ListItem>

      {isVishraam && (
        <>
          <ListItemComponent
            icon="format-color-fill"
            isAvatar={false}
            title={STRINGS.vishraam_options}
            value={vishraamOption}
            actionConstant={VISHRAAM_OPTIONS}
            onPressAction={() => toggleVishraamOptionVisible(true)}
          />

          <ListItemComponent
            icon="auto-stories"
            isAvatar={false}
            title={STRINGS.vishraam_source}
            value={vishraamSource}
            actionConstant={VISHRAAM_SOURCES}
            onPressAction={() => toggleVishraamSourceVisible(true)}
          />
        </>
      )}

      {isVishraamOptionVisible && (
        <BottomSheetComponent
          isVisible={isVishraamOptionVisible}
          actionConstant={VISHRAAM_OPTIONS}
          value={vishraamOption}
          toggleVisible={toggleVishraamOptionVisible}
          title={STRINGS.vishraam_options}
          action={setVishraamOption}
        />
      )}

      {isVishraamSourceVisible && (
        <BottomSheetComponent
          isVisible={isVishraamSourceVisible}
          actionConstant={VISHRAAM_SOURCES}
          value={vishraamSource}
          toggleVisible={toggleVishraamSourceVisible}
          title={STRINGS.vishraam_source}
          action={setVishraamSource}
        />
      )}
    </>
  );
}
export default VishraamComponent;
