import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import PropTypes from "prop-types";
import {
  baniItems,
  createPothi,
  defaultPothi,
  makeBaniItem,
  MORNING_ID,
} from "@common/pothi/model";
import {
  convertToUnicode,
  CustomText,
  STRINGS,
  actions,
  logError,
  trackDashboardEvent,
} from "@common";
import { getBaniList } from "@database";
import useSetPothiBanis from "../../Pothi/hooks/useSetPothiBanis";
import reportPothiEmptied from "../../Pothi/reportPothiEmptied";
import CheckCircle from "./CheckCircle";
import useDashboardTheme from "./dashboardTheme";
import SheetModal from "./SheetModal";
import { toTitleCase } from "@common/hooks/useBaniLookup";

const styles = StyleSheet.create({
  // The sheet supplies a fixed, bounded height. Transfer it through this
  // wrapper so the long list consumes the remaining space and scrolls.
  container: { flex: 1 },
  listPad: { paddingBottom: 24 },
  list: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { flex: 1, fontSize: 17, textAlign: "center", paddingHorizontal: 8 },
  // 44pt minimum touch targets on both header controls.
  headerBtn: { minHeight: 44, minWidth: 60, justifyContent: "center" },
  headerAction: { fontSize: 15 },
  saveBtn: {
    minHeight: 44,
    minWidth: 60,
    paddingHorizontal: 18,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // Colour is set at render from c.onAccent: the Save pill is filled with the
  // Dashboard blue, which is a LIGHT blue in dark mode — a hardcoded white
  // vanished on it.
  saveText: { fontSize: 15 },
  pressed: { opacity: 0.7 },
  listContent: { padding: 16 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // The card already draws the outer edge; a divider under the last row would
  // double it.
  rowLast: { borderBottomWidth: 0 },
  rowText: { flex: 1 },
  // No fontWeight: Baloo is a named TTF, so a weight here loses the real glyph.
  gurmukhi: { fontSize: 16 },
  translit: { fontSize: 12, marginTop: 2 },
});

// Picks the banis that make up Today's Nitnem — which is the Morning Nitnem
// pothi, so this edits that pothi and nothing else. There is no separate
// dashboard list to keep in step with it.
const EditBanisModal = ({ visible, onClose }) => {
  const { cardBg, primaryText, mutedText, accentBlue, separator, theme, c } = useDashboardTheme();
  // Explicit fontFamily and NO fontWeight beside it. Baloo ships as separate
  // named TTFs, so a numeric weight makes Android try to synthesize bold and
  // silently drop back to the system font — which is why the title and Save
  // were not rendering in Baloo Paaji.
  const boldFont = theme.typography.fonts.balooPaajiSemiBold;
  const dispatch = useDispatch();
  // Whether the roman line under each name is shown AT ALL. Turning
  // transliteration off writes only this — `transliterationLanguage` keeps its
  // last value and the cached bani list is untouched — so a row that renders
  // `translit` unconditionally goes on showing the language last chosen. That
  // is why switching languages looked right here and Off did nothing.
  const isTransliteration = useSelector((state) => state.isTransliteration);
  // The TRANSLITERATION language, not `state.language`. `getBaniList` picks the
  // transliteration by this key, and `state.language` is the interface language
  // ("DEFAULT") — which matches no case in `getTranslitText` and falls through
  // to English, so the fallback below rendered English under every name
  // whatever the user had chosen.
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const baniListRedux = useSelector((state) => state.baniList);
  const morning = useSelector((state) => defaultPothi(state.pothis, "morning"));
  const setBanis = useSetPothiBanis();

  const [allBanis, setAllBanis] = useState([]);
  const [picked, setPicked] = useState([]);

  // The pothi's banis are the starting ticks, re-read on each open so a change
  // made in the Folders tab is what this opens on.
  //
  // Keyed on `visible` alone, and `morning` is read through a ref: depending on
  // the pothi would re-seed the draft every time it changed, and every tick
  // saved here changes it — which would fight the user mid-edit.
  const morningRef = useRef(morning);
  morningRef.current = morning;
  useEffect(() => {
    if (visible) setPicked(baniItems(morningRef.current).map((item) => item.baaniId));
  }, [visible]);

  useEffect(() => {
    if (baniListRedux?.length) {
      // Banis only. `EditBaniOrder` writes the user's FOLDERS into this same
      // redux list (`[...baniListData, ...folders]`), and a folder carries no
      // `id` — it is literally defined there as the entries whose `id` is
      // undefined. Rendering them here gave every folder row `key={undefined}`,
      // which is the "unique key prop" warning this screen was throwing, and
      // put rows in a bani picker that are not banis.
      setAllBanis(baniListRedux.filter((b) => b.id !== undefined));
    } else {
      getBaniList(transliterationLanguage).then(setAllBanis).catch(logError);
    }
  }, [baniListRedux, transliterationLanguage]);

  const toggle = useCallback((id) => {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const save = useCallback(() => {
    // Nothing to save against an unloaded list: `picked` starts as the pothi's
    // own banis, so an empty `allBanis` would resolve to an empty selection and
    // silently empty the pothi.
    if (allBanis.length === 0) return;
    // Built in bani-list order, so a Nitnem assembled here reads in the order
    // it is recited. An existing pothi keeps its own order and new banis append,
    // which is how a bani is added to any other pothi.
    const items = allBanis
      .filter((bani) => picked.includes(bani.id))
      .map((bani) =>
        makeBaniItem({
          baaniId: bani.id,
          title: bani.gurmukhiUni || convertToUnicode(bani.gurmukhi),
        })
      );

    if (morning) {
      if (!setBanis(morning, items)) return;
      reportPothiEmptied(baniItems(morning).length, items.length, "todays_nitnem");
    } else {
      // The pothi is gone — deleted from another client, since this app refuses
      // to delete it. Rebuild it under the same id the signed-out seed uses, so
      // it is recorded as Morning Nitnem again rather than becoming an ordinary
      // pothi the Dashboard cannot find.
      dispatch(
        actions.seedDefaultPothis([
          createPothi({ id: MORNING_ID, name: STRINGS.POTHI_DEFAULT_MORNING, items }),
        ])
      );
    }
    trackDashboardEvent("nitnem_banis_saved", { count: items.length });
    onClose();
  }, [allBanis, picked, morning, setBanis, dispatch, onClose]);

  return (
    <SheetModal visible={visible} onClose={onClose} heightRatio={0.75}>
      <View style={styles.container}>
        <View style={[styles.header, { borderBottomColor: separator }]}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <CustomText style={[styles.headerAction, { color: mutedText }]}>
              {STRINGS.CANCEL}
            </CustomText>
          </Pressable>
          <CustomText
            style={[styles.headerTitle, { color: primaryText, fontFamily: boldFont }]}
            numberOfLines={1}
          >
            {STRINGS.EDIT_BANIS}
          </CustomText>
          {/* Save is the primary action, so it reads as a button rather than as
              a second piece of plain text weighing the same as Cancel. */}
          <Pressable
            onPress={save}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: accentBlue },
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <CustomText style={[styles.saveText, { fontFamily: boldFont, color: c.onAccent }]}>
              {STRINGS.SAVE}
            </CustomText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, styles.listPad]}
        >
          {/* Rows sit on a card, as every other dashboard list does, instead of
              floating flat on the screen background. */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: separator }]}>
            {allBanis.map((b, i) => {
              const isPicked = picked.includes(b.id);
              return (
                <Pressable
                  key={b.id}
                  style={({ pressed }) => [
                    styles.row,
                    { borderBottomColor: separator },
                    i === allBanis.length - 1 && styles.rowLast,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => toggle(b.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isPicked }}
                >
                  <CheckCircle filled={isPicked} accent={accentBlue} muted={mutedText} />
                  <View style={styles.rowText}>
                    {/* Some banis (Amrit Bani, Bhagat Bani, 22 Vaaran,
                        Savaiye) carry no GurmukhiUni in the database, which
                        rendered their Gurmukhi line blank. Fall back to
                        converting the ASCII Gurmukhi, the same way the home
                        bani list does. */}
                    <CustomText style={[styles.gurmukhi, { color: primaryText }]} numberOfLines={1}>
                      {b.gurmukhiUni || convertToUnicode(b.gurmukhi)}
                    </CustomText>
                    {/* The roman second line exists only while transliteration
                        is on. Off means off here as it does everywhere else —
                        the rest of the app SWAPS the title for its
                        transliteration (see useBaniTitle), and this row stacks
                        the two instead, so what "off" removes is the line. */}
                    {isTransliteration && b.translit ? (
                      <CustomText style={[styles.translit, { color: mutedText }]} numberOfLines={1}>
                        {toTitleCase(b.translit)}
                      </CustomText>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SheetModal>
  );
};

EditBanisModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default EditBanisModal;
