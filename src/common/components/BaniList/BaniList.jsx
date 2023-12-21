import React, { useEffect, useState } from "react";
import { FlatList, Dimensions, Platform } from "react-native";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import baseFontSize from "../../helpers";
import colors from "../../colors";
import { orderedBani } from "./baniOrderHelper";
import { setBaniList } from "../../actions";

function BaniList(props) {
  const { fontSize, fontFace, isTransliteration, isNightMode, baniOrder } = useSelector(
    (state) => state
  );
  const { data, onPress, isFolderScreen } = props;
  const [shabad, setShabad] = useState(data);
  const [isPotrait, toggleIsPotrait] = useState(true);
  const dispatch = useDispatch();

  const checkPotrait = () => {
    const dim = Dimensions.get("screen");
    return dim.height >= dim.width;
  };

  Dimensions.addEventListener("change", () => {
    toggleIsPotrait(checkPotrait());
  });

  useEffect(() => {
    if (data.length > 0 && !isFolderScreen) {
      const orderedData = orderedBani(data, baniOrder);
      setShabad(orderedData);
      dispatch(setBaniList(orderedData));
    } else {
      setShabad(data);
    }
  }, [data, baniOrder]);
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

  return (
    <FlatList
      style={!isPotrait && Platform.OS === "ios" && { marginLeft: 30 }}
      data={shabad}
      renderItem={renderBanis}
      keyExtractor={(item) => item.gurmukhi}
    />
  );
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
