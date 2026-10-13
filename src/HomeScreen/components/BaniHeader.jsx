import React from "react";
import { View } from "react-native";
import { paletteFor } from "@theme/screenPalettes";
import PropTypes from "prop-types";
import { SettingsIconComponent } from "@common/components";
import {
  STRINGS,
  CustomText,
  useTheme,
  useThemedStyles,
  SafeArea,
  GradientDivider,
  constant,
} from "@common";
import createStyles from "../styles";

// The title carries NO explicit lineHeight — see the note on the name below.

const BaniHeader = ({ navigate }) => {
  const { theme } = useTheme();
  const { c } = theme;
  const styles = useThemedStyles(createStyles);
  // The one header foreground: brand navy in light, white in dark.
  const iconColor = c.headerFg;
  // The top inset strip belongs to the header, so it takes the header's own
  // ground — on the semantic background it drew a dark band above the
  // invocation line.
  const ground = paletteFor("baniList", theme).surface;
  return (
    <SafeArea backgroundColor={ground} edges={["top"]} flex={0}>
      <View style={styles.newHeaderContainer}>
        <CustomText style={styles.newHeaderInvocationText}>
          {"॥ "}
          {/* The "<>" ligature in the Gurbani font is the Ik Onkar with its full
              elongated stroke over the onkar. Neither alternative draws it:
              the Unicode ੴ in Baloo Paaji flattens the stroke, and the same
              Unicode character in the Gurbani font decomposes into "੧ਓਁ".
              One character of a second typeface inside the line is the price of
              the correct glyph. */}
          <CustomText style={styles.ikOnkarGlyph}>{"<>"}</CustomText>
          {" ਸ੍ਰੀ ਵਾਹਿਗੁਰੂ ਜੀ ਕੀ ਫਤਹਿ ॥"}
        </CustomText>
        <View style={styles.titleRow}>
          {/* Balances the settings slot on the right, so the title sits on the
              header's true centre rather than being nudged left by it. */}
          <View style={styles.titleSpacer} />
          {/* The ornaments are SIBLINGS of the title, not children of it.
              Nested inside one Text they shared its truncation, so the moment
              the line did not fit the ellipsis ate the closing flower and the
              title read "ਸੁੰਦਰ ਗੁਟ… " with nothing on the right. As their own
              nodes they carry `flexShrink: 0`, so the name gives way first and
              both flowers always survive. */}
          <View style={styles.titleCenter}>
            {/* "Œ" and "‰" map to the floral ornaments in the Gurbani font. */}
            <CustomText style={styles.titleFlower}>Œ</CustomText>
            {/* The VIEW shrinks, not the Text — and that distinction is the
                whole fix. With `flexShrink` on the Text itself, Yoga measured
                its height at the pre-shrink width (one line), then narrowed it:
                the name duly wrapped, but the node was still only one line tall,
                so "ਗੁਟਕਾ" was laid out past the bottom of its own box and
                clipped. The header read "ਸੁੰਦਰ" on a perfectly ordinary phone.
                A View shrinks in the row and lets the Text inside report its
                real wrapped height, so the second line has somewhere to live. */}
            <View style={styles.titleNameWrap}>
              {/* No line cap: the name WRAPS rather than ellipsizing, so a
                  narrow header reads
                      ਸੁੰਦਰ
                      ਗੁਟਕਾ
                  between the two ornaments instead of "ਸੁੰਦਰ …". The row is
                  `alignItems: center`, so the flowers stay vertically centred
                  against the taller two-line block. */}
              {/* NO explicit lineHeight, and it must stay that way. React Native
                  cuts a Text off on Android when it carries one and is laid out
                  inside a row — facebook/react-native#53286 — and this Text sits
                  in `titleCenter`, a row. With one set, the wrapped second line
                  vanished and the header read "ਸੁੰਦਰ" with no "ਗੁਟਕਾ".
                  Leaving it unset is also the more correct answer: the font's own
                  line spacing scales with `fontSize`, so the OS text setting is
                  followed for free, which is the very thing a hand-computed
                  lineHeight had to work to reproduce. */}
              <CustomText style={styles.newHeaderTitleText}>{STRINGS.sg_title}</CustomText>
            </View>
            <CustomText style={styles.titleFlower}>‰</CustomText>
          </View>
          <View style={styles.settingsWrap}>
            <SettingsIconComponent
              size={26}
              color={iconColor}
              handleSettingsPress={() => navigate(constant.SETTINGS)}
            />
          </View>
        </View>
        <GradientDivider style={styles.newHeaderGradientDivider} />
      </View>
    </SafeArea>
  );
};

BaniHeader.propTypes = {
  navigate: PropTypes.func.isRequired,
};

export default BaniHeader;
