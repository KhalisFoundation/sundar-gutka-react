import React, { useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, StatusBar } from "react-native";
import Accordion from "react-native-collapsible/Accordion";
import PropTypes from "prop-types";
import ModalSelector from "react-native-modal-selector";
import moment from "moment";
import { colors, constant, STRINGS } from "../../../../common";
import { setReminderBanis } from "../../../../common/actions";
import { styles, accordianNightColor } from "./styles";
import { AccordianContent, AccordianHeader } from "./components";
import { updateReminders } from "../../../../common/notifications";
import { trackReminderEvent } from "../../../../common/analytics";
import useHeader from "./hooks/useHeader";
import useFetchBani from "./hooks/useFetchBani";
import useDefaultReminders from "./hooks/useDefaultReminders";

function ReminderOptions({ navigation }) {
  const isNightMode = useSelector((state) => state.isNightMode);
  const reminderBanis = useSelector((state) => state.reminderBanis);
  const isReminders = useSelector((state) => state.isReminders);
  const reminderSound = useSelector((state) => state.reminderSound);
  const parsedReminderBanis = useMemo(() => JSON.parse(reminderBanis), [reminderBanis]);
  const [stateData, setStateData] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [reminderBaniData, setReminderBaniData] = useState([]);
  const [baniListData, setBaniListData] = useState([]);
  const dispatch = useDispatch();
  const selector = useRef(null);

  const accNightColor = useMemo(() => accordianNightColor(isNightMode), [isNightMode]);
  const setDefaultReminders = useDefaultReminders(setStateData);
  useFetchBani(
    setBaniListData,
    setReminderBaniData,
    setStateData,
    parsedReminderBanis,
    setDefaultReminders
  );
  useHeader(baniListData, navigation, selector, setStateData, setDefaultReminders);

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
        gurmukhi: selectedOption.gurmukhi,
        translit: selectedOption.translit,
        enabled: true,
        title: `${STRINGS.time_for} ${selectedOption.translit}`,
        time: moment(new Date()).local().format("h:mm A"),
      };

      array.push(newObj);
    }

    dispatch(setReminderBanis(JSON.stringify(array)));
    trackReminderEvent(constant.ADD_REMINDER, array);
    await updateReminders(isReminders, reminderSound, JSON.stringify(array));
  };

  return (
    <View
      style={[
        isNightMode && { backgroundColor: colors.INACTIVE_VIEW_COLOR_NIGHT_MODE },
        styles.flexView,
      ]}
    >
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
        data={reminderBaniData}
        cancelText={STRINGS.cancel}
        optionTextStyle={styles.modalSelecText}
        onChange={(option) => {
          createReminder(option);
        }}
        customSelector={<View />}
        ref={selector}
      />
    </View>
  );
}

ReminderOptions.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};
export default ReminderOptions;
