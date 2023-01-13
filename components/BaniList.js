import React, { Component } from "react";
import { StyleSheet, FlatList } from "react-native";
import { ListItem, Avatar } from "react-native-elements";
import PropTypes from "prop-types";
import { baseFontSize } from "../utils/helpers";
import LoadingIndicator from "./LoadingIndicator";
import GLOBAL from "../utils/globals";
import * as anvaad from "anvaad-js";

class BaniList extends Component {
  render() {
    const { data, nightMode, fontSize, fontFace, transliteration, navigation, isLoading, onPress } =
      this.props;

    <LoadingIndicator isLoading={isLoading} />;

    const styles = StyleSheet.create({
      loading: {
        justifyContent: "center",
      },
      container: {
        flex: 1,
        marginTop: 0,
      },
      rowViewContainer: {
        paddingBottom: 0.1,
        borderBottomWidth: 0.2,
        borderBottomColor: GLOBAL.COLOR.WHITE_COLOR,
      },
      row: {},
    });

    return (
      <FlatList
        style={[styles.row, nightMode && { backgroundColor: GLOBAL.COLOR.NIGHT_BLACK }]}
        data={data}
        extraData={[this.state]}
        renderItem={({ item }) => (
          <ListItem
            bottomDivider
            style={item.folder && styles.rowViewContainer}
            containerStyle={[nightMode && { backgroundColor: GLOBAL.COLOR.NIGHT_BLACK }]}
            onPress={() => onPress(item, navigation)}
          >
            {item.folder && <Avatar source={require("../images/foldericon.png")} />}

            <ListItem.Content>
              <ListItem.Title
                style={[
                  nightMode && { color: GLOBAL.COLOR.WHITE_COLOR },
                  {
                    fontSize: baseFontSize(fontSize, transliteration),
                    fontFamily: !transliteration ? fontFace : null,
                  },
                ]}
              >
                {transliteration ? item.translit : anvaad.unicode(item.gurmukhi)}
              </ListItem.Title>
            </ListItem.Content>
            {item.folder && <ListItem.Chevron />}
          </ListItem>
        )}
        keyExtractor={(item) => `${item.gurmukhi}`}
      />
    );
  }
}
BaniList.defaultProps = {
  data: [],
  isLoading: true,
};

BaniList.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape()),
  nightMode: PropTypes.bool.isRequired,
  fontSize: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  transliteration: PropTypes.bool.isRequired,
  navigation: PropTypes.shape().isRequired,
  isLoading: PropTypes.bool,
  onPress: PropTypes.func.isRequired,
};

export default BaniList;
