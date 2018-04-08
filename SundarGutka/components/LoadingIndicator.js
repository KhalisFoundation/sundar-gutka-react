import React, { Component } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";

class LoadingIndicator extends Component {
  render() {
    const { nightMode } = this.props;
    return (
      <View
        style={[
          styles.container,
          styles.loading,
          nightMode && { backgroundColor: "#000" }
        ]}
      >
        <ActivityIndicator size="small" color="#0000ff" />
      </View>
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

export default LoadingIndicator;
