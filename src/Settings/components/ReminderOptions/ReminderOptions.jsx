import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, StatusBar } from "react-native";
import { Icon } from "@rneui/themed";
import Accordion from "react-native-collapsible/Accordion";
import PropTypes from "prop-types";
import ModalSelector from "react-native-modal-selector";
import moment from "moment";
import colors from "../../../common/colors";
import constant from "../../../common/constant";
import { defaultReminders } from "./utils/helpers";
import { setReminderBanis } from "../../../common/actions";
import { getBaniList } from "../../../database/db";
import styles from "./styles";
import AccordianContent from "./components/AccordianContent";
import AccordianHeader from "./components/AccordianHeader";
import STRINGS from "../../../common/localization";
import { updateReminders } from "../../../common/notifications";

function ReminderOptions({ navigation }) {
  const {
    transliterationLanguage,
    reminderBanis,
    isNightMode,
    isTransliteration,
    isReminders,
    reminderSound,
  } = useSelector((state) => state);
  const [stateData, setStateData] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [reminderBaniData, setReminderBaniData] = useState([]);
  const dispatch = useDispatch();
  const selector = useRef(null);
  const parsedReminderBanis = useMemo(() => JSON.parse(reminderBanis), [reminderBanis]);

  const updateSections = (sections) => {
    setActiveSections(sections);
  };
  const setDefaultReminders = async (baniList) => {
    const data = defaultReminders(baniList);
    dispatch(setReminderBanis(JSON.stringify(data)));
    setStateData(data);
    await updateReminders(isReminders, reminderSound, JSON.stringify(data));
    return data;
  };

  const headerLeft = () => (
    <Icon
      name="arrow-back"
      size={30}
      onPress={() => navigation.goBack()}
      color={colors.WHITE_COLOR}
    />
  );
  const headerRight = (data) => {
    return (
      <>
        <Icon
          name="refresh"
          color={colors.TOOLBAR_TINT}
          style={{ marginRight: 10 }}
          size={30}
          onPress={() => {
            setDefaultReminders(data);
          }}
        />
        <Icon
          name="add"
          color={colors.TOOLBAR_TINT}
          size={30}
          onPress={() => {
            selector.current.open();
          }}
        />
      </>
    );
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getBaniList(transliterationLanguage);
        const existingKeysSet = new Set(parsedReminderBanis.map((bani) => bani.key));
        const baniOptions = Object.entries(data)
          .filter(([key]) => !existingKeysSet.has(Number(key)) && key < 100000)
          .map(([key, bani]) => ({
            key,
            label: isTransliteration ? bani.translit : bani.gurmukhi,
            gurmukhi: bani.gurmukhi,
            translit: bani.translit,
          }));
        setReminderBaniData(baniOptions);
        if (parsedReminderBanis.length === 0) {
          setStateData(setDefaultReminders(data));
        } else {
          setStateData(parsedReminderBanis);
        }
        navigation.setOptions({
          title: constant.REMINDER_OPTIONS,
          headerTitleStyle: {
            color: colors.WHITE_COLOR,
            fontWeight: "normal",
            fontSize: 18,
          },
          headerStyle: {
            backgroundColor: colors.TOOLBAR_COLOR_ALT2,
          },
          headerLeft,
          headerRight: () => headerRight(data),
        });
      } catch (error) {
        console.log("Error: Fetching the data: ", error);
      }
    })();
  }, [transliterationLanguage, reminderBanis]);

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
      <Accordion
        activeSections={activeSections}
        sections={stateData}
        renderHeader={(section, index, isActive) => (
          <AccordianHeader section={section} isActive={isActive} />
        )}
        renderContent={(section, index, isActive) => (
          <AccordianContent section={section} isActive={isActive} />
        )}
        onChange={updateSections}
      />
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
