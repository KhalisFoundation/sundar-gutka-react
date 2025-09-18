import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Dimensions, Platform } from "react-native";
import { useSelector } from "react-redux";
import { ListItem, Avatar } from "@rneui/themed";
import PropTypes from "prop-types";
import { styles } from "../../../Settings/styles";
import colors from "../../colors";
import constant from "../../constant";
import baseFontSize from "../../helpers";
import convertToUnicode from "../../utils";

const BaniList = React.memo(({ data, onPress }) => {
  const fontSize = useSelector((state) => state.fontSize);
  const fontFace = useSelector((state) => state.fontFace);
  console.log(fontFace);
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
  const isUnicode = fontFace === constant.BALOO_PAAJI;

  const getBaniTuk = (row) => {
    if (!row || !row.item) {
      return "";
    }
    if (isTransliteration) {
      return row.item.translit;
    }
    if (isUnicode) {
      if (row?.item?.gurmukhiUni) {
        return row.item.gurmukhiUni;
      }
      return convertToUnicode(row.item.gurmukhi);
    }
    return row.item.gurmukhi;
  };

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
              {getBaniTuk(row)}
            </ListItem.Title>
            {row.item.tukGurmukhi && (
              <ListItem.Subtitle
                style={[
                  isNightMode && { color: colors.WHITE_COLOR },
                  { fontFamily: !isTransliteration ? fontFace : null },
                  { fontSize: 17 },
                ]}
              >
                {getBaniTuk(row)}
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
