import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-elements";
import { StackNavigator } from "react-navigation";
import SQLite from 'react-native-sqlite-storage';
import Database from '../utils/Database';


export default class Home extends React.Component {

loadAndQueryDB(){
  var temp = Database.getResults();
}

  render() {
    return (
      <View style={styles.container}>
        <Button
          large
          icon={{ name: "envira", type: "font-awesome" }}
          title={"hi"}
          onPress={ () => { this.loadAndQueryDB() } }
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
