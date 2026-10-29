import React, { useEffect, useCallback, useRef, useState } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Svg, { Circle, Path, Line } from "react-native-svg";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import PropTypes from "prop-types";
import useBaniLookup, { toTitleCase } from "@common/hooks/useBaniLookup";
import useReminderPermissionGate from "@common/hooks/useReminderPermissionGate";
import { SunriseIcon, SunsetIcon } from "@common/icons";
import { reminderTitle } from "@common/reminders/title";
import {
  CustomText,
  STRINGS,
  actions,
  ThemedSwitch,
  scheduleReminders,
  logError,
  trackDashboardEvent,
} from "@common";
import { getBaniList } from "@database";
import { ReminderEditSheet } from "../../Settings/components/reminders/ReminderOptions/components";
import useDashboardTheme from "./dashboardTheme";
import SectionLabel from "./SectionLabel";

// Same default reminder set as Settings (setDefaultReminders): Gur Mantar, Japji,
// Rehras, Sohila. Shown as suggestions while the list is empty — see below.
const DEFAULT_INDEXES = [0, 1, 19, 21];
const DEFAULT_TIMINGS = ["3:00 AM", "3:30 AM", "6:00 PM", "10:00 PM"];

// Classic sun: center disc + 8 short rays (morning / Amrit Vela).
const SunIcon = ({ color }) => (
  <Svg
    width={20}
    height={20}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx="12" cy="12" r="4" />
    <Line x1="12" y1="2" x2="12" y2="4" />
    <Line x1="12" y1="20" x2="12" y2="22" />
    <Line x1="2" y1="12" x2="4" y2="12" />
    <Line x1="20" y1="12" x2="22" y2="12" />
    <Line x1="4.9" y1="4.9" x2="6.3" y2="6.3" />
    <Line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
    <Line x1="4.9" y1="19.1" x2="6.3" y2="17.7" />
    <Line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
  </Svg>
);
SunIcon.propTypes = { color: PropTypes.string.isRequired };

const MoonIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill={color} stroke="none">
    <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </Svg>
);
MoonIcon.propTypes = { color: PropTypes.string.isRequired };

// No outer ring — just the plus glyph (client asked for the circle removed).
const PlusCircle = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="8" x2="12" y2="16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="8" y1="12" x2="16" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
PlusCircle.propTypes = { color: PropTypes.string.isRequired };

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20 },
  card: { paddingVertical: 8, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  pressed: { opacity: 0.7 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: "600" },
  time: { fontSize: 12, marginTop: 2 },
  divider: { height: 1 },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  addText: { fontSize: 13, fontWeight: "600" },
});

const hourOf = (time) => moment(time, ["h:mm A", "H:mm"]).hour();

// Friendly label from the reminder time (e.g. 3–6 → Amrit Vela, 6–12 → Morning Nitnem).
const labelForTime = (time) => {
  const h = hourOf(time);
  if (Number.isNaN(h)) return STRINGS.MORNING_NITNEM;
  if (h >= 3 && h < 6) return STRINGS.AMRIT_VELA;
  if (h >= 6 && h < 12) return STRINGS.MORNING_NITNEM;
  if (h >= 12 && h < 16) return STRINGS.AFTERNOON_TIME;
  if (h >= 16 && h < 20) return STRINGS.EVENING_TIME;
  return STRINGS.NIGHT_TIME;
};

// Icon + tint per time-of-day kind (morning / evening / night), each with its
// own icon color and chip background so the three rows read distinctly.
const kindForTime = (time) => {
  const hour = hourOf(time);
  if (Number.isNaN(hour)) return "sun";
  if (hour >= 3 && hour < 6) return "sunrise"; // Amrit Vela
  if (hour >= 6 && hour < 16) return "sun"; // Morning / afternoon
  if (hour >= 16 && hour < 20) return "sunset"; // Evening
  return "night"; // Night (20:00–03:00)
};

// Sunrise/sunset are shared icons from common/icons; sun and moon are still
// local. All four are rendered at 20 to fit the tinted circle.
const ICON_FOR_KIND = { sunrise: SunriseIcon, sun: SunIcon, sunset: SunsetIcon, night: MoonIcon };

