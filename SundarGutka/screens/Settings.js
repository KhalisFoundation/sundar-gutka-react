import React from "react";
import { StyleSheet, View, Image } from "react-native";
import SettingsList from "react-native-settings-list";
import { ActionSheetCustom as ActionSheet } from "react-native-actionsheet";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions/actions";

class Settings extends React.Component {
  render() {
    const { navigate } = this.props.navigation;
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
            titleInfo={
              actions.fontSizeNames[
                actions.FONT_SIZES.indexOf(this.props.fontSize)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontSizeActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.FontSizeActionSheet = o)}
            title={"Font Size"}
            options={actions.fontSizeNames}
            cancelButtonIndex={actions.FONT_SIZES.length}
            styles={actionSheetStyles}
            onPress={index => {
              if (index !== actions.FONT_SIZES.length) {
                this.props.setFontSize(actions.FONT_SIZES[index]);
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
            titleInfo={
              actions.fontFaceNames[
                actions.FONT_FACES.indexOf(this.props.fontFace)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontFaceActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.FontFaceActionSheet = o)}
            title={"Font Face"}
            options={actions.fontFaceNames}
            cancelButtonIndex={actions.FONT_FACES.length}
            styles={actionSheetStyles}
            onPress={index => {
              if (index !== actions.FONT_FACES.length) {
                this.props.setFontFace(actions.FONT_FACES[index]);
              }
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
            switchState={this.props.romanized}
            switchOnValueChange={this.props.toggleRomanized}
            hasNavArrow={false}
            title="Romanized"
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/englishicon.png")}
              />
            }
            hasSwitch={true}
            switchState={this.props.englishTranslations}
            switchOnValueChange={this.props.toggleEnglishTranslations}
            hasNavArrow={false}
            title="English Translations"
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
            switchState={this.props.screenAwake}
            switchOnValueChange={this.props.toggleScreenAwake}
            hasNavArrow={false}
            title="Keep Screen Awake"
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
            onPress={() => navigate("EditBaniOrder")}
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/banilengthicon.png")}
              />
            }
            title="Bani Length"
            titleInfo={
              actions.baniLengthNames[
                actions.BANI_LENGTHS.indexOf(this.props.baniLength)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.BaniLengthActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.BaniLengthActionSheet = o)}
            title={"Bani Length"}
            options={actions.baniLengthNames}
            cancelButtonIndex={actions.BANI_LENGTHS.length}
            styles={actionSheetStyles}
            onPress={index => {
              if (index !== actions.BANI_LENGTHS.length) {
                this.props.setBaniLength(actions.BANI_LENGTHS[index]);
              }
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
            switchState={this.props.larivaar}
            switchOnValueChange={this.props.toggleLarivaar}
            hasNavArrow={false}
            title="Larivaar"
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/manglacharanicon.png")}
              />
            }
            title="Manglacharan Position"
            titleInfo={
              actions.manglacharanPositionNames[
                actions.MANGLACHARAN_POSITIONS.indexOf(
                  this.props.manglacharanPosition
                )
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.ManglacharanPositionActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.ManglacharanPositionActionSheet = o)}
            title={"Manglacharan Position"}
            options={actions.manglacharanPositionNames}
            cancelButtonIndex={actions.MANGLACHARAN_POSITIONS.length}
            styles={actionSheetStyles}
            onPress={index => {
              if (index !== actions.MANGLACHARAN_POSITIONS.length) {
                this.props.setManglacharanPosition(actions.MANGLACHARAN_POSITIONS[index]);
              }
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
            titleInfo={
              actions.padchhedSettingNames[
                actions.PADCHHED_SETTINGS.indexOf(this.props.padchhedSetting)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.PadchhedSettingsActionSheet.show()}
          />
          <ActionSheet
            ref={o => (this.PadchhedSettingsActionSheet = o)}
            title={"Padchhed Settings"}
            options={actions.padchhedSettingNames}
            cancelButtonIndex={actions.PADCHHED_SETTINGS.length}
            styles={actionSheetStyles}
            onPress={index => {
              if (index !== actions.PADCHHED_SETTINGS.length) {
                this.props.setPadchhedSetting(actions.PADCHHED_SETTINGS[index]);
              }
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
            switchState={this.props.statistics}
            switchOnValueChange={this.props.toggleStatistics}
            hasNavArrow={false}
            title="Collect Statistics"
          />
          <SettingsList.Item
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/abouticon.png")}
              />
            }
            title="About"
            onPress={() => navigate("About")}
          />
        </SettingsList>
      </View>
    );
  }
}

function mapStateToProps(state) {
  return {
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    romanized: state.romanized,
    englishTranslations: state.englishTranslations,
    nightMode: state.nightMode,
    screenAwake: state.screenAwake,
    baniLength: state.baniLength,
    larivaar: state.larivaar,
    manglacharanPosition: state.manglacharanPosition,
    padchhedSetting: state.padchhedSetting,
    statistics: state.statistics
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

const actionSheetStyles = {
  titleText: {
    fontSize: 18
  }
};

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
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
