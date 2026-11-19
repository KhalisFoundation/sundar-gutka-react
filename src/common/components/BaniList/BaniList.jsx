import React, { useCallback } from "react";
import { FlatList, Animated, View, Platform, Pressable, useWindowDimensions } from "react-native";
import PropTypes from "prop-types";
import useBanisWithAudio from "@common/hooks/useBanisWithAudio";
import useBaniTitle from "@common/hooks/useBaniTitle";
import useScreenPalette from "@common/hooks/useScreenPalette";
import useTokens from "@common/hooks/useTokens";
import { FolderIcon, MusicIcon } from "@common/icons";
import { baseFontSize, ListItemTitle, STRINGS, useCustomScrollbar, constant } from "@common";
import { ListSeparator } from "../ui";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

// The audio mark is drawn in proportion to the row's name, so it keeps its weight
// against the name at every Font Size step instead of shrinking beside a large one.
const AUDIO_MARK_RATIO = 0.75;

// `showAudio` marks the banis that have a recording. Only lists whose rows ARE
// banis turn it on; Bookmarks rows are sections of one bani, not banis.
const BaniList = React.memo(({ data, onPress, showAudio = false }) => {
  const { c, space, layout, scale } = useTokens();
  const banisWithAudio = useBanisWithAudio();
  // The bani list keeps its own ground; every other colour here is a role.
  const baniListPalette = useScreenPalette("baniList");
  const { scrollViewProps, Indicator } = useCustomScrollbar();
  // The one implementation of "what does this bani's name say, and in what
  // face" — see useBaniTitle. It used to be a private `getBaniTuk` here, which
  // is how My Pothi ended up with a second copy that ignored transliteration.
  const { titleFor, titleFontFamily, isTransliteration } = useBaniTitle();
  // `useWindowDimensions` re-renders on rotation, split-screen and foldable
  // unfold on its own. This replaced a `Dimensions.get` snapshot plus a manual
  // change listener and a piece of state that duplicated what the hook gives.
  const { width, height } = useWindowDimensions();
  const isPotrait = height >= width;

  const renderBanis = useCallback(
    (row) => {
      const itemTextColor = c.textPrimary;
      const displayFont = titleFontFamily;
      const title = titleFor(row.item);
      const titleSize = baseFontSize(constant.SMALL, isTransliteration);
      const hasAudio = showAudio && !row.item.folder && banisWithAudio.has(row.item.id);

      // Rows are separated by a faint INSET hairline (see ItemSeparator below),
      // which is Apple's spec for a list: a light grey at low opacity starting
      // at the text margin, not a full-bleed rule. The original looked like
      // ruled paper because it drew a line edge-to-edge under every row AND
      // packed the rows tightly; the fix is both — inset the line and give the
      // rows room to breathe.
      const listItem = (
        <Pressable
          onPress={() => onPress(row)}
          accessibilityRole="button"
          // The mark is a drawing, so a screen reader is told in words. Rows
          // without audio keep reading their own text, as before.
          accessibilityLabel={
            hasAudio
              ? [title, row.item.tukGurmukhi, STRINGS.AUDIO_AVAILABLE].filter(Boolean).join(", ")
              : undefined
          }
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
            // The press tint is the only fill this row ever has, and only while
            // the finger is down.
            backgroundColor: pressed ? c.surfaceSelected : "transparent",
            paddingHorizontal: layout.screenGutter,
            paddingVertical: space.lg,
            // A minimum, so a long name or a raised font setting makes the row
            // taller rather than clipping it.
            minHeight: layout.row.minHeight,
          })}
        >
          {row.item.folder && <FolderIcon size={22} color={c.textSecondary} />}
          <View style={{ flex: 1, gap: space.xxs }}>
            <ListItemTitle
              title={title}
              style={[
                { color: itemTextColor },
                {
                  fontSize: titleSize,
                  fontFamily: displayFont,
                },
              ]}
              // Wraps to a second line rather than shrinking. Shrink-to-fit
              // sized each name by its own string length, so the list rendered
              // at a dozen different sizes — and it silently overrode the
              // user's own font-size setting, which is the one thing this row
              // is supposed to honour.
              numberOfLines={2}
            />
            {row.item.tukGurmukhi && (
              <ListItemTitle
                title={row.item.tukGurmukhi}
                style={[{ color: c.textSecondary }, { fontFamily: displayFont }, { fontSize: 15 }]}
                numberOfLines={2}
              />
            )}
          </View>
          {/* At the row's end, so the marks line up in one column down the list.
              The name column flexes, so a long name wraps before it reaches this. */}
          {hasAudio && (
            <MusicIcon
              // The name is also scaled by the OS text size (capped, see
              // ListItemTitle), so the mark takes the same capped factor.
              size={Math.round(titleSize * scale.fontScale * AUDIO_MARK_RATIO)}
              // The app's icon role: the same one the Home settings cog and the
              // Dashboard and Seva crosses use.
              color={c.headerFg}
            />
          )}
        </Pressable>
      );

      return listItem;
    },
    [
      c,
      space,
      layout,
      scale,
      titleFor,
      titleFontFamily,
      isTransliteration,
      onPress,
      showAudio,
      banisWithAudio,
    ]
  );

  return (
    // One flat ground, the same one the header sits on, so the list reads as a
    // continuation of the screen rather than a panel dropped onto it. It fills
    // the viewport so a short folder (e.g. Sawaiye) shows no seam.
    <View style={{ flex: 1, backgroundColor: baniListPalette.surface }}>
      <AnimatedFlatList
        style={!isPotrait && Platform.OS === "ios" && { marginLeft: 30 }}
        // No paddingTop. Each row already pads itself, so an extra 8pt here sat
        // ONLY above the first row and nowhere else, reading as a stray gap
        // between the header and the start of the list. The trailing space stays
        // — that one clears the bottom navigation.
        contentContainerStyle={{ paddingBottom: space.xxl }}
        data={data}
        renderItem={renderBanis}
        // Drawn BETWEEN rows only — a FlatList separator never renders after the
        // last item, so the list ends on whitespace instead of a stray line.
        ItemSeparatorComponent={ListSeparator}
        keyExtractor={(item) => item.gurmukhi}
        // The scrollbar hook hands back a set of scroll handlers as one object;
        // spreading is how it is meant to be applied.
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...scrollViewProps}
      />
      {Indicator}
    </View>
  );
});

BaniList.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      item: PropTypes.shape({
        id: PropTypes.number.isRequired,
        gurmukhi: PropTypes.string.isRequired,
        translit: PropTypes.string.isRequired,
      }),
    })
  ).isRequired,
  onPress: PropTypes.func.isRequired,
  // eslint-disable-next-line react/require-default-props -- defaulted in the arguments; the rule can't see through React.memo
  showAudio: PropTypes.bool,
};

export default BaniList;
