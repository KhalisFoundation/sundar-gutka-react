import React, { Component } from "react";
import { View, Modal } from "react-native";
var Spinner = require("react-native-spinkit");

class LoadingIndicator extends Component {
  render() {
    const { isLoading } = this.props;
    return (
      <Modal animationType="fade" transparent={true} visible={isLoading} onRequestClose={() => null}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Spinner
            isVisible={true}
            size={100}
            type={"FadingCircleAlt"}
            color={"#fff"}
          />
        </View>
      </Modal>
    );
  }
}

export default LoadingIndicator;
