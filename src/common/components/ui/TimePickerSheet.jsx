import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import PropTypes from "prop-types";
import useTokens from "../../hooks/useTokens";
import Button from "./Button";
import Sheet from "./Sheet";
import Text from "./Text";

// The app's own time picker.
//
// The native dialog could not meet the brief. On Android it is an AppCompat
// dialog that follows the SYSTEM theme, so with the app forced to Dark on a
// light phone it opens white; and its clock dial looks nothing like the iOS
// wheel, so the two platforms never matched. This is drawn from the same tokens
// as the rest of the app, so it is identical on both and always follows the
// app's own Light/Dark setting.
//
// ── Setting a time ─────────────────────────────────────────────────────────
// Two ways in, and NO mode switch to hunt for:
//
//   Scroll  — the wheels, for a nudge of a few minutes.
//   Type    — TAP THE HIGHLIGHTED VALUE. The picker collapses to a single row
//             of numeric fields with the tapped one focused. Done, or a tap
//             away, returns it to the wheels.
//
// Tapping the thing you want to change is the whole interaction. Research on
// time pickers is consistent that typing beats scrolling for anything past a
// small adjustment, and that the two have to coexist rather than one being
// modal over the other.
//
// The typed layout is ONE ROW TALL on purpose. The keyboard takes roughly half
// the screen, and a five-row wheel left standing would push the field straight
// back underneath it — which is exactly what happened. `Sheet` lifts itself
// clear of the keyboard; this makes sure there is little enough left to lift.
//
// ── The wheels ─────────────────────────────────────────────────────────────
// The SELECTION BAND IS FIXED in the middle and the values scroll underneath
// it. Whatever comes to rest in the band is the value. The band is drawn once
// in the parent so it reads as one bar across all three columns, rather than
// each column highlighting its own row and the highlight appearing to move.
//
// Each column is a PLAIN list — 12, 60 and 2 rows. It does not wrap.
//
// It used to: eleven copies of the data with a silent recentre once a scroll
// settled, so 10:59 -> 10:00 was one notch back. That is a nice property and it
// cost far too much. A 660-row list is virtualized, and VirtualizedList swapping
// spacers in and out under `snapToInterval` makes the list reposition
// mid-scroll (facebook/react-native#37448) — on top of the recentring itself
// interrupting anything still in motion. Between them they produced a picker
// that jumped back on almost any gesture.
//
// The big jump is handled by TYPING instead, which every study of these
// controls says is faster and more accurate than scrolling anyway, and which
// Material's own time picker offers alongside its dial for exactly this reason.
// Small adjustment: scroll. Large one: tap the number. Nothing here virtualizes,
// nothing recentres, and there is no arithmetic mapping an index onto a copy.
//
// Row height comes from `layout`, and `px()` rounds it to a whole number —
// which matters, because a fractional `snapToInterval` accumulates offset error
// down a list (facebook/react-native#21441).

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const MERIDIEM = ["AM", "PM"];

/** Rows visible at once. Odd, so exactly one sits in the middle. */
const VISIBLE_ROWS = 5;
const PAD_ROWS = (VISIBLE_ROWS - 1) / 2;

/** "3:05 PM" -> { hour: "3", minute: "05", meridiem: "PM" }. Exported for tests. */
export const parse = (value) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((value || "").trim());
  if (!m) return { hour: "12", minute: "00", meridiem: "AM" };
  return { hour: String(Number(m[1])), minute: m[2], meridiem: m[3].toUpperCase() };
};

/**
 * Clamps typed digits into a real hour or minute.
 * Exported for tests — this is where bad input is contained, and a bad value
 * here schedules a reminder at the wrong time or at no time at all.
 */
export const clampTyped = (text, kind) => {
  const digits = (text || "").replace(/[^0-9]/g, "").slice(0, 2);
  if (digits === "") return "";
  const n = Number(digits);
  if (kind === "hour") return String(Math.min(Math.max(n, 1), 12));
  return String(Math.min(n, 59)).padStart(2, "0");
};

