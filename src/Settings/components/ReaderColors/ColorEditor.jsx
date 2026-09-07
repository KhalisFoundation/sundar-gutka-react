import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { setReaderColors } from "@common/actions";
import constant from "@common/constant";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import STRINGS from "@common/localization";
import {
  contrastRatio,
  gradientBackground,
  isHexColor,
  READER_COLOR_KEYS,
  resolveReaderColors,
  sanitizeReaderColors,
} from "@theme/readerColors";
import createPreviewHTML from "./preview";
import createStyles from "./styles";

const SWATCHES = [
  "#ffffff",
  "#121212",
  "#faf9f6",
  "#f5e6c8",
  "#113979",
  "#77baff",
  "#087f6c",
  "#5cdbbd",
  "#b34400",
  "#ffb86b",
  "#8e44ad",
  "#e5a9ff",
];

const ColorEditor = ({ mode, initialColor, onClose }) => {
  const saved = useSelector((state) => state.readerColors?.[mode]);
  const fontFace = useSelector((state) => state.fontFace);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const isLarivar = useSelector((state) => state.isLarivaar);
  const isLarivarAssist = useSelector((state) => state.isLarivaarAssist);
  const [draft, setDraft] = useState(() => sanitizeReaderColors(saved));
  const [selected, setSelected] = useState(initialColor);
  const palette = resolveReaderColors(mode, draft);
  const [input, setInput] = useState(palette[initialColor] || palette.text);
  const [previewStyle, setPreviewStyle] = useState(vishraamOption);
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const valid = isHexColor(input);
  const modeLabel = mode === "dark" ? STRINGS.dark : STRINGS.light;
  const labels = {
    background: STRINGS.reader_background,
    text: STRINGS.reader_gurmukhi,
    heading: STRINGS.reader_heading,
    subheading: STRINGS.reader_subheading,
    transliteration: STRINGS.transliteration,
    translation: STRINGS.translations,
    vishraamShort: STRINGS.reader_short_pause,
    vishraamLong: STRINGS.reader_long_pause,
    larivaar: STRINGS.larivaar_assist,
  };

  const source = useMemo(
    () => ({
      html: createPreviewHTML(
        { ...theme, mode, readerColors: resolveReaderColors(mode, draft) },
        fontFace,
        {
          vishraamOption: previewStyle,
          isLarivar: isLarivar || selected === "larivaar",
          isLarivarAssist: isLarivarAssist || selected === "larivaar",
          colorKey: selected,
        }
      ),
      baseUrl: Platform.OS === "ios" ? "./" : "",
    }),
    [theme, mode, draft, fontFace, previewStyle, isLarivar, isLarivarAssist, selected]
  );

  const chooseColor = (value) => {
    setInput(value);
    if (isHexColor(value))
      setDraft((previous) => ({ ...previous, [selected]: value.toLowerCase() }));
  };
  const selectField = (key) => {
    setSelected(key);
    setInput(palette[key] || palette.text);
  };
  const reset = () => {
    setDraft({});
    const defaults = resolveReaderColors(mode);
    setInput(defaults[selected] || defaults.text);
  };
  // For gradients, report text contrast at the solid end of the highlight.
  // The live preview also shows the transparent part of the gradient.
  const ratio =
    selected.startsWith("vishraam") && previewStyle === constant.VISHRAAM_GRADIENT
      ? contrastRatio(palette.text, gradientBackground(palette[selected], palette.background))
      : contrastRatio(
          selected === "background" ? palette.text : palette[selected] || palette.text,
          palette.background
        );

  return (
    <Modal
      visible
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      supportedOrientations={["portrait", "landscape"]}
    >
      <KeyboardAvoidingView
        style={[styles.modal, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={STRINGS.cancel}
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.text}>{STRINGS.cancel}</Text>
          </Pressable>
          <Text style={styles.text}>{modeLabel}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={STRINGS.reader_save_colors}
            accessibilityState={{ disabled: !valid }}
            disabled={!valid}
            style={[styles.button, !valid && styles.disabled]}
            onPress={() => {
              dispatch(setReaderColors(mode, draft));
              onClose();
            }}
          >
            <Text style={styles.text}>{STRINGS.reader_save_colors}</Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          stickyHeaderIndices={[2]}
        >
          <Text style={styles.title}>{STRINGS.reader_colors}</Text>
          <Text style={styles.caption}>
            {STRINGS.reader_colors_mode_hint} {modeLabel}
          </Text>
          <View
            style={[
              styles.preview,
              ["translation", "transliteration"].includes(selected) && styles.secondaryPreview,
              { backgroundColor: palette.background },
            ]}
            accessibilityLabel={STRINGS.reader_color_preview}
          >
            <WebView
              testID="reader-color-preview"
              source={source}
              style={[styles.webview, { backgroundColor: palette.background }]}
              scrollEnabled={false}
              javaScriptEnabled={false}
              originWhitelist={["about:blank", "file://*"]}
            />
          </View>
          <View style={styles.row}>
            {["vishraamShort", "vishraamLong"].map((key) => (
              <View key={key} style={styles.legend}>
                <View style={[styles.legendSwatch, { backgroundColor: palette[key] }]} />
                <Text style={styles.caption}>{labels[key]}</Text>
              </View>
            ))}
          </View>
          <View style={styles.row}>
            {[
              { key: constant.VISHRAAM_COLORED, label: STRINGS.colored_words },
              { key: constant.VISHRAAM_GRADIENT, label: STRINGS.gradient_background },
            ].map(({ key, label }) => (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: previewStyle === key }}
                style={[styles.button, previewStyle === key && styles.selected]}
                onPress={() => setPreviewStyle(key)}
              >
                <Text style={styles.text}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.row}>
            {READER_COLOR_KEYS.map((key) => (
              <Pressable
                key={key}
                accessibilityRole="radio"
                accessibilityLabel={labels[key]}
                accessibilityState={{ checked: selected === key }}
                style={[styles.button, selected === key && styles.selected]}
                onPress={() => selectField(key)}
              >
                <Text style={styles.text}>{labels[key]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.text}>{labels[selected]}</Text>
          <TextInput
            accessibilityLabel={STRINGS.reader_hex_color}
            testID="reader-color-input"
            style={styles.input}
            value={input}
            onChangeText={chooseColor}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={7}
          />
          {!valid && (
            <Text accessibilityRole="alert" style={styles.caption}>
              {STRINGS.reader_invalid_color}
            </Text>
          )}
          <View style={styles.row}>
            {SWATCHES.map((color) => (
              <Pressable
                key={color}
                accessibilityRole="radio"
                accessibilityLabel={`${labels[selected]} ${color}`}
                accessibilityState={{ checked: palette[selected] === color }}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  palette[selected] === color && styles.selectedSwatch,
                ]}
                onPress={() => chooseColor(color)}
              />
            ))}
          </View>
          <Text style={styles.caption} accessibilityLiveRegion="polite">
            {STRINGS.reader_contrast}: {ratio.toFixed(2)}:1.{" "}
            {ratio < 4.5 ? STRINGS.reader_low_contrast : STRINGS.reader_contrast_hint}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={STRINGS.reader_reset_colors}
            style={styles.button}
            onPress={reset}
          >
            <Text style={styles.text}>{STRINGS.reader_reset_colors}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

ColorEditor.propTypes = {
  mode: PropTypes.oneOf(["light", "dark"]).isRequired,
  initialColor: PropTypes.oneOf(READER_COLOR_KEYS).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ColorEditor;
