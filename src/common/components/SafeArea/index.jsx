import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import PropTypes from "prop-types";
import { glyphsForSurface, useNavBarSurface } from "../../systemBars";

// A screen that fills the window and owns the bottom edge is, by definition,
// what the system navigation bar is drawn over. Declaring it here is what makes
// the glyphs right on every screen without each one remembering to say so:
// before this, only three places spoke, and anywhere else kept whatever the
// last screen left behind - white glyphs over a white pothi list, for instance.
//
// flex 1 is the discriminator. The tab bar is also a SafeArea with a bottom
// edge, but it is a strip (flex 0) sitting ON a screen rather than being one,
// and it already declares for itself.
//
// This registers a CLAIM rather than a default, because ordering is the whole
// point: the tab bar only treats itself as hidden for the bani length selector,
// so it goes on claiming its navy while a pushed screen covers it. A screen
// mounting over the bar claims after it and therefore outranks it, and hands
// back on pop.
const SafeArea = ({ children, backgroundColor, edges = [], flex = 1 }) => {
  const ownsBottom = flex === 1 && edges.includes("bottom");
  useNavBarSurface(ownsBottom ? glyphsForSurface(backgroundColor) : null);

  return (
    <SafeAreaView style={[{ backgroundColor, flex }]} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

SafeArea.propTypes = {
  children: PropTypes.node.isRequired,
  backgroundColor: PropTypes.string.isRequired,
  edges: PropTypes.arrayOf(PropTypes.oneOf(["top", "bottom", "left", "right"])),
  flex: PropTypes.number,
};

export default SafeArea;
