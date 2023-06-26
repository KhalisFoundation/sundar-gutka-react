import React from "react";
import { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon, Switch } from "@rneui/themed";
import STRINGS from "../../common/localization";
import {
  setVishraamOption,
  toggleVishraam,
  setVishraamSource,
  VISHRAAM_OPTIONS,
  VISHRAAM_SOURCES,
} from "../../common/actions";
import { useSelector } from "react-redux";
import colors from "../../common/colors";
import styles from "../styles";

function VishraamComponent({ isNightMode, dispatch }) {
  const [isVishraamOptionVisible, toggleVishraamOptionVisible] = useState(false);
  const [isVishraamSourceVisible, toggleVishraamSourceVisible] = useState(false);
  const { isVishraam, vishraamOption, vishraamSource } = useSelector((state) => state);

  const renderItem = (item, action, name) => {
    return (
      <ListItem
        key={item.key}
        bottomDivider
        onPress={() => {
          toggleVishraamOptionVisible(false);
          toggleVishraamSourceVisible(false);
          dispatch(action(item.key));
        }}
      >
        <ListItem.Content>
          <ListItem.Title>{item.title}</ListItem.Title>
        </ListItem.Content>
        {name == "source" && vishraamSource === item.key && <Icon name="check" />}
        {name == "option" && vishraamOption === item.key && <Icon name="check" />}
      </ListItem>
    );
  };
  const VishraamOptionComponent = () => (
    <BottomSheet modalProps={{}} isVisible={isVishraamOptionVisible}>
      <Text style={styles.bottomSheetTitle}>{STRINGS.vishraam_options}</Text>
      {VISHRAAM_OPTIONS.map((item) => renderItem(item, setVishraamOption, "option"))}
    </BottomSheet>
  );

  const VishraamSourceComponent = () => (
    <BottomSheet modalProps={{}} isVisible={isVishraamSourceVisible}>
      <Text style={styles.bottomSheetTitle}>{STRINGS.vishraam_source}</Text>
      {VISHRAAM_SOURCES.map((item) => renderItem(item, setVishraamSource, "source"))}
    </BottomSheet>
  );

  const VishraamExpand = () => (
    <>
      <ListItem bottomDivider onPress={() => toggleVishraamOptionVisible(true)}>
        <Icon name="format-color-fill" size={30} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.vishraam_options}
          </ListItem.Title>
        </ListItem.Content>
        {vishraamOption && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {
              VISHRAAM_OPTIONS.filter((item) => item.key === vishraamOption).map(
                (item) => item.title
              )[0]
            }
          </ListItem.Title>
        )}
      </ListItem>

      <ListItem bottomDivider onPress={() => toggleVishraamSourceVisible(true)}>
        <Icon name="auto-stories" size={30} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.vishraam_source}
          </ListItem.Title>
        </ListItem.Content>
        {vishraamSource && (
          <ListItem.Title
            style={[styles.titleInfoStyle, { color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}
          >
            {
              VISHRAAM_SOURCES.filter((item) => item.key === vishraamSource).map(
                (item) => item.title
              )[0]
            }
          </ListItem.Title>
        )}
      </ListItem>
    </>
  );

  const TriggerComponent = () => {
    return (
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
      >
        <Icon
          color={isNightMode ? colors.COMPONENT_COLOR_NIGHT_MODE : colors.COMPONENT_COLOR}
          name="pause"
          size={30}
        />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.show_vishraams}
          </ListItem.Title>
        </ListItem.Content>
        <Switch value={isVishraam} onValueChange={(value) => dispatch(toggleVishraam(value))} />
      </ListItem>
    );
  };
  return (
    <>
      <TriggerComponent />
      {isVishraam && <VishraamExpand />}
      {isVishraamOptionVisible && <VishraamOptionComponent />}
      {isVishraamSourceVisible && <VishraamSourceComponent />}
    </>
  );
}
export default VishraamComponent;
