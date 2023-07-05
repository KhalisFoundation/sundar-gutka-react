import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { View, StatusBar } from "react-native";
import { Icon } from "@rneui/themed";
import Accordion from "react-native-collapsible/Accordion";
import PropTypes from "prop-types";
import colors from "../../../common/colors";
import constant from "../../../common/constant";
import { defaultReminders } from "./utils/helpers";
import { setReminderBanis } from "../../../common/actions";
import { getBaniList } from "../../../database/db";
import styles from "./styles";
import AccordianContent from "./components/AccordianContent";
import AccordianHeader from "./components/AccordianHeader";
import AddModal from "./modals/AddModal";

function ReminderOptions({ navigation }) {
  const { transliterationLanguage, reminderBanis, isNightMode } = useSelector((state) => state);
  const [stateData, setStateData] = useState([]);
  const [activeSections, setActiveSections] = useState([]);
  const [isAddModal, toggleAddModal] = useState(false);
  const [baniListData, setBaniList] = useState([]);
  const dispatch = useDispatch();

  const updateSections = (sections) => {
    setActiveSections(sections);
  };
  const setDefaultReminders = (baniList) => {
    const data = defaultReminders(baniList);
    dispatch(setReminderBanis(JSON.stringify(data)));
    setStateData(data);
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
            toggleAddModal(!isAddModal);
          }}
        />
      </>
    );
  };

  const hideAddModal = () => {
    toggleAddModal(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getBaniList(transliterationLanguage);
        setBaniList(data);
        if (JSON.parse(reminderBanis).length === 0) {
          setStateData(setDefaultReminders(data));
        } else {
          setStateData(JSON.parse(reminderBanis));
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
      {isAddModal && <AddModal baniList={baniListData} hideAddModal={hideAddModal} />}
    </View>
  );
}

ReminderOptions.propTypes = {
  navigation: PropTypes.shape().isRequired,
};
export default ReminderOptions;