/** One wheel. */
const Column = ({
  data,
  value,
  onChange,
  rowHeight,
  editable = false,
  onStartEdit = undefined,
  editHint = undefined,
  testID = undefined,
}) => {
  const { c } = useTokens();
  const listRef = useRef(null);

  const indexFor = (v) => Math.max(0, data.indexOf(v));

  // Captured once. Held in a ref rather than read from `value` on every render
  // so the effect below cannot re-fire and yank the list back while the user is
  // mid-scroll — it only ever positions the wheel on open.
  const openedAtRef = useRef(indexFor(value));

  useEffect(() => {
    const id = setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: openedAtRef.current * rowHeight, animated: false });
    }, 0);
    return () => clearTimeout(id);
  }, [rowHeight]);

  // A typed value has to move the wheel under the band, or the two would
  // disagree the moment the fields close.
  const lastValueRef = useRef(value);
  useEffect(() => {
    if (value === lastValueRef.current) return;
    lastValueRef.current = value;
    listRef.current?.scrollToOffset({ offset: indexFor(value) * rowHeight, animated: false });
    // `indexFor` closes over props that do not change for the life of a column.
  }, [value, rowHeight]);

  const indexAt = (event) => Math.round(event.nativeEvent.contentOffset.y / rowHeight);

  /**
   * Read the value under the band. NEVER scrolls.
   *
   * Called when the finger lifts, which is BEFORE momentum has finished, so
   * touching the scroll position here fights the fling that is still running —
   * that was the picker snapping back on every movement.
   */
  const readValue = (event) => {
    const next = data[indexAt(event)];
    if (next === undefined || next === value) return;
    lastValueRef.current = next;
    onChange(next);
  };

  /** Motion has stopped: whatever is under the band is the value. */
  const settle = readValue;

  return (
    <FlatList
      ref={listRef}
      testID={testID}
      data={data}
      keyExtractor={(item, i) => `${item}-${i}`}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingVertical: rowHeight * PAD_ROWS }}
      showsVerticalScrollIndicator={false}
      snapToInterval={rowHeight}
      // NOT `disableIntervalMomentum`: it caps a fling at a single interval, so
      // a hard swipe moved exactly one number and stopped dead. On a 60-row
      // minute wheel that reads as the picker refusing to move.
      decelerationRate="fast"
      getItemLayout={(_, i) => ({ length: rowHeight, offset: rowHeight * i, index: i })}
      // 60 rows at most. Rendering the lot keeps VirtualizedList from swapping
      // in spacers mid-scroll, which is what makes snapToInterval reposition on
      // a long list (facebook/react-native#37448).
      initialNumToRender={data.length}
      maxToRenderPerBatch={data.length}
      windowSize={data.length}
      removeClippedSubviews={false}
      onMomentumScrollEnd={settle}
      // A slow drag can stop without ever starting momentum, so the value is
      // read here too. Reading only — see `readValue`.
      onScrollEndDrag={readValue}
      renderItem={({ item, index: i }) => {
        const selected = item === value;
        return (
          <Pressable
            // Tapping the SELECTED value opens the keyboard on it. Tapping any
            // other value scrolls it into the band rather than selecting in
            // place, so the band always shows the truth.
            onPress={() => {
              if (selected && editable) onStartEdit?.();
              else listRef.current?.scrollToOffset({ offset: i * rowHeight });
            }}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityHint={selected && editable ? editHint : undefined}
            style={{ height: rowHeight, alignItems: "center", justifyContent: "center" }}
          >
            {/* No outline on the row itself. The affordance lives on the BAND,
                which is fixed — drawn per-row it travelled with the value as
                you scrolled, so the "tap me" box slid around the screen. */}
            <Text
              variant={selected ? "heading" : "body"}
              style={{ color: selected ? c.textPrimary : c.textSecondary }}
            >
              {item}
            </Text>
          </Pressable>
        );
      }}
    />
  );
};

Column.propTypes = {
  data: PropTypes.arrayOf(PropTypes.string).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  rowHeight: PropTypes.number.isRequired,

  /** Whether tapping the selected value opens a keyboard (not for AM/PM). */
  editable: PropTypes.bool,
  onStartEdit: PropTypes.func,
  editHint: PropTypes.string,
  testID: PropTypes.string,
};

