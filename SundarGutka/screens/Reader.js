import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { connect } from "react-redux";

class Reader extends React.Component {
  render() {
    const {params} = this.props.navigation.state
    return (
      <View style={styles.container}>
        <Text>{JSON.stringify(params)}</Text>
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

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode
  };
}

export default connect(mapStateToProps)(Reader);