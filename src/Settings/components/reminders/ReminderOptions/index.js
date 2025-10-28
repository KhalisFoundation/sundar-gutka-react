import React, { useState, useRef, useMemo } from "react";
import { View, ScrollView } from "react-native";
import ModalSelector from "react-native-modal-selector";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";
import PropTypes from "prop-types";
import Accordion from "react-native-collapsible/Accordion";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import {
  constant,
  STRINGS,
  actions,
  trackReminderEvent,
  updateReminders,
  logMessage,
  StatusBarComponent,
} from "@common";
import { AccordianContent, AccordianHeader } from "./components";
import { useHeader, useFetchBani } from "./hooks";
import createStyles from "./styles";

const ReminderOptions = ({ navigation }) => {
  logMessage(constant.REMINDER_OPTIONS);
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
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
    <SafeAreaProvider>
      <SafeAreaView style={styles.flexView}>
        <ScrollView>
          <View>
            <StatusBarComponent backgroundColor={theme.colors.primaryVariant} />
            {stateData.length > 0 && (
              <Accordion
                activeSections={activeSections}
                sections={stateData}
                underlayColor={theme.colors.surface}
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
              optionTextStyle={{
                ...styles.modalSelectText,
                color: theme.colors.primaryText,
                ...fontFamily,
              }}
              onChange={(option) => {
                createReminder(option);
              }}
              customSelector={<View />}
              ref={selector}
              cancelTextStyle={{ color: theme.colors.primaryText }}
              cancelStyle={{ backgroundColor: theme.colors.surfaceGrey }}
              optionContainerStyle={{ backgroundColor: theme.colors.surfaceGrey }}
            />
          </View>
        </ScrollView>
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
