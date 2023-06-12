import React from "react";
import { FlatList } from "react-native";
import { ListItem } from "@rneui/themed";
import PropTypes from "prop-types";
import constant from "../../../common/constant";
import { useSelector } from "react-redux";
import { baseFontSize } from "../../../common/helpers";

const renderBanis = (item, navigate, fontSize, fontFace, isTransliteration) => {
  return (
    <ListItem
      bottomDivider
      onPress={() => {
        navigate(constant.READER, {
          key: `Reader-${item.id}`,
          params: { item },
        });
      }}
    >
      <ListItem.Content>
        <ListItem.Title
          style={{
            fontSize: baseFontSize(fontSize, isTransliteration),
            fontFamily: !isTransliteration ? fontFace : null,
          }}
        >
          {isTransliteration ? item.item.translit : item.item.gurmukhi}
        </ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );
};
function BaniList(props) {
  const { fontSize, fontFace, isTransliteration, transliterationLanguage } = useSelector(
    (state) => state
  );
  const { data, navigate } = props;
  return (
    <FlatList
      data={data}
      renderItem={(item) =>
        renderBanis(item, navigate, fontSize, fontFace, isTransliteration, transliterationLanguage)
      }
      keyExtractor={(item) => item.id}
    />
  );
}

BaniList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  navigate: PropTypes.func.isRequired,
};

export default BaniList;
