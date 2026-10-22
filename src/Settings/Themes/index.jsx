import React, { useCallback, useEffect, useMemo } from "react";
import { Animated, View, StyleSheet, useWindowDimensions } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import useThemeRegistry from "@theme/reader/useThemeRegistry";
import PropTypes from "prop-types";
import { applyTheme } from "@common/actions";
import useTokens from "@common/hooks/useTokens";
import {
  STRINGS,
  SafeArea,
  StatusBarComponent,
  GradientDivider,
  useBackHandler,
  useCustomScrollbar,
  trackThemeEvent,
} from "@common";
import { ScreenHeader, Text } from "../../common/components/ui";
import { useThemePickerRefresh } from "../../services/themes/useRemoteThemesSync";
import { themeLabel, themeOptions } from "./options";
import SystemThemePreview from "./SystemThemePreview";
import ThemeTile from "./ThemeTile";

// The app's single theme picker.
//
// One flat grid, no section headings: the tiles fit on a screen, and someone
// choosing a page does not think in categories like "traditional" or "high
// contrast". Tapping a tile applies it immediately — the tile IS the preview,
// rendered from the theme's own record, and the change is instant and
// reversible, so a confirm step only added a tap.
//
// Choosing a designed theme sets BOTH axes at once: Blue puts the app in dark
// and the Reader in Blue, Puratan puts the app in light and the Reader on
// parchment. That pairing is declared in each theme record (`base`), so this
// screen only has to store the choice.

// Three columns from 600dp up — tablets, unfolded foldables and landscape
// phones. Recomputed from useWindowDimensions, so rotating reflows the grid
// rather than leaving a stale column count.
const WIDE_BREAKPOINT = 600;

const styles = StyleSheet.create({
  body: { flex: 1 },
  hint: { textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
});

const Themes = ({ navigation }) => {
  const dispatch = useDispatch();
  const { c, space, layout } = useTokens();
  const selected = useSelector((state) => state.theme);
  const language = useSelector((state) => state.language);
  // Bundled themes plus whatever the backend has added, corrected or withdrawn.
  const registry = useThemeRegistry();
  // Opening the picker is the one place a stale catalogue is visible, so it
  // asks for a fresh one — TTL-gated, and a no-op offline.
  useThemePickerRefresh();
  const options = useMemo(() => themeOptions(registry), [registry]);

  const { width } = useWindowDimensions();
  const columns = width >= WIDE_BREAKPOINT ? 3 : 2;
  // The same scrollbar as every other list: under a designed theme the thumb
  // follows the theme on both platforms, which the native bar cannot do.
  const { scrollViewProps, Indicator } = useCustomScrollbar();

  // Once per visit. `theme_selected` on its own cannot tell a picker nobody
  // opens from one people open and leave — this is that denominator, and it
  // also reports how much of the grid the backend is supplying.
  useEffect(() => {
    trackThemeEvent("picker_opened", {
      current: selected,
      option_count: options.length,
      remote_count: options.filter((o) => registry.byId[o.value]?.remote).length,
    });
    // Empty deps on purpose: the screen is pushed and popped, so a remount IS
    // a new visit, and the values above are the ones it OPENED with — re-firing
    // them when the selection changes would double-count every visit.
  }, []);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);
  useBackHandler(handleBackPress);

  const apply = useCallback(
    (value) => {
      trackThemeEvent("selected", {
        theme_id: value,
        previous: selected,
        source: registry.byId[value]?.remote ? "remote" : "bundled",
      });
      return dispatch(applyTheme(value));
    },
    [dispatch, selected, registry]
  );

  const labelFor = (option) => themeLabel(option, language, STRINGS);

  return (
    <SafeArea backgroundColor={c.backgroundAlt} edges={["bottom", "left", "right"]}>
      <StatusBarComponent backgroundColor={c.backgroundAlt} />
      <ScreenHeader
        title={STRINGS.theme}
        onBack={handleBackPress}
        backAccessibilityLabel={STRINGS.GO_BACK}
        surface="backgroundAlt"
        showBorder={false}
      />
      <GradientDivider />

      {/* Indicator is a SIBLING inside a flex:1 wrapper, as the hook requires. */}
      <View style={styles.body}>
        <Animated.ScrollView
          style={{ backgroundColor: c.backgroundAlt }}
          contentContainerStyle={{ paddingBottom: layout.screenPaddingBottom, padding: space.md }}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...scrollViewProps}
        >
          <Text
            variant="caption"
            color="textSecondary"
            style={[styles.hint, { paddingBottom: space.md }]}
          >
            {STRINGS.theme_hint}
          </Text>

          {/* One radiogroup over every tile, so a screen reader announces the
              whole grid as a single choice.

              A plain wrapped View grid rather than a FlatList: a handful of tiles
              in total, so virtualisation buys nothing and a FlatList nested in a
              ScrollView would only add scroll conflicts. */}
          <View style={styles.grid} accessibilityRole="radiogroup">
            {options.map((option) => (
              <View key={option.value} style={{ width: `${100 / columns}%`, padding: space.xs }}>
                <ThemeTile
                  theme={option.record ?? undefined}
                  label={labelFor(option)}
                  selected={selected === option.value}
                  onPress={() => apply(option.value)}
                  previewNode={option.record ? undefined : <SystemThemePreview />}
                />
              </View>
            ))}
          </View>
        </Animated.ScrollView>
        {Indicator}
      </View>
    </SafeArea>
  );
};

Themes.propTypes = {
  navigation: PropTypes.shape({ goBack: PropTypes.func }).isRequired,
};

export default Themes;