/** One numeric field in the typed layout. */
const TypedField = ({
  value,
  kind,
  onCommit,
  rowHeight,
  autoFocus = false,
  label = undefined,
  testID = undefined,
}) => {
  const { c, radii, layout, type } = useTokens();
  // What the field SHOWS while you are typing. Kept separate from the committed
  // value so a half-typed "1" is not clamped to "01" under the caret, which
  // makes the field impossible to type into.
  const [draft, setDraft] = useState(value);

  // Commit on every keystroke, not only on blur. Tapping OK does not reliably
  // blur the field first on Android, so a value typed and confirmed straight
  // away would otherwise be dropped. The DISPLAY still follows `draft`, so
  // typing feels normal while the parent always holds something valid.
  const handleType = (t) => {
    const digits = t.replace(/[^0-9]/g, "").slice(0, 2);
    setDraft(digits);
    const clamped = clampTyped(digits, kind);
    if (clamped !== "") onCommit(clamped);
  };

  // Normalise what is shown once focus leaves ("7" -> "07" for minutes). This
  // must NOT leave typing mode: blur fires when you tap the other field, and
  // exiting here is what kicked you back to the wheel on every tap.
  const finish = () => {
    const clamped = clampTyped(draft, kind);
    const next = clamped === "" ? value : clamped;
    setDraft(next);
    onCommit(next);
  };

  return (
    <TextInput
      testID={testID}
      value={draft}
      onChangeText={handleType}
      onBlur={finish}
      onSubmitEditing={finish}
      keyboardType="number-pad"
      returnKeyType="done"
      maxLength={2}
      autoFocus={autoFocus}
      selectTextOnFocus
      accessibilityLabel={label}
      allowFontScaling
      maxFontSizeMultiplier={1.5}
      style={{
        ...type.heading,
        color: c.textPrimary,
        backgroundColor: c.surfaceSelected,
        borderRadius: radii.md,
        borderWidth: layout.borderWidth.hairline,
        borderColor: autoFocus ? c.controlAccent : c.border,
        minHeight: rowHeight,
        minWidth: rowHeight * 1.4,
        textAlign: "center",
        // Android centres a TextInput's text vertically only when told to; iOS
        // ignores this key.
        textAlignVertical: "center",
        padding: 0,
      }}
    />
  );
};

TypedField.propTypes = {
  value: PropTypes.string.isRequired,
  kind: PropTypes.oneOf(["hour", "minute"]).isRequired,
  onCommit: PropTypes.func.isRequired,
  rowHeight: PropTypes.number.isRequired,
  autoFocus: PropTypes.bool,
  label: PropTypes.string,
  testID: PropTypes.string,
};

