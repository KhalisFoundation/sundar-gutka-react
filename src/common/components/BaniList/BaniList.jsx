import React, { useEffect, useState } from "react";
import { FlatList, Dimensions, Platform } from "react-native";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import baseFontSize from "../../helpers";
import colors from "../../colors";
import orderedBani from "./baniOrderHelper";
import { setBaniList } from "../../actions";
import { styles } from "../../../Settings/styles";

function BaniList(props) {
  const fontSize = useSelector((state) => state.fontSize);
  const fontFace = useSelector((state) => state.fontFace);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isNightMode = useSelector((state) => state.isNightMode);
  const baniOrder = useSelector((state) => state.baniOrder);
  const { data, onPress, isFolderScreen } = props;
  const [shabad, setShabad] = useState(data);
  const [isPotrait, toggleIsPotrait] = useState(true);
  const dispatch = useDispatch();

  const checkPotrait = () => {
    const dim = Dimensions.get("screen");
    return dim.height >= dim.width;
  };
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", () => {
      toggleIsPotrait(checkPotrait());
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (data.length > 0 && !isFolderScreen && baniOrder.baniOrder) {
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
        containerStyle={{ backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR }}
        onPress={() => onPress(row)}
      >
        {row.item.folder && (
          <Avatar
            source={require("../../../../images/foldericon.png")}
            avatarStyle={styles.avatarStyle}
          />
        )}
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
          {row.item.tukGurmukhi && (
            <ListItem.Subtitle
              style={[
                isNightMode && { color: "#ecf0f1" },
                { fontFamily: !isTransliteration ? fontFace : null },
                { fontSize: 17 },
              ]}
            >
              {isTransliteration ? row.item.tukTranslit : row.item.tukGurmukhi}
            </ListItem.Subtitle>
          )}
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
