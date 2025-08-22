import React, { useState } from "react";
import { ListItem, Icon, Switch } from "@rneui/themed";
import { useDispatch, useSelector } from "react-redux";
import { STRINGS } from "@common";
import { setVishraamOption, toggleVishraam, setVishraamSource } from "@common/actions";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { BottomSheetComponent, ListItemComponent } from "./comon";
import { getVishraamSource, getVishraamOption } from "./comon/strings";
import createStyles from "../styles";

const VishraamComponent = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isVishraamOptionVisible, toggleVishraamOptionVisible] = useState(false);
  const [isVishraamSourceVisible, toggleVishraamSourceVisible] = useState(false);
  const isVishraam = useSelector((state) => state.isVishraam);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const vishraamSource = useSelector((state) => state.vishraamSource);

  const dispatch = useDispatch();
  const VISHRAAM_OPTIONS = getVishraamOption(STRINGS);
  const VISHRAAM_SOURCES = getVishraamSource(STRINGS);

  return (
    <>
      <ListItem bottomDivider containerStyle={styles.containerNightStyles}>
        <Icon color={theme.colors.primaryText} name="pause" size={30} />
        <ListItem.Content>
          <ListItem.Title style={styles.listItemTitle}>{STRINGS.show_vishraams}</ListItem.Title>
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
};
export default VishraamComponent;
