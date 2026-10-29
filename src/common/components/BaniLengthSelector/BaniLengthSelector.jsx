import React, { useState } from "react";
import { Animated, View, Pressable } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useDispatch } from "react-redux";
import { Icon } from "@rneui/themed";
import { withAlpha } from "@theme/colorUtils";
import ScreenRolesProvider from "@theme/ScreenRolesProvider";
import { useCustomScrollbar } from "@common/components/ScrollIndicator";
import Dialog from "@common/components/ui/Dialog";
import constant from "@common/constant";
import { useNavBarSurface } from "@common/systemBars";
import { CustomText, STRINGS, useThemedStyles, useTheme } from "@common";
import { setBaniLength } from "../../actions";
import createStyles from "./style";

// Map each display label → its Redux constant value.
// toUpperCase() fails for "Extra Long" → "EXTRA LONG" (space ≠ underscore).
const LENGTH_CONSTANT_MAP = {
  [STRINGS.short]:      constant.SHORT,
  [STRINGS.medium]:     constant.MEDIUM ?? "MEDIUM",
  [STRINGS.long]:       constant.LONG,
  [STRINGS.extra_long]: constant.EXTRA_LONG,
};

const BaniLengthSelector = () => {
  // First run, before there is a tab bar: this screen owns the whole display,
  // and its ground is the brand navy in both themes, so the glyphs stay light.
  useNavBarSurface(false);
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const baniLengths = [STRINGS.short, STRINGS.medium, STRINGS.long, STRINGS.extra_long];
  const dispatch = useDispatch();
  const [helpVisible, setHelpVisible] = useState(false);
  // This page keeps its navy ground in EVERY theme, so neither platform's own
  // indicator works on it: iOS draws a black one and Android's comes from a
  // static app resource. Passing a colour makes the shared hook draw the thumb
  // itself on both. onPrimary is by definition the ink for this ground, so a
  // designed theme re-derives the pair together.
  const { scrollViewProps, Indicator } = useCustomScrollbar(withAlpha(theme.c.onPrimary, 0.5));

  // Nine paragraphs as one message, blank-line separated. Built here rather
  // than at module scope so it is rebuilt when the app language changes.
  const helpMessage = [
    STRINGS.bani_length_alert_1,
    STRINGS.bani_length_alert_2,
    STRINGS.bani_length_alert_3,
    STRINGS.bani_length_alert_4,
    STRINGS.bani_length_alert_5,
    STRINGS.bani_length_alert_6,
    STRINGS.bani_length_alert_7,
    STRINGS.bani_length_alert_8,
    STRINGS.bani_length_alert_9,
  ].join("\n\n");

  const handleOnpress = (length) => {
    const constantValue = LENGTH_CONSTANT_MAP[length] ?? length.toUpperCase();
    dispatch(setBaniLength(constantValue));
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.wrapper}>
        {/* The whole page scrolls. Five paragraphs, four buttons and a help link
            already overflow the smallest device the app supports (320×568) in
            English at the default text size, and the OS text-size setting scales
            that up by half again on top of a display-size setting that shrinks
            the viewport. Fixed, the last length button and the help link were
            simply off-screen — and this is the one-time setup the app will not
            move past, so there was no way round it. Indicator is a SIBLING of
            the scrollable inside a flex:1 host, as the hook requires. */}
        <View style={styles.scrollHost}>
          <Animated.ScrollView
            contentContainerStyle={styles.scrollContent}
            // The hook's props bag is its own contract; naming its keys here
            // would couple this call site to it. Same spread as its others.
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...scrollViewProps}
          >
            <View style={styles.viewWrapper}>
              {/* Unicode Gurmukhi (not the legacy ASCII-mapped STRINGS.khalsa_sundar_gutka,
                  which only renders under the GurbaniAkhar font) so it displays correctly
                  in Baloo Paaji 2 — the Gurmukhi-capable Baloo variant. */}
              <CustomText style={styles.heading}>ਖਾਲਸਾ ਸੁੰਦਰ ਗੁਟਕਾ</CustomText>
              <CustomText style={styles.baniLengthMessage}>
                {STRINGS.bani_length_message_1}
              </CustomText>
              <CustomText style={styles.baniLengthMessage}>
                {STRINGS.bani_length_message_2}
              </CustomText>
              <CustomText style={styles.textPreferrence}>
                {STRINGS.choose_your_preference}
              </CustomText>
              {baniLengths.map((buttonText) => (
                <Pressable key={buttonText} onPress={() => handleOnpress(buttonText)}>
                  <CustomText style={styles.button}>{buttonText}</CustomText>
                </Pressable>
              ))}
              <Pressable style={styles.helpWrapper} onPress={() => setHelpVisible(true)}>
                <Icon color={theme.c.goldFill} name="info" size={30} />
                <CustomText style={styles.helpText}>{STRINGS.need_help_deciding}</CustomText>
              </Pressable>
            </View>
          </Animated.ScrollView>
          {Indicator}
        </View>
      </SafeAreaView>

      {/* The app's own Dialog, not a card of this screen's making. The card
          this replaces capped itself with maxHeight: "70%", a percentage that
          does not resolve against the modal window — so nine paragraphs at a
          raised text size pushed it past the screen and the OK button off the
          bottom. Dialog caps against useWindowDimensions instead, which is the
          same lesson written into it when a long `pa` message did this to the
          confirm dialogs, and it scrolls the overflow. */}
      {/* Scoped to the settings palette, the same way the reminder and pothi
          sheets are. A primary Button paints itself from `ctaFill`, which the
          semantic layer leaves undefined, so unscoped it falls back to
          `primary` — and `primary` is the BOTTOM NAV BAR's navy, the same
          value in dark as in light. On this dialog's near-black card that is
          1.3:1, which is why OK read as bare text with no button behind it.
          The settings palette defines the CTA pair for exactly this reason
          (see screenPalettes) and puts the fill at 5.14:1 on the card. It is
          dark-only, so light mode resolves to the same colours as before. */}
      <ScreenRolesProvider screen="settings">
        <Dialog
          visible={helpVisible}
          title={STRINGS.bani_length}
          message={helpMessage}
          confirmLabel={STRINGS.ok}
          onConfirm={() => setHelpVisible(false)}
          onCancel={() => setHelpVisible(false)}
        />
      </ScreenRolesProvider>
    </SafeAreaProvider>
  );
};
export default BaniLengthSelector;
