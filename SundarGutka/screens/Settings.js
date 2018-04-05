import React from "react";
import { StyleSheet, Text, View, Image } from "react-native";
import { Header } from "react-native-elements";
import SettingsList from "react-native-settings-list";
import { ActionSheetCustom as ActionSheet } from "react-native-actionsheet";
import { toggleNightMode } from "../actions/actions";
import { connect } from 'react-redux';

class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.onValueChange = this.onValueChange.bind(this);
    this.state = { switchValue: false };
  }
  render() {
    var bgColor = "#DCE3F4";
    return (
      <View style={{ backgroundColor: "#EFEFF4", flex: 1 }}>
        <SettingsList borderColor="#c8c7cc" defaultItemSize={50}>
          <SettingsList.Header
            headerText="Display Options"
            headerStyle={{ marginTop: 15 }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/fontsizeicon.png")}
              />
            }
            title="Font Size"
            titleInfo="Medium"
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontSizeActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.FontSizeActionSheet = o)}
            title={"Font Size"}
            options={[
              "Extra Small",
              "Small (default)",
              "Medium",
              "Large",
              "Extra Large",
              "Cancel"
            ]}
            cancelButtonIndex={5}
            styles={actionSheetStyles}
            onPress={index => {
              if (index !== 5) {
                // alert(index);
              }
            }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/fontfaceicon.png")}
              />
            }
            title="Font Face"
            titleInfo="Gurbani Akhar"
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontFaceActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.FontFaceActionSheet = o)}
            title={"Font Face"}
            options={[
              "Anmol Lipi",
              "Gurbani Akhar",
              "Gurbani Akhar Heavy",
              "Gurbani Akhar Thick",
              "Cancel"
            ]}
            cancelButtonIndex={4}
            styles={actionSheetStyles}
            onPress={index => {
              /* do something */
            }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/romanizeicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.state.switchValue}
            switchOnValueChange={this.onValueChange}
            hasNavArrow={false}
            title="Romanized"
            onPress={() => Alert.alert("Route to Blutooth Page")}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/englishicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.state.switchValue}
            switchOnValueChange={this.onValueChange}
            hasNavArrow={false}
            title="English Translations"
            onPress={() => Alert.alert("Route to Blutooth Page")}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/bgcoloricon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.props.nightMode}
            switchOnValueChange={this.props.toggleNightMode}
            hasNavArrow={false}
            title="Night Mode"
          />
          <SettingsList.Header
            headerText="Phone Options"
            headerStyle={{ marginTop: 15 }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/screenonicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.state.switchValue}
            switchOnValueChange={this.onValueChange}
            hasNavArrow={false}
            title="Keep Screen Awake"
            onPress={() => Alert.alert("Route to Blutooth Page")}
          />
          <SettingsList.Header
            headerText="Bani Options"
            headerStyle={{ marginTop: 15 }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/rearrangeicon.png")}
              />
            }
            title="Edit Bani Order"
            onPress={() => Alert.alert("Route to Wifi Page")}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/banilengthicon.png")}
              />
            }
            title="Bani Length"
            titleInfo="Long (default)"
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.BaniLengthActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.BaniLengthActionSheet = o)}
            title={"Bani Length"}
            options={["Long (default)", "Medium", "Short", "Cancel"]}
            cancelButtonIndex={3}
            styles={actionSheetStyles}
            onPress={index => {
              /* do something */
            }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/larivaaricon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.state.switchValue}
            switchOnValueChange={this.onValueChange}
            hasNavArrow={false}
            title="Larivaar"
            onPress={() => Alert.alert("Route to Blutooth Page")}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/manglacharanicon.png")}
              />
            }
            title="Manglacharan Position"
            titleInfo="Current Saroops (default)"
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.ManglacharanPositionActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.ManglacharanPositionActionSheet = o)}
            title={"Manglacharan Position"}
            options={[
              "Current Saroops (default)",
              "Above Raag Headings",
              "Cancel"
            ]}
            cancelButtonIndex={2}
            styles={actionSheetStyles}
            onPress={index => {
              /* do something */
            }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/larivaaricon.png")}
              />
            }
            title="Padchhed Settings"
            titleInfo="Sat Subham Sat (default)"
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.PadchhedSettingsActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.PadchhedSettingsActionSheet = o)}
            title={"Padchhed Settings"}
            options={["Sat Subham Sat (default)", "Mast Sabh Mast", "Cancel"]}
            cancelButtonIndex={2}
            styles={actionSheetStyles}
            onPress={index => {
              /* do something */
            }}
          />
          <SettingsList.Header
            headerText="Other Options"
            headerStyle={{ marginTop: 15 }}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/analyticsicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.state.switchValue}
            switchOnValueChange={this.onValueChange}
            hasNavArrow={false}
            title="Collect Statistics"
            onPress={() => Alert.alert("Route to Blutooth Page")}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/abouticon.png")}
              />
            }
            title="About"
            onPress={() => Alert.alert("Route to Wifi Page")}
          />
        </SettingsList>
      </View>
    );
  }
  onValueChange(value, what) {
    this.setState({ switchValue: value });
  }
}

const mapStateToProps = state => {
  return { nightMode: state.nightMode };
}

const mapDispatchToProps = dispatch => ({
  toggleNightMode: (value) => {dispatch(toggleNightMode(value))}
});

const actionSheetStyles = {
  titleText: {
    fontSize: 18
  }
}

const styles = StyleSheet.create({
  imageStyle: {
    marginLeft: 15,
    marginRight: 10,
    alignSelf: "center",
    width: 28,
    height: 28,
    justifyContent: "center"
  },
  titleInfoStyle: {
    marginLeft: 15
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
