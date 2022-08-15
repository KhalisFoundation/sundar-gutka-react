import React, { Component } from "react";
import { StyleSheet, FlatList } from "react-native";
import { ListItem, Avatar } from "react-native-elements";
import { baseFontSize } from "../utils/helpers";
import LoadingIndicator from "./LoadingIndicator";

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
        borderBottomColor: "#fff",
      },
    });

    return (
      <FlatList
        style={[styles.container, nightMode && { backgroundColor: "#000" }]}
        data={data}
        extraData={[this.state]}
        renderItem={({ item }) => (
          <ListItem
            bottomDivider
            style={item.folder && styles.rowViewContainer}
            containerStyle={[styles.container, nightMode && { backgroundColor: "#000" }]}
            onPress={() => onPress(item, navigation)}
          >
            {item.folder && <Avatar source={require("../images/foldericon.png")} />}

            <ListItem.Content>
              <ListItem.Title
                style={[
                  nightMode && { color: "#fff" },
                  {
                    fontSize: baseFontSize(fontSize, transliteration),
                    fontFamily: !transliteration ? fontFace : null,
                  },
                ]}
              >
                {transliteration ? item.translit : item.gurmukhi}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Chevron />
          </ListItem>
        )}
        keyExtractor={(item) => `${item.gurmukhi}`}
      />
    );
  }
}

export default BaniList;
