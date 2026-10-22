import React from "react";
import { StyleSheet, View } from "react-native";
import useTokens from "../../hooks/useTokens";

// The rule between two list rows.
//
// A faint INSET hairline, which is the platform spec for a list: it starts at
// the text margin and stops short of the opposite edge, rather than running
// full-bleed and making the list read as ruled paper. iOS insets only the
// leading edge; both are inset here so it does not read as lopsided.
//
// One implementation. The bani list, the Folders tab and the add-to-pothi
// picker each had their own copy of these five lines, which is how a list could
// end up with the row height of one and the divider of another.
//
// `layout.screenGutter` is the same token every row pads itself by, so the line
// tracks the text margin instead of restating a number beside it.
const ListSeparator = () => {
  const { c, layout } = useTokens();

  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: c.border,
        marginHorizontal: layout.screenGutter,
      }}
    />
  );
};

export default ListSeparator;
