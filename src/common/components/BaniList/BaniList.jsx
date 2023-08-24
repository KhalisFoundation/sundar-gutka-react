import React, { useEffect, useState } from "react";
import { FlatList } from "react-native";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import baseFontSize from "../../helpers";
import colors from "../../colors";
import oderedBani from "./baniOrderHelper";

function BaniList(props) {
  const { fontSize, fontFace, isTransliteration, isNightMode } = useSelector((state) => state);
  const { data, onPress, isFolderScreen } = props;
  const [shabad, setShabad] = useState(data);

  useEffect(() => {
    if (data.length > 0 && !isFolderScreen) {
      setShabad(oderedBani(data));
    } else {
      setShabad(data);
    }
  }, [data]);
  const renderBanis = (row) => {
    return (
      <ListItem
        bottomDivider
        containerStyle={isNightMode && { backgroundColor: colors.NIGHT_BLACK }}
        onPress={() => onPress(row)}
      >
        {row.item.folder && <Avatar source={require("../../../../images/foldericon.png")} />}
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
            {isTransliteration ? row.item.translit : row.item.gurmukhi}
          </ListItem.Title>
        </ListItem.Content>
      </ListItem>
    );
  };

  return <FlatList data={shabad} renderItem={renderBanis} keyExtractor={(item) => item.gurmukhi} />;
}

BaniList.defaultProps = { isFolderScreen: false };
BaniList.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      item: PropTypes.shape({
        id: PropTypes.number.isRequired,
        gurmukhi: PropTypes.string.isRequired,
        translit: PropTypes.string.isRequired,
      }),
    })
  ).isRequired,
  onPress: PropTypes.func.isRequired,
  isFolderScreen: PropTypes.bool,
};

export default BaniList;
