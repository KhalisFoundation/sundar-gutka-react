import React, { useState } from "react";
import { Text } from "react-native";
import { ListItem, BottomSheet, Avatar, Icon } from "@rneui/themed";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import STRINGS from "../../common/localization";
import styles from "../styles";
import { setBaniLength, BANI_LENGTHS } from "../../common/actions";
import colors from "../../common/colors";

const renderItem = (item, dispatch, isNightMode, toggleVisible, baniLength) => {
  return (
    <ListItem
      key={item.key}
      bottomDivider
      containerStyle={[
        { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
      ]}
      onPress={() => {
        toggleVisible(false);
        dispatch(setBaniLength(item.key));
      }}
    >
      <ListItem.Content>
        <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
          {item.title}
        </ListItem.Title>
      </ListItem.Content>
      {baniLength === item.key && <Icon color={isNightMode && colors.WHITE_COLOR} name="check" />}
    </ListItem>
  );
};

function BaniLengthComponent({ isNightMode, dispatch }) {
  const [isVisible, toggleVisible] = useState(false);
  const { baniLength } = useSelector((state) => state);

  return (
    <>
      <ListItem
        bottomDivider
        containerStyle={[
          { backgroundColor: isNightMode ? colors.NIGHT_GREY_COLOR : colors.WHITE_COLOR },
        ]}
        onPress={() => {
          toggleVisible(true);
        }}
      >
        <Avatar source={require("../../../images/banilengthicon.png")} />
        <ListItem.Content>
          <ListItem.Title style={[isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.bani_length}
          </ListItem.Title>
        </ListItem.Content>
        {baniLength && (
          <ListItem.Title style={[{ color: isNightMode ? colors.WHITE_COLOR : "#a3a3a3" }]}>
            {BANI_LENGTHS.filter((item) => item.key === baniLength).map((item) => item.title)[0]}
          </ListItem.Title>
        )}
        <ListItem.Chevron />
      </ListItem>
      {isVisible && (
        <BottomSheet modalProps={{}} isVisible>
          <Text style={[styles.bottomSheetTitle, isNightMode && { color: colors.WHITE_COLOR }]}>
            {STRINGS.bani_length}
          </Text>
          {BANI_LENGTHS.map((item) =>
            renderItem(item, dispatch, isNightMode, toggleVisible, baniLength)
          )}
        </BottomSheet>
      )}
    </>
  );
}

BaniLengthComponent.propTypes = {
  isNightMode: PropTypes.bool.isRequired,
  dispatch: PropTypes.func.isRequired,
};
export default BaniLengthComponent;
