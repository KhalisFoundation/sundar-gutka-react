import React, { useMemo } from "react";
import { View } from "react-native";
import PropTypes from "prop-types";
import useBaniTitle from "@common/hooks/useBaniTitle";
import useTokens from "@common/hooks/useTokens";
import { makeBaniItem } from "@common/pothi/model";
import { STRINGS } from "@common";
import { GurmukhiTextField, Text } from "../../common/components/ui";
import BaniPickRow from "./BaniPickRow";
import { baniCountLabel } from "./PothiRow";

// "Choose banis" as a whole sheet step, in its two parts: the count and search
// field fixed at the top (`PickBanisStep.Search`), and the list that scrolls
// under them (`PickBanisStep`).
//
// ONE implementation, used by both places that offer it — the second step of
// creating a pothi, and Add Banis on a pothi that already exists. Those were two
// copies of the same screen, and every defect in the copy (the list too short,
// no Cancel/Done, the list running underneath them, no count) had to be fixed
// twice and was only ever fixed once. There is nothing left to keep in step.
//
// The picker is always expanded. It is the entire step, so there is nothing to
// collapse back into and nothing else on the sheet competing for the height.
//
// Two parts because only the host `Sheet` can hold something still while its
// body scrolls: the search goes in the sheet's `header`, so browsing a long list
// never scrolls the field away from it, and the list is the body. The in-app
// keyboard and the Cancel and Confirm buttons are the sheet's `footer` — see
// `SheetActions`.

/** The count and the search field, fixed above the list. */
const PickBanisSearch = ({ pickedCount, query, onQueryChange, gurmukhiOpen, onToggleGurmukhi }) => {
  const { space } = useTokens();

  return (
    <View style={{ gap: space.md }}>
      {/* A readout, not an action. */}
      <Text variant="bodySmall" color={pickedCount ? "accent" : "textSecondary"}>
        {baniCountLabel(pickedCount)}
      </Text>

      <GurmukhiTextField
        value={query}
        onChange={onQueryChange}
        placeholder={STRINGS.POTHI_SEARCH_BANIS}
        accessibilityLabel={STRINGS.POTHI_SEARCH_BANIS}
        returnKeyType="search"
        search
        gurmukhiOpen={gurmukhiOpen}
        receivingKeys={gurmukhiOpen}
        keyboardToggle={{
          label: STRINGS.POTHI_KEYBOARD_CHIP,
          accessibilityLabel: STRINGS.POTHI_KEYBOARD_TOGGLE,
          onToggle: onToggleGurmukhi,
        }}
      />
    </View>
  );
};

PickBanisSearch.propTypes = {
  pickedCount: PropTypes.number.isRequired,
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  /** Whether the sheet's in-app keyboard is up; the caller renders the keys. */
  gurmukhiOpen: PropTypes.bool.isRequired,
  onToggleGurmukhi: PropTypes.func.isRequired,
};

/** The list of banis to tick, filtered by the search above it. */
const PickBanisStep = ({ picked, onChange, baniListData, query }) => {
  const { space } = useTokens();
  const { titleFor, titleFontFamily } = useBaniTitle();

  // Leaf banis only. A bundled folder is a container, not something a pothi can
  // hold — its children are offered individually instead.
  const options = useMemo(() => {
    const leaves = (baniListData ?? []).filter((b) => !Array.isArray(b.folder) && b.id != null);
    const needle = query.trim().toLowerCase();
    if (!needle) return leaves;
    return leaves.filter((bani) =>
      [bani.gurmukhiUni, bani.gurmukhi, bani.translit]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle))
    );
  }, [baniListData, query]);

  const chosen = useMemo(() => new Set(picked.map((item) => item.baaniId)), [picked]);

  const toggle = (bani) => {
    if (chosen.has(bani.id)) {
      onChange(picked.filter((item) => item.baaniId !== bani.id));
      return;
    }
    onChange([...picked, makeBaniItem({ baaniId: bani.id, title: titleFor(bani) })]);
  };

  return (
    <>
      {/* The list does NOT scroll itself. The host Sheet does, and one scroller
          is the whole point.

          It used to be a ScrollView capped at a share of the window. Two
          problems, both of which the keyboard made unbearable. A nested
          vertical scroller inside the sheet's own meant the two fought for
          every drag, which is why scrolling these sheets was so hard. And the
          cap was measured against the FULL window with a `listMinHeight`
          FLOOR — so with the keys up it went on claiming height that no longer
          existed, and the search field was pushed off the bottom of a sheet
          that could not scroll to reach it.

          Rendered inline, the column is simply as tall as it is and the sheet
          scrolls it. Nothing is ever unreachable at any text size, and the keys
          stay pinned below because they are the Sheet's footer, not part of
          this. The rows were already all rendered by this map, so nothing is
          virtualised now that was not before. */}
      <View style={{ paddingVertical: space.md_12 }}>
        {options.map((bani) => (
          <BaniPickRow
            key={bani.id}
            title={titleFor(bani)}
            checked={chosen.has(bani.id)}
            fontFamily={titleFontFamily}
            onPress={() => toggle(bani)}
          />
        ))}
      </View>
    </>
  );
};

PickBanisStep.propTypes = {
  /** Wire-shaped bani items chosen so far. */
  picked: PropTypes.arrayOf(PropTypes.shape({ baaniId: PropTypes.number })).isRequired,
  /** Receives the whole next selection; the caller decides how to apply it. */
  onChange: PropTypes.func.isRequired,
  baniListData: PropTypes.arrayOf(PropTypes.shape()).isRequired,
  query: PropTypes.string.isRequired,
};

PickBanisStep.Search = PickBanisSearch;

export default PickBanisStep;