const TimePickerSheet = ({
  visible,
  value = undefined,
  title,
  onConfirm,
  onClose,
  confirmLabel,
  cancelLabel,
  hourLabel,
  minuteLabel,
  editHint,
}) => {
  const { c, space, layout, radii } = useTokens();
  const initial = useMemo(() => parse(value), [value]);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [meridiem, setMeridiem] = useState(initial.meridiem);
  /**
   * null = wheels. "hour"/"minute" = typed layout, naming which field the
   * keyboard opened on.
   *
   * Once set it STAYS set for the life of the sheet. It used to clear on any
   * field blur, so tapping from the hour box to the minute box dropped you
   * back to the wheels mid-entry. Reopening the sheet starts on the wheels
   * again, which is the reset.
   */
  const [editing, setEditing] = useState(null);

  // Re-seed whenever a different reminder is opened.
  useEffect(() => {
    setHour(initial.hour);
    setMinute(initial.minute);
    setMeridiem(initial.meridiem);
    setEditing(null);
  }, [initial]);

  const rowHeight = layout.row.minHeight;

  // AM/PM as a segmented control in the typed layout — there is nothing to type
  // and a wheel would put the five-row height straight back.
  const meridiemToggle = (
    <View style={{ flexDirection: "row", gap: space.xs }}>
      {MERIDIEM.map((m) => {
        const on = m === meridiem;
        return (
          <Pressable
            key={m}
            onPress={() => setMeridiem(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              minHeight: rowHeight,
              justifyContent: "center",
              paddingHorizontal: space.md,
              borderRadius: radii.md,
              borderWidth: layout.borderWidth.hairline,
              borderColor: on ? c.controlAccent : c.border,
              backgroundColor: on ? c.controlAccent : "transparent",
            }}
          >
            <Text variant="label" style={{ color: on ? c.onControlAccent : c.textSecondary }}>
              {m}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Sheet visible={visible} onClose={onClose} title={title} scrollable={false}>
      {editing ? (
        // Wraps, so a long AM/PM label at a large text size drops to its own
        // line rather than squeezing the fields.
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: space.sm,
            paddingVertical: space.md,
          }}
        >
          <TypedField
            value={hour}
            kind="hour"
            rowHeight={rowHeight}
            autoFocus={editing === "hour"}
            onCommit={setHour}
            label={hourLabel}
            testID="tp-hour-input"
          />
          <Text variant="heading" color="textSecondary">
            :
          </Text>
          <TypedField
            value={minute}
            kind="minute"
            rowHeight={rowHeight}
            autoFocus={editing === "minute"}
            onCommit={setMinute}
            label={minuteLabel}
            testID="tp-minute-input"
          />
          {meridiemToggle}
        </View>
      ) : (
        <View style={{ height: rowHeight * VISIBLE_ROWS }}>
          {/* The fixed band. Behind the columns and non-interactive, so it never
              swallows a scroll. It carries the outline as well as the fill: it
              is the one thing on this control that does NOT move, so it is the
              only honest place to say "whatever is in here is the value, and
              tapping it lets you type". */}
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: rowHeight,
              top: rowHeight * PAD_ROWS,
              backgroundColor: c.surfaceSelected,
              borderRadius: radii.md,
              borderWidth: layout.borderWidth.hairline,
              borderColor: c.borderStrong,
            }}
          />
          <View style={{ flexDirection: "row", flex: 1 }}>
            <Column
              data={HOURS}
              value={hour}
              onChange={setHour}
              rowHeight={rowHeight}
              editable
              editHint={editHint}
              onStartEdit={() => setEditing("hour")}
              testID="tp-hour"
            />
            <Column
              data={MINUTES}
              value={minute}
              onChange={setMinute}
              rowHeight={rowHeight}
              editable
              editHint={editHint}
              onStartEdit={() => setEditing("minute")}
              testID="tp-minute"
            />
            {/* AM/PM has two values and nothing to type, so it stays a wheel. */}
            <Column
              data={MERIDIEM}
              value={meridiem}
              onChange={setMeridiem}
              rowHeight={rowHeight}
              testID="tp-meridiem"
            />
          </View>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "flex-end",
          gap: space.sm,
          paddingTop: space.md,
        }}
      >
        <Button
          title={cancelLabel}
          onPress={onClose}
          variant="ghost"
          style={{ flexGrow: 1, flexBasis: "auto" }}
        />
        <Button
          title={confirmLabel}
          onPress={() => onConfirm(`${hour}:${minute} ${meridiem}`)}
          style={{ flexGrow: 1, flexBasis: "auto" }}
          testID="tp-confirm"
        />
      </View>
    </Sheet>
  );
};

TimePickerSheet.propTypes = {
  visible: PropTypes.bool.isRequired,
  /** Current time as "h:mm A", e.g. "3:05 PM". */
  value: PropTypes.string,
  title: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  confirmLabel: PropTypes.string.isRequired,
  cancelLabel: PropTypes.string.isRequired,
  /** Localised. Primitives here never reach for STRINGS themselves — importing
   *  it into this layer drags the native localization module into every test
   *  that touches the ui barrel. */
  hourLabel: PropTypes.string.isRequired,
  minuteLabel: PropTypes.string.isRequired,
  /** Screen-reader hint on the selected value, e.g. "Double tap to type". */
  editHint: PropTypes.string.isRequired,
};

export default TimePickerSheet;
