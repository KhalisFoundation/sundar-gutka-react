import React, { useEffect } from "react";
import { View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import useTokens from "@common/hooks/useTokens";
import { actions, BaniList, GradientDivider, SafeArea, StatusBarComponent, STRINGS } from "@common";
import { ScreenHeader } from "../common/components/ui";
import constant from "../common/constant";
import useBookmarks from "./hooks/useBookmarks";

// Migrated onto the design system. This screen hardcoded `#041126` five times
// and repeated the same `theme.mode === "dark" ? … : …` ternary alongside each
// one — the surface colour, the status bar, the app bar, the title and the
// content wrapper each deciding the theme for themselves. All of it is now
// `c.background`, which also drops the navy dark ground in favour of the
// neutral one.
//
// `styles.js` had no consumers at all and `hooks/useHeader.js` only set
// `headerShown: false`; both are deleted.

const Bookmarks = ({ navigation, route }) => {
  const { c } = useTokens();
  const { bookmarksData } = useBookmarks(route);
  const dispatch = useDispatch();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fontFace = useSelector((state) => state.fontFace);
  const isBaloo = fontFace === constant.BALOO_PAAJI;

  const onPress = (item) => {
    dispatch(actions.setBookmarkPosition(item.item.shabadID));
    navigation.goBack();
  };

  const formattedData = bookmarksData?.map((item, index) => {
    const { gurmukhi, gurmukhiUni, tukGurmukhi, tukGurmukhiUni, shabadID } = item;
    const title = isBaloo && gurmukhiUni ? gurmukhiUni : gurmukhi;
    // The tuk line ONLY, and only in a script the current bani font can draw.
    //
    // The subtitle renders in the bani font, so the old fallback chain produced
    // two kinds of nonsense on banis that carry no tuk for a bookmark:
    //   • under Baloo it fell through to the ASCII `tukGurmukhi`, which that
    //     font cannot render — Mool Mantar's first bookmark showed a garbled
    //     "mool ma(n)tar" beneath a perfectly good Gurmukhi title, and
    //   • failing that it fell through to `translit`, the Roman name, so Tav
    //     Prasad Sawaiye read "ਪਉੜੀ ੧" with "Pauree 1" repeated underneath.
    //
    // An empty string means the row simply has no second line, which is the
    // right answer when there is no tuk to show.
    const subtitle = isBaloo ? tukGurmukhiUni || "" : tukGurmukhi || "";

    return {
      ...item,
      key: (shabadID ?? index).toString(),
      gurmukhi: title,
      tukGurmukhi: subtitle,
    };
  });

  return (
    <SafeArea backgroundColor={c.background} edges={["bottom"]}>
      <StatusBarComponent backgroundColor={c.background} />
      <ScreenHeader
        title={STRINGS.bookmarks}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={STRINGS.GO_BACK}
        // The GradientDivider below IS this header's rule. Without this the
        // header also drew its own hairline, stacking two lines.
        showBorder={false}
      />
      <GradientDivider />
      <View style={{ flex: 1, backgroundColor: c.background }}>
        <BaniList data={formattedData} onPress={onPress} />
      </View>
    </SafeArea>
  );
};

Bookmarks.propTypes = {
  navigation: PropTypes.shape().isRequired,
  route: PropTypes.shape().isRequired,
};

export default Bookmarks;
