import React from "react";
import { StyleSheet, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { openWebViewInstaller } from "@common/webViewAvailability";
import { STRINGS } from "@common";
import { Button, Text } from "../ui";

// What a screen shows in place of its WebView when Android cannot create one
// (see webViewAvailability.js). It names the cause, sends the user to the
// provider's store listing, and offers a re-check for when they come back —
// the alternative was the process dying the moment the screen mounted.
//
// Sized by its content: the body runs 3–4× the English in the other languages
// and the labels wrap rather than clip, as every Button does.
const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  body: { width: "100%", maxWidth: 420 },
  actions: { width: "100%" },
});

const WebViewUnavailable = ({ onRetry }) => {
  const { c, space } = useTokens();
  return (
    <View style={[styles.wrap, { backgroundColor: c.background, padding: space.lg }]}>
      <View style={styles.body}>
        <Text variant="title" color="textPrimary" align="center">
          {STRINGS.WEBVIEW_MISSING_TITLE}
        </Text>
        <Text
          variant="body"
          color="textSecondary"
          align="center"
          style={{ marginTop: space.sm, marginBottom: space.lg }}
        >
          {STRINGS.WEBVIEW_MISSING_BODY}
        </Text>
        <View style={[styles.actions, { gap: space.sm }]}>
          <Button title={STRINGS.WEBVIEW_UPDATE} onPress={openWebViewInstaller} />
          <Button title={STRINGS.TRY_AGAIN} variant="secondary" onPress={onRetry} />
        </View>
      </View>
    </View>
  );
};

WebViewUnavailable.propTypes = { onRetry: PropTypes.func.isRequired };

export default WebViewUnavailable;
