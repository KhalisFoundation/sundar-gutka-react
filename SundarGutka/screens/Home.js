import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-elements";
import { StackNavigator } from "react-navigation";

export default class Home extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Button
          large
          icon={{ name: "envira", type: "font-awesome" }}
          title="Read Shabad"
          onPress={ () => { this.props.navigation.navigate("Reader") } }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
