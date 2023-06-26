import React from "react";
import { FlatList } from "react-native";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { baseFontSize } from "../../helpers";
import colors from "../../colors";

function BaniList(props) {
  const { fontSize, fontFace, isTransliteration, isNightMode } = useSelector((state) => state);
  const { data, onPress } = props;
  const renderBanis = (item) => {
    return (
      <ListItem
        bottomDivider
        containerStyle={isNightMode && { backgroundColor: colors.NIGHT_BLACK }}
        onPress={() => onPress(item)}
      >
        {item.folder && <Avatar source={require("../../../../images/foldericon.png")} />}
        <ListItem.Content>
          <ListItem.Title
            style={[
              isNightMode && { color: colors.WHITE_COLOR },
              {
                fontSize: baseFontSize(fontSize, isTransliteration),
                fontFamily: !isTransliteration ? fontFace : null,
              },
            ]}
          >
            {isTransliteration ? item.item.translit : item.item.gurmukhi}
          </ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={(item) => renderBanis(item)}
      keyExtractor={(item) => item.id}
    />
  );
}

BaniList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

export default BaniList;
