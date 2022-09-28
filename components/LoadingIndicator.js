import React, { PureComponent } from "react";
import { View, Modal } from "react-native";
import PropTypes from "prop-types";
import globals from "../utils/globals";

const Spinner = require("react-native-spinkit");

class LoadingIndicator extends PureComponent {
  render() {
    const { MODAL_BACKGROUND_COLOR } = globals.COLOR;
    const { isLoading } = this.props;
    return (
      <Modal animationType="fade" transparent visible={isLoading} onRequestClose={() => null}>
        <View
          style={{
            flex: 1,
            backgroundColor: MODAL_BACKGROUND_COLOR,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Spinner isVisible size={100} type="FadingCircleAlt" color="#fff" />
        </View>
      </Modal>
    );
  }
}
LoadingIndicator.propTypes = {
  isLoading: PropTypes.bool.isRequired,
};

export default LoadingIndicator;
