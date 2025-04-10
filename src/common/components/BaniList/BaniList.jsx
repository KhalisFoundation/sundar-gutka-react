import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Dimensions, Platform } from "react-native";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import baseFontSize from "../../helpers";
import colors from "../../colors";
import { styles } from "../../../Settings/styles";

const BaniList = React.memo(({ data, onPress }) => {
  const fontSize = useSelector((state) => state.fontSize);
  const fontFace = useSelector((state) => state.fontFace);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const isNightMode = useSelector((state) => state.isNightMode);
  const [isPotrait, toggleIsPotrait] = useState(true);

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
  const renderBanis = useCallback(
    (row) => {
      return (
        <ListItem
          bottomDivider
          containerStyle={{
            backgroundColor: isNightMode ? colors.NIGHT_BLACK : colors.WHITE_COLOR,
          }}
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
    },
    [isNightMode, fontSize, fontFace, isTransliteration]
  );

  return (
    <FlatList
      style={!isPotrait && Platform.OS === "ios" && { marginLeft: 30 }}
      data={data}
      renderItem={renderBanis}
      keyExtractor={(item) => item.gurmukhi}
    />
  );
});

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
};

export default BaniList;
