import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Icon, Switch } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import STRINGS from "../../common/localization";
import {
  setVishraamOption,
  toggleVishraam,
  setVishraamSource,
  VISHRAAM_OPTIONS,
  VISHRAAM_SOURCES,
} from "../../common/actions";
import colors from "../../common/colors";
import styles from "../styles";

function vishraamExpand(
  isNightMode,
  toggleVishraamOptionVisible,
  toggleVishraamSourceVisible,
  vishraamSource,
  vishraamOption
) {
  return (
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
}
function VishraamComponent({ isNightMode, dispatch }) {
  const [isVishraamOptionVisible, toggleVishraamOptionVisible] = useState(false);
  const [isVishraamSourceVisible, toggleVishraamSourceVisible] = useState(false);
  const { isVishraam, vishraamOption, vishraamSource } = useSelector((state) => state);

  const renderItem = (item, action) => {
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
        {(vishraamSource === item.key || vishraamOption === item.key) && <Icon name="check" />}
      </ListItem>
    );
  };

  return (
    <>
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

      {isVishraam &&
        vishraamExpand(
          isNightMode,
          toggleVishraamOptionVisible,
          toggleVishraamSourceVisible,
          vishraamSource,
          vishraamOption
        )}

      {isVishraamOptionVisible && (
        <BottomSheet modalProps={{}} isVisible={isVishraamOptionVisible}>
          <Text style={styles.bottomSheetTitle}>{STRINGS.vishraam_options}</Text>
          {VISHRAAM_OPTIONS.map((item) => renderItem(item, setVishraamOption))}
        </BottomSheet>
      )}

      {isVishraamSourceVisible && (
        <BottomSheet modalProps={{}} isVisible={isVishraamSourceVisible}>
          <Text style={styles.bottomSheetTitle}>{STRINGS.vishraam_source}</Text>
          {VISHRAAM_SOURCES.map((item) => renderItem(item, setVishraamSource))}
        </BottomSheet>
      )}
    </>
  );
}
VishraamComponent.propTypes = {
  isNightMode: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};
export default VishraamComponent;
