import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { View, Animated, Pressable } from "react-native";
import { useReaderTheme } from "@theme/reader";
import PropTypes from "prop-types";
import { foldableTopSpace, useFoldableInsetTop } from "@common/deviceForm";
import useTokens from "@common/hooks/useTokens";
import { BackArrowIcon, BookmarkIcon, PlusIcon } from "@common/icons";
import { constant, CustomText, GradientDivider, STRINGS, useThemedStyles } from "@common";
import createStyles from "../styles";
import { barMotion } from "../utils/barMotion";

// Only used for the frames before the header has measured itself. Any real
// value comes from onLayout below.
const HIDDEN_OFFSET_FALLBACK = 120;

const Header = ({
  title,
  handleBackPress,
  handleBookmarkPress,
  handleAddToPothiPress,
  isHeader,
}) => {
  const styles = useThemedStyles(createStyles);
  // This bar is opaque and physically contiguous with the Bani text, so it
  // follows the READING theme rather than the app appearance — otherwise a cream
  // page would sit under a black bar the moment the two axes disagree.
  //
  // Background and foreground are taken together, and must stay that way:
  // retinting only the bar would land near-white icons on a light ground. The
  // light/dark records resolve these back to `c.backgroundAlt` and `c.headerFg`,
  // which is what the stylesheet sets, so following the app changes nothing.
  const { theme: readerTheme } = useReaderTheme();
  const { headerBackground, headerForeground } = readerTheme.chrome;
  // The SAME resolved numbers the shared ScreenHeader uses.
  //
  // `useThemedStyles` hands `createStyles` the RAW theme, while ScreenHeader
  // reads `useTokens`, which scales layout for the device width and OS font
  // size. `minHeight` is a container key, so the shared header's row grew with
  // the font setting and this one did not — the title centred in a taller box
  // sat lower there than here, which is the last way the two disagreed. Taking
  // the resolved value directly makes them the same number by construction.
  const { layout } = useTokens();
  // A foldable gives back whatever of the stylesheet's fixed clearance its
  // cutout does not need; null everywhere else. See deviceForm.js.
  const foldableInsetTop = useFoldableInsetTop();
  const animationPosition = useRef(new Animated.Value(0)).current;
  // Width of the trailing slot, measured rather than assumed — the same
  // technique the shared ScreenHeader uses. The title is centred by the two
  // sides being EQUAL, and this side now holds two icons whose combined width
  // depends on the device's font scale, so it cannot be a constant.
  const [actionsWidth, setActionsWidth] = useState(0);
  // Same reasoning applied to the hide distance: measured, not assumed. Until
  // the first onLayout lands there is nothing to measure, so fall back to the
  // constant this used to hardcode.
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const hiddenOffset = measuredHeight || HIDDEN_OFFSET_FALLBACK;

  const headerLeft = () => (
    <Pressable
      onPress={() => {
        handleBackPress();
      }}
    >
      <BackArrowIcon size={25} color={headerForeground} />
    </Pressable>
  );

  // The reader's two header actions: file this bani into a pothi, and open the
  // bookmarks for it. `hitSlop` gives each glyph the 44pt target the platform
  // asks for without growing the bar.
  //
  // Filing sits to the LEFT of bookmarks — it acts on the bani in front of you,
  // where bookmarks navigates away, and the destination-changing control stays
  // in the corner it has always been in.
  const headerRight = () => (
    <>
      {/* Hidden with the feature off — filing a bani needs somewhere to file
          it to, and there are no user pothis then. See constant.POTHI_ENABLED. */}
      {constant.POTHI_ENABLED && (
        <Pressable
          onPress={() => {
            handleAddToPothiPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={STRINGS.POTHI_ADD_TO}
          hitSlop={layout.hitSlop}
        >
          {/* A plus, not a folder. The action is "add this bani to something",
              and a folder glyph beside a bookmark read as a second place to go
              rather than as something to do to the bani in front of you. The
              accessibility label above still names the destination. */}
          <PlusIcon size={26} color={headerForeground} />
        </Pressable>
      )}
      <Pressable
        onPress={() => {
          handleBookmarkPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={STRINGS.bookmarks}
        hitSlop={layout.hitSlop}
      >
        <BookmarkIcon size={25} color={headerForeground} />
      </Pressable>
    </>
  );

  // Layout effect and the shared bar motion, both for the same reason as the
  // bottom nav's in the Reader: it starts in the commit that flips `isHeader`,
  // and it moves on the nav's clock rather than one of its own.
  useLayoutEffect(() => {
    const value = isHeader ? 0 : -hiddenOffset;

    // Stop any existing animation first
    animationPosition.stopAnimation();

    const animation = Animated.timing(animationPosition, {
      toValue: value,
      ...barMotion(isHeader),
      useNativeDriver: true,
    });

    animation.start((finished) => {
      if (!finished) {
        // If animation was interrupted, force the final value
        animationPosition.setValue(value);
      }
    });

    // Cleanup function
    return () => {
      animation.stop();
    };
  }, [isHeader, animationPosition, hiddenOffset]);

  // Add animation reset as fallback for stuck states
  useEffect(() => {
    const resetTimer = setTimeout(() => {
      // Force position if animation seems stuck
      const targetValue = isHeader ? 0 : -hiddenOffset;
      animationPosition.setValue(targetValue);
    }, 1000);

    return () => clearTimeout(resetTimer);
  }, [isHeader, animationPosition, hiddenOffset]);

  return (
    <Animated.View
      // Slides up by its OWN measured height. A fixed offset only ever suits one
      // header: a title that wraps to two lines, or a raised OS font size, makes
      // this taller than the constant and the overflow stays parked on screen.
      // `|| FALLBACK` covers the first frame, before onLayout has reported.
      onLayout={(e) => setMeasuredHeight(e.nativeEvent.layout.height)}
      style={[
        styles.animatedView,
        {
          transform: [{ translateY: animationPosition }],
        },
      ]}
      pointerEvents="box-none" // Ensure touch events pass through
    >
      <View
        style={[
          styles.headerStyle,
          { backgroundColor: headerBackground },
          foldableInsetTop !== null && {
            paddingTop: foldableTopSpace(foldableInsetTop, layout.header.topClearance),
          },
        ]}
        pointerEvents="auto"
      >
        <View style={[styles.headerWrapper, { minHeight: layout.header.minHeight }]}>
          {/* Given the trailing slot's measured width as a floor, so the two
              sides are equal and the title lands on the screen's centre. */}
          <View style={[styles.headerLeft, { minWidth: actionsWidth }]}>{headerLeft()}</View>
          <View style={styles.headerCenter}>
            {/* Header chrome, so the header face — NOT the user's bani font.
                The title is the Unicode name, which Baloo renders correctly. */}
            <CustomText style={[styles.headerTitleStyle, { color: headerForeground }]}>
              {title}
            </CustomText>
          </View>
          <View
            style={styles.headerRight}
            onLayout={(e) => setActionsWidth(e.nativeEvent.layout.width)}
          >
            {headerRight()}
          </View>
        </View>
      </View>
      {/* No colour override. GradientDivider already picks the right one: the
          brand ramp under Light and Dark, and the reading theme's heading
          colour under a designed theme. Forcing headerForeground here painted
          the rule near-white in dark mode, because that role IS the header's
          light-on-dark foreground — a regression against stock dark. */}
      <GradientDivider />
    </Animated.View>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
  handleBackPress: PropTypes.func.isRequired,
  handleBookmarkPress: PropTypes.func.isRequired,
  /** Opens the add-to-pothi sheet, or sends a signed-out user to Settings. */
  handleAddToPothiPress: PropTypes.func.isRequired,
  isHeader: PropTypes.bool.isRequired,
};
export default Header;