// `c` is the semantic role map, passed in because this is module scope.
const buildIconStyles = (p, accentBlue, mutedText, gold) => ({
  // Amrit Vela (dawn) shares the warm gold tint with the daytime sun.
  sunrise: { color: gold, bg: p.goldSurface },
  sun: { color: gold, bg: p.goldSurface },
  sunset: { color: accentBlue, bg: p.accentSurface },
  night: { color: mutedText, bg: p.neutralSurface },
});

const parse = (json) => {
  try {
    const parsed = json ? JSON.parse(json) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const RemindersCard = () => {
  const { accentBlue, gold, mutedText, separator, palette } = useDashboardTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { nameOf } = useBaniLookup();
  const iconStyles = buildIconStyles(palette, accentBlue, mutedText, gold);
  const titleColor = palette.cardTitle;
  const timeColor = palette.cardMeta;
  // Dark-mode reminder toggle: bright-blue ON track, navy OFF track + navy thumb.
  const offThumbColor = palette.switchOffThumb;
  // The ON thumb is white with a hairline. Without this it falls back to the
  // surface role, which on this navy card IS the card — a thumb you cannot see.
  const onThumbColor = palette.switchOnThumb;
  const thumbBorderColor = palette.switchThumbBorder;
  const onTrackColor = palette.switchOnTrack;
  const offTrackColor = palette.switchOffTrack;
  // "Add a reminder" matches the "Edit banis" link (light blue in dark, accent in light).
  const addColor = accentBlue;

  const isReminders = useSelector((state) => state.isReminders);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const reminderSound = useSelector((state) => state.reminderSound);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const isTransliteration = useSelector((state) => state.isTransliteration);

  const stored = parse(reminderBanis);

  // The default rows are SUGGESTIONS, shown while the list is empty and written
  // to the store only when one is switched on. They used to be written on
  // sight, as four disabled reminders, and that write is what the account sync
  // watches: a signed-in user who had deleted every reminder saw all four come
  // back here — and then on every other device — the next time the Dashboard
  // opened. Nothing is stored now until the user acts, so deleting the last
  // reminder stays deleted everywhere, and the section still shows the rows.
  const [placeholders, setPlaceholders] = useState([]);
  useEffect(() => {
    if (stored.length) return undefined;
    let active = true;
    getBaniList(transliterationLanguage)
      .then((list) => {
        if (!active) return;
        setPlaceholders(
          DEFAULT_INDEXES.map((idx, i) => {
            const b = list[idx];
            const item = {
              key: b.id,
              id: b.id,
              gurmukhi: b.gurmukhi,
              gurmukhiUni: b.gurmukhiUni,
              translit: toTitleCase(b.translit),
              enabled: false,
              time: DEFAULT_TIMINGS[i],
            };
            return { ...item, title: reminderTitle(item, isTransliteration) };
          })
        );
      })
      .catch(logError);
    return () => {
      active = false;
    };
  }, [stored.length, transliterationLanguage]);

  const reminders = stored.length ? stored : placeholders;

  // Tapping a row opens the same sheet a reminder row opens in Settings —
  // change the time, rename the notification, delete it. Only the key is held;
  // the sheet is handed the stored copy on every render, so a change it saves
  // shows at once.
  const [editingKey, setEditingKey] = useState(null);
  const editingSection = stored.find((item) => item.key === editingKey) ?? null;

  // A suggested row is not stored yet, and the sheet edits the stored list by
  // key, so the suggestions are written first: the same write the switch makes,
  // every row still off.
  const openEditor = useCallback(
    (key) => {
      if (!stored.length) dispatch(actions.setReminderBanis(JSON.stringify(placeholders)));
      trackDashboardEvent("reminder_edit_opened");
      setEditingKey(key);
    },
    [stored.length, placeholders, dispatch]
  );

  // Writes the toggle through and schedules. `remindersOn` is passed rather
  // than read, because the master switch may have been turned on in the same
  // tap and the store has not re-rendered this closure yet.
  const applyToggle = useCallback(
    async (key, value, remindersOn) => {
      const base = stored.length ? stored : placeholders;
      const idx = base.findIndex((item) => item.key === Number(key));
      if (idx === -1) return;
      const array = base.map((item, i) => (i === idx ? { ...item, enabled: value } : item));
      const json = JSON.stringify(array);
      dispatch(actions.setReminderBanis(json));
      await scheduleReminders(remindersOn, reminderSound, json, isTransliteration);
    },
    [stored, placeholders, reminderSound, dispatch]
  );

  // A tap that had to wait for a trip to system settings. Finished by the
  // gate's `onReturnGranted` when the user comes back with the permission.
  const pendingRef = useRef(null);
  const latestRef = useRef({ applyToggle });
  latestRef.current = { applyToggle };

  const { resolvePermissions } = useReminderPermissionGate({
    onReturnGranted: async () => {
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (!pending) return;
      dispatch(actions.toggleReminders(true));
      await latestRef.current.applyToggle(pending.key, pending.value, true);
    },
  });

  // Per-reminder toggle. Turning the FIRST reminder on also turns the reminder
  // system on, so the Dashboard works without a master switch — but only once
  // both permissions are there. It used to flip the master switch after the
  // notification check alone, exactly the fault Settings had already been
  // fixed for: a missing "Alarms & reminders" permission left everything
  // reading ON with nothing scheduled.
  const toggleItem = useCallback(
    async (key, value) => {
      try {
        if (value && !isReminders) {
          pendingRef.current = { key, value };
          if (!(await resolvePermissions(null, { prompt: true }))) return;
          pendingRef.current = null;
          dispatch(actions.toggleReminders(true));
          await applyToggle(key, value, true);
          return;
        }
        await applyToggle(key, value, isReminders);
      } catch (err) {
        logError(err);
      }
    },
    [isReminders, resolvePermissions, applyToggle, dispatch]
  );

  return (
    <View>
      {/* No colour override: Reminders is a section heading like Explore,
          Discover and Insights, and reads in the same colour as all of them.
          It used to take a quieter accent of its own, which made one heading in
          the stack look faded rather than deliberate. */}
      <SectionLabel title={STRINGS.REMINDERS_TITLE} />
      <View style={styles.wrap}>
        <View style={styles.card}>
          {reminders.map((r, i) => {
            const kind = kindForTime(r.time);
            const Icon = ICON_FOR_KIND[kind];
            const { color: iconColor, bg: iconBg } = iconStyles[kind];
            const name = nameOf(r.id) || r.translit;
            return (
              <View key={r.key}>
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => openEditor(r.key)}
                  accessibilityRole="button"
                  accessibilityLabel={`${name}, ${labelForTime(r.time)}, ${r.time}`}
                  accessibilityHint={STRINGS.EDIT}
                >
                  <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                    <Icon color={iconColor} size={20} />
                  </View>
                  <View style={styles.textBlock}>
                    {/* Two lines. A bani name is the row's subject — clipping it
                        to "ਰਹਰਾਸਿ ਸਾ…" loses which reminder this is. The row has
                        no fixed height, so it grows instead. */}
                    <CustomText style={[styles.title, { color: titleColor }]} numberOfLines={2}>
                      {name}
                    </CustomText>
                    <CustomText style={[styles.time, { color: timeColor }]} numberOfLines={2}>
                      {labelForTime(r.time)} · {r.time}
                    </CustomText>
                  </View>
                  <ThemedSwitch
                    value={isReminders && !!r.enabled}
                    onValueChange={(v) => toggleItem(r.key, v)}
                    offThumbColor={offThumbColor}
                    onThumbColor={onThumbColor}
                    thumbBorderColor={thumbBorderColor}
                    onTrackColor={onTrackColor}
                    offTrackColor={offTrackColor}
                  />
                </Pressable>
                {i < reminders.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: separator }]} />
                ) : null}
              </View>
            );
          })}

          {reminders.length ? (
            <View style={[styles.divider, { backgroundColor: separator }]} />
          ) : null}
          <Pressable
            style={styles.addRow}
            onPress={() => {
              trackDashboardEvent("reminders_opened", { count: reminders.length });
              navigation.navigate("ReminderOptions");
            }}
            hitSlop={6}
          >
            <PlusCircle color={addColor} />
            <CustomText style={[styles.addText, { color: addColor }]}>
              {STRINGS.ADD_REMINDER}
            </CustomText>
          </Pressable>
        </View>
      </View>
      <ReminderEditSheet
        section={editingSection}
        visible={editingSection !== null}
        onClose={() => setEditingKey(null)}
      />
    </View>
  );
};

export default RemindersCard;
