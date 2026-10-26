import React, { useCallback } from "react";
import { FlatList, Animated, View, Platform, Pressable, useWindowDimensions } from "react-native";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import useBaniTitle from "@common/hooks/useBaniTitle";
import useScreenPalette from "@common/hooks/useScreenPalette";
import useTokens from "@common/hooks/useTokens";
import { FolderIcon } from "@common/icons";
import { baseFontSize, ListItemTitle, useCustomScrollbar } from "@common";
import { ListSeparator } from "../ui";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const BaniList = React.memo(({ data, onPress }) => {
  const { c, space, layout } = useTokens();
  // The bani list keeps its own ground; every other colour here is a role.
  const baniListPalette = useScreenPalette("baniList");
  const { scrollViewProps, Indicator } = useCustomScrollbar();
  const fontSize = useSelector((state) => state.fontSize);
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
              title={titleFor(row.item)}
              style={[
                { color: itemTextColor },
                {
                  fontSize: baseFontSize(fontSize, isTransliteration),
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
        </Pressable>
      );

      return listItem;
    },
    [c, space, layout, fontSize, titleFor, titleFontFamily, isTransliteration, onPress]
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
};

export default BaniList;
