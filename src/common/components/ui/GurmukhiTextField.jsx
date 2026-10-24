import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, Pressable, TextInput, useWindowDimensions, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import { SearchIcon } from "../../icons";
import GurmukhiKeyboardToggle from "./GurmukhiKeyboardToggle";
import Text from "./Text";

// A text field that can hand itself over to the in-app Punjabi keyboard.
//
// The switch sits INSIDE the field, at its trailing edge. Every sheet that
// offers the keyboard shows one field at a time, so the switch belongs to the
// field it types into — and a row of its own above the field was height taken
// from a sheet that already has a keyboard competing for it.
//
// The in-app keys and the phone's own keyboard are one or the other, never
// both — two keyboards over one field is what buried the bani search box behind
// the system one. See the two effects below.

/** How many characters of room the text keeps before the chip drops its label. */
const MIN_TEXT_CHARACTERS = 7;
/** Matches the input's own cap below, so the room is measured at what is drawn. */
const MAX_FONT_SCALE = 1.5;

/**
 * The shortest the phone's keyboard is when it is really on screen, in points.
 *
 * A show event below it is not a keyboard. On iOS, focusing the field while
 * the in-app keys are up swaps in an EMPTY input view — that is how
 * `showSoftInputOnFocus={false}` is built — and UIKit still announces it, at no
 * height; an iPad with a hardware keyboard announces only its shortcut bar.
 * Taking either for the phone's keyboard would switch the in-app keys off the
 * moment the user tapped into the field. Every real on-screen keyboard,
 * floating ones included, is well above this.
 */
const MIN_OS_KEYBOARD_HEIGHT = 100;

