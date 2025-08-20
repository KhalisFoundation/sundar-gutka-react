import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Dimensions, Platform } from "react-native";
import { useSelector } from "react-redux";
import { ListItem, Avatar } from "@rneui/themed";
import createStyles from "@settings/styles";
import PropTypes from "prop-types";
import constant from "@common/constant";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { convertToUnicode, baseFontSize } from "@common";

const BaniList = React.memo(({ data, onPress }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const fontSize = useSelector((state) => state.fontSize);
  const fontFace = useSelector((state) => state.fontFace);
  const isTransliteration = useSelector((state) => state.isTransliteration);
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
            backgroundColor: theme.colors.surface,
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
                { color: theme.colors.primaryText },
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
                  { color: theme.colors.primaryText },
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
    [theme, fontSize, fontFace, isTransliteration]
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
  theme: PropTypes.shape({
    colors: PropTypes.shape({
      surface: PropTypes.string.isRequired,
      primaryText: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

export default BaniList;
