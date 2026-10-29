import React, { useCallback, useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import PropTypes from "prop-types";
import useThemedStyles from "@common/hooks/useThemedStyles";
import useTokens from "@common/hooks/useTokens";
import { reminderTitle } from "@common/reminders/title";
import { glyphsForSurface, useNavBarSurface } from "@common/systemBars";
import {
  constant,
  convertToUnicode,
  STRINGS,
  actions,
  trackReminderEvent,
  scheduleReminders,
  logMessage,
  StatusBarComponent,
} from "@common";
import { Row, Sheet } from "../../../../common/components/ui";
import { Header, ReminderEditSheet, ReminderRow } from "./components";
import useFetchBani from "./hooks/useFetchBani";
import createStyles from "./styles";
import { liveSection } from "./utils";

const ReminderOptions = ({ navigation }) => {
  logMessage(constant.REMINDER_OPTIONS);
  const { c, layout } = useTokens();
  const styles = useThemedStyles(createStyles);
  // This screen runs to the bottom of the display under the system navigation
  // bar, but it is not built on the app's SafeArea — the thing that tells the
  // bar what it is drawn over. Saying nothing left the claim to the tab bar
  // still mounted beneath it, which is navy, so the glyphs came out white over
  // this white list. Claimed here exactly as SafeArea would, from the same
  // background the screen paints.
  useNavBarSurface(glyphsForSurface(c.background));
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const parsedReminderBanis = useMemo(() => JSON.parse(reminderBanis), [reminderBanis]);
  // Baloo Paaji throughout the add-a-bani list. Baloo cannot draw the
  // ASCII-encoded GurbaniAkhar that `label` carries when transliteration is off
  // — it would come out as Latin gibberish — so the name is converted to real
  // Unicode Gurmukhi first, exactly as the home bani list does.
  const pickerFont = { fontFamily: constant.BALOO_PAAJI };
  const pickerLabel = (option) =>
    isTransliteration ? option.label : convertToUnicode(option.gurmukhi);

  const [stateData, setStateData] = useState([]);
  const [editing, setEditing] = useState(null);
  const [reminderBaniData, setReminderBaniData] = useState([]);
  const [baniListData, setBaniListData] = useState([]);

  const dispatch = useDispatch();
  const [isPickerOpen, setPickerOpen] = useState(false);
  useFetchBani(setBaniListData, setReminderBaniData, setStateData, parsedReminderBanis);
  // `editing` only remembers WHICH reminder was tapped; what the sheet shows is
  // re-read from the store on every change, so an edit made from the sheet is
  // visible the moment it is saved. See liveSection.
  const editingSection = useMemo(
    () => liveSection(parsedReminderBanis, stateData, editing),
    [parsedReminderBanis, stateData, editing]
  );

  const Separator = useCallback(
    () => (
      <View
        style={{
          height: layout.borderWidth.hairline,
          backgroundColor: c.border,
          marginHorizontal: layout.screenGutter,
        }}
      />
    ),
    [c, layout]
  );

  // Toggling from the list writes straight through — no need to open the sheet
  // just to switch a reminder off.
  const handleToggle = async (value, keyItem) => {
    const array = JSON.parse(reminderBanis);
    const targetIndex = array.findIndex((item) => item.key === Number(keyItem));
    if (targetIndex === -1) return;
    array[targetIndex] = { ...array[targetIndex], enabled: value };
    dispatch(actions.setReminderBanis(JSON.stringify(array)));
    await scheduleReminders(isReminders, reminderSound, JSON.stringify(array), isTransliteration);
  };

  const createReminder = async (selectedOption) => {
    const array = parsedReminderBanis;
    const newObjKey = Number(selectedOption.key);
    const existingObjIndex = array.findIndex((item) => item.key === newObjKey);

    if (existingObjIndex === -1) {
      const newObj = {
        key: newObjKey,
        id: selectedOption.id,
        gurmukhi: selectedOption.gurmukhi,
        gurmukhiUni: selectedOption.gurmukhiUni,
        translit: selectedOption.translit,
        enabled: true,
        time: moment(new Date()).local().format("h:mm A"),
      };
      newObj.title = reminderTitle(newObj, isTransliteration);

      array.push(newObj);
    }

    dispatch(actions.setReminderBanis(JSON.stringify(array)));
    trackReminderEvent(constant.ADD_REMINDER, array);
    await scheduleReminders(isReminders, reminderSound, JSON.stringify(array), isTransliteration);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.flexView} edges={["left", "right"]}>
        <Header
          baniListData={baniListData}
          navigation={navigation}
          onAdd={() => setPickerOpen(true)}
        />
        <StatusBarComponent backgroundColor={c.background} />
        {/* A flat list, not an accordion. Every reminder keeps the same height
            whatever you are doing, and its actions live in a sheet instead of
            expanding the row and shifting everything below it. */}
        <FlatList
          data={stateData}
          keyExtractor={(item) => String(item.key)}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={{ paddingBottom: layout.screenPaddingBottom }}
          renderItem={({ item }) => (
            <ReminderRow
              section={item}
              onPress={() => setEditing(item)}
              onToggle={(value) => handleToggle(value, item.key)}
            />
          )}
        />

        {/* Tapping a reminder opens everything you can do to it — change the
            time, rename the notification, delete it — instead of expanding the
            row in place. */}
        <ReminderEditSheet
          section={editingSection}
          visible={editingSection !== null}
          onClose={() => setEditing(null)}
        />

        {/* The "add a bani" picker. Was `react-native-modal-selector`, which
            brought its own modal chrome and had to be styled piecemeal to look
            even close to the app. It is the shared Sheet now, so it matches
            every other chooser in Settings.

            `titleStyle` carries the Gurbani face: with transliteration off the
            label is ASCII-encoded GurbaniAkhar, which renders as gibberish
            Latin in any other font. */}
        <Sheet
          visible={isPickerOpen}
          onClose={() => setPickerOpen(false)}
          title={STRINGS.ADD_BANI}
          closeAccessibilityLabel={STRINGS.cancel}
        >
          {reminderBaniData.map((option) => (
            <Row
              key={String(option.key)}
              title={pickerLabel(option)}
              titleStyle={pickerFont}
              showDivider
              onPress={() => {
                setPickerOpen(false);
                createReminder(option);
              }}
            />
          ))}
        </Sheet>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

ReminderOptions.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};
export default ReminderOptions;
