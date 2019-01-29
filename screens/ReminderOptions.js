import React from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  Image,
  View,
  Dimensions,
  Platform,
  FlatList,
  Picker,
  TouchableOpacity
} from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import { baseFontSize } from "../utils/helpers";
import { defaultBaniOrderArray } from "../utils/helpers";
import Collapsible from "react-native-collapsible";
import Accordion from "react-native-collapsible/Accordion";
import DateTimePicker from "react-native-modal-datetime-picker";
import ModalSelector from "react-native-modal-selector";
import Database from "../utils/database";
import ReminderPanel from "../components/ReminderPanel";

class ReminderOptions extends React.Component {
  componentDidMount() {
    // AnalyticsManager.getInstance().trackScreenView("Index Reorder");
  }

  componentWillMount() {
    if (!JSON.parse(this.props.reminderBanis)) {
      this._resetReminderDefaults();
    }
  }

  _resetReminderDefaults() {
    alert(JSON.stringify(this.props.reminderBanis));
    //this.props.setReminderBanis(JSON.stringify([]));
  }

  _addBaniReminder() {
    Database.getBaniList().then(baniList => {
      var baniOptions = [];
      let isRomanized = this.props.romanized;

      let existingKeys = JSON.parse(this.props.reminderBanis).map(function(
        bani
      ) {
        return bani.key;
      });

      Object.keys(baniList).forEach(function(key) {
        if (!existingKeys.includes(key)) {
          baniOptions.push({
            key: key,
            label: isRomanized ? baniList[key].roman : baniList[key].gurmukhi,
            gurmukhi: baniList[key].gurmukhi,
            roman: baniList[key].roman
          });
        }
      });
      this.setState(
        {
          reminderBaniData: baniOptions
        },
        function() {
          this.selector.open();
        }
      );
    });
  }

  _addReminder(baniObject) {
    var array = JSON.parse(this.props.reminderBanis);
    var curTimePickerSection = -1;

    array.push({
      key: baniObject.key,
      gurmukhi: baniObject.gurmukhi,
      roman: baniObject.roman,
      time: "123"
    });

    this.props.setReminderBanis(JSON.stringify(array));
    this._updateSections;
  }

  state = {
    activeSections: [],
    reminderBaniData: [],
    isTimePickerVisible: false,
    timePickerSectionKey: -1
  };

  _showTimePicker = () => this.setState({ isTimePickerVisible: true });

  _hideTimePicker = () => this.setState({ isTimePickerVisible: false });

  _handleTimePicked = time => {
    this._hideTimePicker();
    var array = JSON.parse(this.props.reminderBanis);
    array
      .filter(obj => {
        return obj.key == this.state.timePickerSectionKey;
      })
      .map(foundObj => {
        foundObj.time = time;
      });
    this.props.setReminderBanis(JSON.stringify(array));
  };

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        <Header
          outerContainerStyles={{ borderBottomWidth: 0 }}
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: "Reminder Options",
            style: { color: GLOBAL.COLOR.TOOLBAR_TINT, fontSize: 18 }
          }}
          rightComponent={
            <View style={{ flexDirection: "row" }}>
              <Icon
                name="refresh"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this._resetReminderDefaults()}
              />
              <Icon
                style={{ paddingLeft: 15 }}
                name="add"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this._addBaniReminder()}
              />
            </View>
          }
        />
        <ModalSelector
          data={this.state.reminderBaniData}
          ref={selector => {
            this.selector = selector;
          }}
          optionTextStyle={[
            styles.optionText,
            !this.props.romanized && { fontFamily: "GurbaniAkharHeavySG" }
          ]}
          customSelector={<View />}
          cancelText={"Cancel"}
          onChange={option => {
            this._addReminder(option);
          }}
        />
        <View
          style={[
            styles.container,
            this.props.nightMode && { backgroundColor: "#464646" }
          ]}
        >
          <Accordion
            activeSections={this.state.activeSections}
            sections={JSON.parse(this.props.reminderBanis)}
            renderHeader={this._renderHeader}
            renderContent={this._renderContent}
            onChange={this._updateSections}
          />
        </View>
      </View>
    );
  }

  _renderHeader = section => {
    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            this.setState({ timePickerSectionKey: section.key });
            this._showTimePicker();
          }}
        >
          <Text>{section.time}</Text>
        </TouchableOpacity>
        <DateTimePicker
          isVisible={this.state.isTimePickerVisible}
          onConfirm={time => this._handleTimePicked(time, section.key)}
          onCancel={this._hideTimePicker}
          titleIOS={"Pick a Time:"}
          mode={"time"}
        />
        <Text
          style={[
            styles.headerText,
            !this.props.romanized && { fontFamily: "GurbaniAkharHeavySG" }
          ]}
        >
          {this.props.romanized ? section.roman : section.gurmukhi}
        </Text>
      </View>
    );
  };

  _renderContent = section => {
    return (
      <View style={styles.content}>
        <Text>beepp</Text>
      </View>
    );
  };

  _updateSections = activeSections => {
    this.setState({ activeSections });
  };

  _renderRow = ({ data, active }) => {
    return (
      <ReminderPanel
        title="B Panel with short content text"
        data={data}
        active={active}
        nightMode={this.props.nightMode}
        romanized={this.props.romanized}
        fontFace={this.props.fontFace}
        fontSize={this.props.fontSize}
      />
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  headerText: {
    color: "#404"
  },
  optionText: {},
  separator: {
    height: 2
  },
  list: {
    flex: 1
  }
});

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    reminderBanis: state.reminderBanis,
    romanized: state.romanized,
    fontSize: state.fontSize,
    fontFace: state.fontFace
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReminderOptions);
