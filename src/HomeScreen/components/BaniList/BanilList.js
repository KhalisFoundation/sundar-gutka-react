import React from "react";
import { StyleSheet, FlatList } from "react-native";
import { ListItem } from "@rneui/themed";
import PropTypes from "prop-types";
import constant from "../../../common/constant";

const styles = StyleSheet.create({
  text: {
    fontFamily: constant.GURBANI_AKHAR_TRUE,
  },
});

const renderBanis = (item, navigate) => {
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
        <ListItem.Title style={styles.text}>{item.item.gurmukhi}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );
};
function BaniList(props) {
  const { data, navigate } = props;
  return (
    <FlatList
      data={data}
      renderItem={(item) => renderBanis(item, navigate)}
      keyExtractor={(item) => item.id}
    />
  );
}

BaniList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  navigate: PropTypes.func.isRequired,
};

export default BaniList;