const GurmukhiTextField = ({
  value,
  onChange,
  accessibilityLabel,
  gurmukhiOpen,
  receivingKeys,
  keyboardToggle = null,
  search = false,
  placeholder = undefined,
  onFocus = undefined,
  onSubmit = undefined,
  maxLength = undefined,
  returnKeyType = "done",
}) => {
  const { c, space, radii, layout, type } = useTokens();
  const { fontScale } = useWindowDimensions();
  const input = useRef(null);
  // Held in a ref so the listener below is not re-attached on every render —
  // callers pass an inline arrow.
  const toggle = useRef(keyboardToggle?.onToggle);
  toggle.current = keyboardToggle?.onToggle;

  // Turning the in-app keys ON closes the phone's keyboard.
  //
  // `showSoftInputOnFocus` alone does not, on either platform: Android's
  // EditText applies it only to the NEXT focus, and iOS swaps the input view
  // without reloading it. A keyboard already up stayed up beside the in-app
  // one. Only when it IS up, so a field that is merely focused keeps its cursor.
  useEffect(() => {
    if (gurmukhiOpen && Keyboard.isVisible()) Keyboard.dismiss();
  }, [gurmukhiOpen]);

  // And the phone's keyboard coming up turns the in-app keys OFF — whatever
  // raised it. iOS says so before the animation; Android only after.
  useEffect(() => {
    if (!gurmukhiOpen) return undefined;
    let handed = false;
    const event = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(event, (e) => {
      // Once: a keyboard can announce itself twice (a height change, a
      // rotation) before the render that removes this listener, and a second
      // toggle would switch the in-app keys straight back on.
      if (handed || (e?.endCoordinates?.height ?? 0) < MIN_OS_KEYBOARD_HEIGHT) return;
      handed = true;
      toggle.current?.();
    });
    return () => subscription.remove();
  }, [gurmukhiOpen]);

  // Whether "ਅ Punjabi" fits beside the text, or only "ਅ" does.
  //
  // Measured rather than guessed, because both sides move: the field's width
  // with the screen, and the chip's with the language (the label runs from
  // "Punjabi" to "Pendjabi") and the text-size setting. The chip's FULL width
  // comes from a hidden copy that always shows its label, so hiding the label
  // on screen cannot change the measurement it was hidden by — no flicker.
  const [fieldWidth, setFieldWidth] = useState(0);
  const [chipWidth, setChipWidth] = useState(0);
  const iconSize = type.body.fontSize;
  const glyph = type.body.fontSize * Math.min(fontScale, MAX_FONT_SCALE);
  const insets = space.md + space.xs + (search ? iconSize + space.sm : 0) + space.sm;
  const room = fieldWidth - insets - chipWidth;
  const showLabel = fieldWidth === 0 || chipWidth === 0 || room >= glyph * MIN_TEXT_CHARACTERS;

  return (
    <Pressable
      // Anywhere on the field that is not the switch puts the cursor in it —
      // the icon and the padding are part of the field, not dead space.
      onPress={() => input.current?.focus()}
      accessible={false}
      onLayout={(event) => setFieldWidth(event.nativeEvent.layout.width)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        minHeight: layout.touchTarget,
        borderRadius: radii.sm,
        borderWidth: layout.borderWidth.hairline,
        // Reads as the live target while the in-app keys are up, so it is
        // obvious which field the keyboard at the bottom is typing into.
        borderColor: receivingKeys ? c.accent : c.borderStrong,
        paddingLeft: space.md,
        // Tighter on the trailing side, so the chip sits close to the edge the
        // way an in-field action does.
        paddingRight: keyboardToggle ? space.xs : space.md,
        backgroundColor: c.surface,
      }}
    >
      {search ? <SearchIcon size={iconSize} color={c.textSecondary} /> : null}

      {/* The placeholder is drawn here rather than by TextInput: the native hint
          ignores `fontFamily` (Android draws it in the system face), so it never
          matched the Baloo label above it. Sits behind the input, filling the
          same box, and goes the moment there is a value. */}
      {placeholder && !value ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: space.md + (search ? iconSize + space.sm : 0),
            right: keyboardToggle ? chipWidth + space.xs + space.sm : space.md,
            justifyContent: "center",
          }}
        >
          <Text variant="body" color="textDisabled" numberOfLines={1}>
            {placeholder}
          </Text>
        </View>
      ) : null}

      <TextInput
        ref={input}
        value={value}
        onChangeText={(next) => onChange(maxLength ? next.slice(0, maxLength) : next)}
        // Still read out, as the native placeholder was.
        accessibilityHint={placeholder}
        selectionColor={c.accent}
        accessibilityLabel={accessibilityLabel}
        onFocus={onFocus}
        onSubmitEditing={onSubmit}
        returnKeyType={returnKeyType}
        allowFontScaling
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        showSoftInputOnFocus={!gurmukhiOpen}
        style={{
          // Takes whatever the chip leaves, and may shrink below its content:
          // without `minWidth: 0` a long value pushes the chip out of the field.
          flex: 1,
          minWidth: 0,
          // Vertical padding rather than a fixed height, so a raised OS font
          // setting grows the field instead of clipping the text inside it.
          paddingVertical: space.md_12,
          paddingHorizontal: 0,
          color: c.textPrimary,
          // The body type ROLE, so the field tracks the type scale instead of
          // pinning a number the way the fields this replaced did.
          fontSize: type.body.fontSize,
          // The app's UI face, so the typed name matches the label above
          // instead of falling back to the system font.
          fontFamily: type.body.fontFamily,
        }}
      />

      {keyboardToggle ? (
        <>
          <GurmukhiKeyboardToggle
            label={keyboardToggle.label}
            accessibilityLabel={keyboardToggle.accessibilityLabel}
            active={gurmukhiOpen}
            onToggle={keyboardToggle.onToggle}
            showLabel={showLabel}
          />
          {/* The measuring copy: never seen, never tapped, never read out. */}
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onLayout={(event) => setChipWidth(event.nativeEvent.layout.width)}
            style={{ position: "absolute", opacity: 0 }}
          >
            <GurmukhiKeyboardToggle
              label={keyboardToggle.label}
              accessibilityLabel={keyboardToggle.accessibilityLabel}
              active={gurmukhiOpen}
              onToggle={keyboardToggle.onToggle}
            />
          </View>
        </>
      ) : null}
    </Pressable>
  );
};

GurmukhiTextField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  accessibilityLabel: PropTypes.string.isRequired,
  /** Whether the sheet's in-app keyboard is up at all (suppresses the OS one). */
  gurmukhiOpen: PropTypes.bool.isRequired,
  /** Whether THIS field is the one those keys are going into. */
  receivingKeys: PropTypes.bool.isRequired,
  /**
   * The in-field switch for the in-app keyboard. `label` is the short name
   * drawn on the chip, `accessibilityLabel` the full one read aloud.
   */
  keyboardToggle: PropTypes.shape({
    label: PropTypes.string.isRequired,
    accessibilityLabel: PropTypes.string.isRequired,
    onToggle: PropTypes.func.isRequired,
  }),
  /** Draws a leading search icon. */
  search: PropTypes.bool,
  placeholder: PropTypes.string,
  onFocus: PropTypes.func,
  onSubmit: PropTypes.func,
  maxLength: PropTypes.number,
  returnKeyType: PropTypes.string,
};

export default GurmukhiTextField;
