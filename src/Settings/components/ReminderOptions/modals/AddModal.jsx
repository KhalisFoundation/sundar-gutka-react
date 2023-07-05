import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalSelector from "react-native-modal-selector";
import moment from "moment";
import PropTypes from "prop-types";
import STRINGS from "../../../../common/localization";
import styles from "../styles";
import { setReminderBanis } from "../../../../common/actions";

function AddModal({ baniList }) {
  const { reminderBanis, isTransliteration } = useSelector((state) => state);
  const [reminderBaniData, setReminderBaniData] = useState([]);
  const dispatch = useDispatch();

  const createReminder = (selectedOption) => {
    const array = JSON.parse(reminderBanis);
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
  };

  useEffect(() => {
    const existingKeysSet = new Set(JSON.parse(reminderBanis).map((bani) => bani.key));
    const baniOptions = Object.entries(baniList)
      .filter(([key]) => !existingKeysSet.has(Number(key)) && key < 100000)
      .map(([key, bani]) => ({
        key,
        label: isTransliteration ? bani.translit : bani.gurmukhi,
        gurmukhi: bani.gurmukhi,
        translit: bani.translit,
      }));
    setReminderBaniData(baniOptions);
  }, []);

  return (
    <ModalSelector
      data={reminderBaniData}
      cancelText={STRINGS.cancel}
      optionTextStyle={styles.modalSelecText}
      onChange={(option) => {
        createReminder(option);
      }}
    />
  );
}
AddModal.propTypes = { baniList: PropTypes.arrayOf(PropTypes.shape).isRequired };
export default AddModal;
