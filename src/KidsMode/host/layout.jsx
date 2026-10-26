// The prototype simulated a phone inside a browser with its own scrollers and sheet;
// on a device those are platform widgets.
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import Overlay from "../../common/components/ui/Overlay";
import { useUI } from "../design/components";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  backdrop: { flex: 1 },
  sheet: {
    maxHeight: "86%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  close: { fontSize: 16, fontWeight: "600" },
});

export const Scroll = ({ children = null }) => (
  <ScrollView
    style={styles.flex}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    {children}
  </ScrollView>
);

export const HorizontalScroll = ({ children = null }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {children}
  </ScrollView>
);

// Rendered inside the design's UIProvider, so the sheet takes the night/day palette from it.
// The app's ui/Sheet draws its own title row and actions; the design draws those itself and
// only needs a window, so this stays a thin wrapper over Overlay.
export const Sheet = ({ open, onOpenChange, title, children = null }) => {
  const { t } = useUI();
  // The scrim is the app's own, so every overlay dims the screen the same way.
  const { c } = useTokens();
  return (
    <Overlay visible={open} animationType="slide" onRequestClose={() => onOpenChange(false)}>
      {/* Tapping the dimmed area closes, matching the prototype's sheet. */}
      <Pressable
        style={[styles.backdrop, { backgroundColor: c.scrim }]}
        onPress={() => onOpenChange(false)}
      />
      <View style={[styles.sheet, { backgroundColor: t.surface }]}>
        <View style={[styles.grabber, { backgroundColor: t.separator }]} />
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: t.text }]}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => onOpenChange(false)}
          >
            <Text style={[styles.close, { color: t.primary }]}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>{children}</ScrollView>
      </View>
    </Overlay>
  );
};

const childrenType = PropTypes.node;
Scroll.propTypes = { children: childrenType };
HorizontalScroll.propTypes = { children: childrenType };
Sheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: childrenType,
};
