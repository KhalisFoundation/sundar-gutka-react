import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { styles } from "../styles";
import { onPress } from "../utils";
import { colors } from "../../common";
import { getModalStyles } from "../styles/styles";

function BaniTransitionModal({ shabadID, navigation, setModalVisible }) {
  const [progress, setprogress] = useState(5);
  const [modalVisible, toggleModal] = useState(false);
  const baniList = useSelector((state) => state.baniList);
  const isNightMode = useSelector((state) => state.isNightMode);
  const { textStyle, backColor } = getModalStyles(isNightMode);
  const currentBaniIndex = baniList.findIndex((item) => item.id === shabadID);

  const nextBani = currentBaniIndex !== -1 ? baniList[currentBaniIndex + 1] : null;
  const { navigate } = navigation;

  useEffect(() => {
    let progressInterval; // Declare progressInterval in the outer scope for better control

    if (modalVisible) {
      progressInterval = setInterval(() => {
        setprogress((prevprogress) => {
          if (prevprogress <= 1) {
            clearInterval(progressInterval); // Ensure progressInterval is cleared when condition is met
            return prevprogress; // Return current value without decrement
          }
          return prevprogress - 1; // Decrease the progress value
        });
      }, 1000);
    } else {
      clearInterval(progressInterval); // Clear progressInterval when modal is not visible
    }

    return () => clearInterval(progressInterval);
  }, [modalVisible]);

  useEffect(() => {
    const showModalTimer = setTimeout(() => {
      toggleModal(true);
    }, 5000); // 5000 milliseconds equals 5 seconds

    return () => clearTimeout(showModalTimer);
  }, []);

  useEffect(() => {
    if (!modalVisible) {
      return () => {};
    }

    const timer = setTimeout(() => {
      onPress(nextBani, navigate);
      toggleModal(false);
      setModalVisible(false);
    }, 5000); // 5000 milliseconds equals 5 seconds

    return () => clearTimeout(timer);
  }, [modalVisible]);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={modalVisible}
      onRequestClose={() => {
        toggleModal(!modalVisible);
        setModalVisible(!modalVisible);
      }}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, backColor]}>
          <AnimatedCircularProgress
            size={50}
            width={5}
            fill={(progress - 1) * 25}
            tintColor={colors.READER_STATUS_BAR_COLOR}
            backgroundColor="#fff"
            rotation={0}
          >
            {() => (
              <Text style={[styles.points, textStyle]}>
                {progress} {/* Displays the percentage */}
              </Text>
            )}
          </AnimatedCircularProgress>
          <Text style={[styles.nextBaniText, textStyle]}>Next Bani</Text>
          <Text style={[styles.modalGurmukhiText, textStyle]}>{nextBani.gurmukhi}</Text>
          <Pressable
            onPress={() => {
              toggleModal(!modalVisible);
              setModalVisible(!modalVisible);
            }}
          >
            <Text style={[styles.modalStayText, textStyle]}>Stay on this bani</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
BaniTransitionModal.propTypes = {
  shabadID: PropTypes.number.isRequired,
  navigation: PropTypes.shape().isRequired,
  setModalVisible: PropTypes.func.isRequired,
};

export default BaniTransitionModal;
