import React, { useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, StatusBar, ScrollView, SafeAreaView } from "react-native";
import Accordion from "react-native-collapsible/Accordion";
import PropTypes from "prop-types";
import ModalSelector from "react-native-modal-selector";
import moment from "moment";
import {
  colors,
  constant,
  STRINGS,
  actions,
  trackReminderEvent,
  updateReminders,
  logMessage,
} from "@common";
import { styles, accordianNightColor, optionContainer } from "./styles";
import { AccordianContent, AccordianHeader } from "./components";
import { useHeader, useFetchBani } from "./hooks";

const ReminderOptions = ({ navigation }) => {
  logMessage(constant.REMINDER_OPTIONS);
  const isNightMode = useSelector((state) => state.isNightMode);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const isTransliteration = useSelector((state) => state.isTransliteration);
  const parsedReminderBanis = useMemo(() => JSON.parse(reminderBanis), [reminderBanis]);
  const fontFamily = { fontFamily: !isTransliteration ? constant.GURBANI_AKHAR_TRUE : null };

  const [stateData, setStateData] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [reminderBaniData, setReminderBaniData] = useState([]);
  const [baniListData, setBaniListData] = useState([]);

  const dispatch = useDispatch();
  const selector = useRef(null);
  const { backgroundColor, color } = optionContainer(isNightMode);

  const accNightColor = useMemo(() => accordianNightColor(isNightMode), [isNightMode]);
  useFetchBani(setBaniListData, setReminderBaniData, setStateData, parsedReminderBanis);
  useHeader(baniListData, navigation, selector);

  const updateSections = (sections) => {
    setActiveSections(sections);
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
        translit: selectedOption.translit,
        enabled: true,
        title: `${STRINGS.time_for} ${selectedOption.translit}`,
        time: moment(new Date()).local().format("h:mm A"),
      };

      array.push(newObj);
    }

    dispatch(actions.setReminderBanis(JSON.stringify(array)));
    trackReminderEvent(constant.ADD_REMINDER, array);
    await updateReminders(isReminders, reminderSound, JSON.stringify(array));
  };

  return (
    <SafeAreaView
      style={[
        isNightMode && { backgroundColor: colors.INACTIVE_VIEW_COLOR_NIGHT_MODE },
        styles.flexView,
      ]}
    >
      <ScrollView>
        <View>
          <StatusBar backgroundColor={colors.TOOLBAR_COLOR_ALT2} barStyle="light-content" />
          {stateData.length > 0 && (
            <Accordion
              activeSections={activeSections}
              sections={stateData}
              underlayColor={accNightColor}
              renderHeader={(section, index, isActive) => (
                <AccordianHeader section={section} isActive={isActive} />
              )}
              renderContent={(section, index, isActive) => (
                <AccordianContent section={section} isActive={isActive} />
              )}
              onChange={updateSections}
            />
          )}
          <ModalSelector
            supportedOrientations={[
              "portrait",
              "portrait-upside-down",
              "landscape-left",
              "landscape-right",
            ]}
            data={reminderBaniData}
            cancelText={STRINGS.cancel}
            optionTextStyle={{ ...styles.modalSelectText, color, ...fontFamily }}
            onChange={(option) => {
              createReminder(option);
            }}
            customSelector={<View />}
            ref={selector}
            cancelTextStyle={{ color }}
            cancelStyle={{ backgroundColor }}
            optionContainerStyle={{ backgroundColor }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

ReminderOptions.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};
export default ReminderOptions;
