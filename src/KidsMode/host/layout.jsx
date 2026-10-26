// The prototype simulated a phone inside a browser with its own scrollers and sheet;
// on a device those are platform widgets.
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import PropTypes from "prop-types";
import { useUI } from "../design/components";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
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

export const Scroll = ({ children }) => (
  <ScrollView
    style={styles.flex}
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
  >
    {children}
  </ScrollView>
);

export const HorizontalScroll = ({ children }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {children}
  </ScrollView>
);

// Rendered inside the design's UIProvider, so the sheet takes the night/day palette from it.
export const Sheet = ({ open, onOpenChange, title, children }) => {
  const { t } = useUI();
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
    >
      {/* Tapping the dimmed area closes, matching the prototype's sheet. */}
      <Pressable style={styles.backdrop} onPress={() => onOpenChange(false)} />
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
    </Modal>
  );
};

const childrenType = PropTypes.node;
Scroll.propTypes = { children: childrenType };
Scroll.defaultProps = { children: null };
HorizontalScroll.propTypes = { children: childrenType };
HorizontalScroll.defaultProps = { children: null };
Sheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: childrenType,
};
Sheet.defaultProps = { children: null };
