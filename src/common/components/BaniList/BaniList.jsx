import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Dimensions, Platform } from "react-native";
import { useSelector } from "react-redux";
import { ListItem, Avatar } from "@rneui/themed";
import createStyles from "@settings/styles";
import PropTypes from "prop-types";
import constant from "@common/constant";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import { convertToUnicode, baseFontSize, ListItemTitle } from "@common";

const BaniList = React.memo(({ data, onPress, isFolderScreen }) => {
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
      const isDarkMode = theme.mode === "dark";
      const itemTextColor = isDarkMode ? theme.staticColors.WHITE_COLOR : theme.colors.primary;
      const displayFont = !isTransliteration ? fontFace : null;

      return (
        <ListItem
          bottomDivider={false}
          containerStyle={{
            backgroundColor: isDarkMode
              ? isFolderScreen ? theme.colors.surface : "#041126"
              : theme.colors.surface,
            paddingVertical: 8,
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
            <ListItemTitle
              title={getBaniTuk(row)}
              style={[
                { color: itemTextColor },
                {
                  fontSize: baseFontSize(fontSize, isTransliteration),
                  fontFamily: displayFont,
                },
              ]}
            />
            {row.item.tukGurmukhi && (
              <ListItemTitle
                title={row.item.tukGurmukhi}
                style={[
                  { color: isDarkMode ? theme.colors.textDisabled : theme.colors.primaryText },
                  { fontFamily: displayFont },
                  { fontSize: 17 },
                ]}
              />
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
  isFolderScreen: PropTypes.bool,
};

export default BaniList;
