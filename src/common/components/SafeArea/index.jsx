import React from "react";
import PropTypes from "prop-types";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const SafeArea = ({ children, backgroundColor, edges = ["top", "right", "bottom", "left"] }) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={[{ backgroundColor, flex: 1 }]} edges={edges}>
        {children}
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

SafeArea.propTypes = {
  children: PropTypes.node.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  edges: PropTypes.arrayOf(PropTypes.oneOf(["top", "right", "bottom", "left"])),
};

SafeArea.defaultProps = {
  edges: ["top", "right", "bottom", "left"],
};

export default SafeArea;
