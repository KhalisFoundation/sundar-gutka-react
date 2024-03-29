import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { StyleSheet, Modal, Text, View, ScrollView, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/Entypo";
import PropTypes from "prop-types";
import { baniLengthInfo } from "../utils/helpers";
import * as actions from "../actions/actions";
import GLOBAL from "../utils/globals";
import Strings from "../utils/localization";

class BaniLengthSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modalVisible: true,
    };
  }

  setModalVisible(visible) {
    this.setState({ modalVisible: visible });
  }

  updateBaniLength(length) {
    const { setBaniLength } = this.props;
    setBaniLength(length);
    this.setModalVisible(false);
  }

  render() {
    const styles = StyleSheet.create({
      button: {
        backgroundColor: "#fff",
        color: GLOBAL.COLOR.TOOLBAR_COLOR,
        padding: 15,
        marginTop: 15,
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        textTransform: "uppercase",
      },
    });
    const { modalVisible } = this.state;
    const { TOOLBAR_COLOR, TOOLBAR_COLOR_ALT } = GLOBAL.COLOR;
    return (
      <Modal animationType="fade" visible={modalVisible} onRequestClose={() => null}>
        <ScrollView
          style={{
            flex: 1,
            backgroundColor: TOOLBAR_COLOR,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: TOOLBAR_COLOR,
              padding: 15,
              paddingTop: 40,
            }}
          >
            <Text
              style={[
                {
                  color: GLOBAL.COLOR.TOOLBAR_TINT,
                  fontFamily: "GurbaniAkharThickTrue",
                  textAlign: "center",
                  fontSize: 52,
                },
              ]}
            >
              {Strings.khalsa_sundar_gutka}
            </Text>

            <Text
              style={[
                {
                  color: GLOBAL.COLOR.TOOLBAR_TINT,
                  fontSize: 14,
                },
              ]}
            >
              {"\n"}
              {Strings.bani_length_message_1}
              {"\n"}
              {"\n"}
              {Strings.bani_length_message_2}
            </Text>
            <Text
              style={[
                {
                  color: TOOLBAR_COLOR_ALT,
                  fontWeight: "bold",
                  fontSize: 18,
                },
              ]}
            >
              {"\n"}
              {Strings.choose_your_preference}:
            </Text>

            <TouchableOpacity onPress={() => this.updateBaniLength(actions.BANI_LENGTHS[0])}>
              <Text style={styles.button}>{Strings.short}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.updateBaniLength(actions.BANI_LENGTHS[1])}>
              <Text style={styles.button}>{Strings.medium}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.updateBaniLength(actions.BANI_LENGTHS[2])}>
              <Text style={styles.button}>{Strings.long}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => this.updateBaniLength(actions.BANI_LENGTHS[3])}>
              <Text style={styles.button}>{Strings.extra_long}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                marginTop: 15,
              }}
              onPress={() => baniLengthInfo()}
            >
              <Icon color={GLOBAL.COLOR.TOOLBAR_COLOR_ALT} name="info-with-circle" size={30} />
              <Text
                style={[
                  {
                    color: GLOBAL.COLOR.TOOLBAR_COLOR_ALT,
                    fontWeight: "bold",
                    fontStyle: "italic",
                    fontSize: 12,
                  },
                ]}
              >
                {"  "}
                {Strings.need_help_deciding}
                <Text
                  style={[
                    {
                      color: GLOBAL.COLOR.TOOLBAR_TINT,
                      fontWeight: "normal",
                      fontSize: 12,
                    },
                  ]}
                >
                  {" "}
                  {Strings.click_more_info}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>
    );
  }
}
BaniLengthSelector.propTypes = {
  setBaniLength: PropTypes.func.isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(null, mapDispatchToProps)(BaniLengthSelector);
