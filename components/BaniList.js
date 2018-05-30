import React, { Component } from "react";
import { StyleSheet, FlatList, View, ActivityIndicator } from "react-native";
import { List, ListItem, Avatar } from "react-native-elements";
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
    if (isLoading) {
      return <LoadingIndicator nightMode={this.props.nightMode} />;
    }
    return (
      <List
        containerStyle={[
          styles.container,
          nightMode && { backgroundColor: "#000" }
        ]}
      >
        <FlatList
          data={data}
          extraData={[this.state]}
          renderItem={({ item }) => (
            <ListItem
              avatar={
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
                { fontSize: baseFontSize(fontSize, romanized) }
              ]}
              title={romanized ? item.roman : item.gurmukhi}
              fontFamily={!romanized ? fontFace : null}
              underlayColor={(color = nightMode ? "#464646" : "#c8c7cc")}
              onPress={() => onPress(item, navigation)}
            />
          )}
          keyExtractor={item => "" + item.gurmukhi}
        />
      </List>
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
