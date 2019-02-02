import React, { Component } from "react";
import { StyleSheet, FlatList } from "react-native";
import { ListItem, Avatar } from "react-native-elements";
import { baseFontSize } from "../utils/helpers";
import LoadingIndicator from "../components/LoadingIndicator";

class BaniList extends Component {
  render() {
    const {
      data,
      nightMode,
      fontSize,
      fontFace,
      romanized,
      navigation,
      isLoading,
      onPress
    } = this.props;

    <LoadingIndicator isLoading={isLoading} />;

    return (
      <FlatList
        style={[styles.container, nightMode && { backgroundColor: "#000" }]}
        data={data}
        extraData={[this.state]}
        renderItem={({ item }) => (
          <ListItem
            leftAvatar={
              item.folder && (
                <Avatar
                  source={require("../images/foldericon.png")}
                  avatarStyle={{
                    backgroundColor: nightMode ? "#000" : "#fff"
                  }}
                />
              )
            }
            containerStyle={[
              styles.container,
              nightMode && { backgroundColor: "#000" }
            ]}
            titleStyle={[
              nightMode && { color: "#fff" },
              {
                fontSize: baseFontSize(fontSize, romanized),
                fontFamily: !romanized ? fontFace : null
              }
            ]}
            title={romanized ? item.roman : item.gurmukhi}
            bottomDivider={true}
            onPress={() => onPress(item, navigation)}
          />
        )}
        keyExtractor={item => "" + item.gurmukhi}
      />
    );
  }
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center"
  },
  container: {
    flex: 1,
    marginTop: 0
  }
});

export default BaniList;
