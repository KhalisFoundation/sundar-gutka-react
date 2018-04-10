import React from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import SettingsList from "react-native-settings-list";
import Ionicons from "react-native-vector-icons/Ionicons";
import EvilIcons from "react-native-vector-icons/EvilIcons";
import {
  ActionSheet,
  ActionSheetItem
} from "react-native-action-sheet-component";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions/actions";

class Settings extends React.Component {
  render() {
    const { navigate } = this.props.navigation;

    const checkedIcon = <Ionicons name="ios-checkmark-outline" size={30} />;

    return (
      <View
        style={[
          styles.viewStyle,
          this.props.nightMode && { backgroundColor: "#000" }
        ]}
      >
        <SettingsList borderColor="#c8c7cc" defaultItemSize={50}>
          <SettingsList.Header
            headerText="Display Options"
            headerStyle={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/fontsizeicon.png")}
              />
            }
            title="Font Size"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.fontSizeNames[
                actions.FONT_SIZES.indexOf(this.props.fontSize)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontSizeActionSheet.show()}
          />
          {/* <ActionSheet
            ref={o => (this.FontSizeActionSheet = o)}
            title={"Font Size"}
            options={actions.fontSizeNames}
            cancelButtonIndex={actions.FONT_SIZES.length}
            onPress={index => {
              if (index !== actions.FONT_SIZES.length) {
                this.props.setFontSize(actions.FONT_SIZES[index]);
              }
            }}
          /> */}
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/fontfaceicon.png")}
              />
            }
            title="Font Face"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.fontFaceNames[
                actions.FONT_FACES.indexOf(this.props.fontFace)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.FontFaceActionSheet.show()}
          />

          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
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
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
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
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
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
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Header
            headerText="Phone Options"
            headerStyle={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
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
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Header
            headerText="Bani Options"
            headerStyle={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/rearrangeicon.png")}
              />
            }
            title="Edit Bani Order"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            onPress={() => navigate("EditBaniOrder")}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/banilengthicon.png")}
              />
            }
            title="Bani Length"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.baniLengthNames[
                actions.BANI_LENGTHS.indexOf(this.props.baniLength)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.BaniLengthActionSheet.show()}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
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
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/manglacharanicon.png")}
              />
            }
            title="Manglacharan Position"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
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

          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/larivaaricon.png")}
              />
            }
            title="Padchhed Settings"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            titleInfo={
              actions.padchhedSettingNames[
                actions.PADCHHED_SETTINGS.indexOf(this.props.padchhedSetting)
              ]
            }
            titleInfoStyle={styles.titleInfoStyle}
            onPress={() => this.PadchhedSettingsActionSheet.show()}
          />

          <SettingsList.Header
            headerText="Other Options"
            headerStyle={[
              styles.headerStyle,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
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
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
          />
          <SettingsList.Item
            backgroundColor={this.props.nightMode ? "#464646" : "#fff"}
            icon={
              <Image
                style={styles.imageStyle}
                source={require("../images/abouticon.png")}
              />
            }
            title="About"
            titleStyle={[
              styles.titleText,
              this.props.nightMode && { color: "#fff" }
            ]}
            onPress={() => navigate("About")}
          />
        </SettingsList>

        <ActionSheet
          ref={actionSheet => {
            this.FontSizeActionSheet = actionSheet;
          }}
          position="bottom"
          onChange={this.onChange}
          defaultValue={this.props.fontSize}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Font Size</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontSizeNames,
            actions.FONT_SIZES,
            checkedIcon,
            this.props.setFontSize
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.FontFaceActionSheet = actionSheet;
          }}
          position="bottom"
          onChange={this.onChange}
          defaultValue={this.props.fontFace}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Font Face</Text>
          </View>
          {this.actionSheetOptions(
            actions.fontFaceNames,
            actions.FONT_FACES,
            checkedIcon,
            this.props.setFontFace
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.BaniLengthActionSheet = actionSheet;
          }}
          position="bottom"
          onChange={this.onChange}
          defaultValue={this.props.baniLength}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Bani Length</Text>
          </View>
          {this.actionSheetOptions(
            actions.baniLengthNames,
            actions.BANI_LENGTHS,
            checkedIcon,
            this.props.setBaniLength
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.ManglacharanPositionActionSheet = actionSheet;
          }}
          position="bottom"
          onChange={this.onChange}
          defaultValue={this.props.manglacharanPosition}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Manglacharan Position</Text>
          </View>
          {this.actionSheetOptions(
            actions.manglacharanPositionNames,
            actions.MANGLACHARAN_POSITIONS,
            checkedIcon,
            this.props.setManglacharanPosition
          )}
        </ActionSheet>

        <ActionSheet
          ref={actionSheet => {
            this.PadchhedSettingsActionSheet = actionSheet;
          }}
          position="bottom"
          onChange={this.onChange}
          defaultValue={this.props.padchhedSetting}
        >
          <View>
            <Text style={styles.actionSheetTitle}>Padchhed Settings</Text>
          </View>
          {this.actionSheetOptions(
            actions.padchhedSettingNames,
            actions.PADCHHED_SETTINGS,
            checkedIcon,
            this.props.setPadchhedSetting
          )}
        </ActionSheet>
      </View>
    );
  }

  actionSheetOptions = (names, options, checkedIcon, dispatch) => {
    var items = [];
    for (var i = 0; i < names.length; i++) {
      items.push(
        <ActionSheetItem
          text={names[i]}
          value={options[i]}
          style={{ paddingTop: 15, paddingBottom: 15 }}
          selectedIcon={checkedIcon}
          onPress={value => {
            dispatch(value);
          }}
          key={i}
        />
      );
    }
    return items;
  };
}

const styles = StyleSheet.create({
  actionSheetTitle: {
    fontSize: 18,
    alignSelf: "center",
    padding: 10
  },
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
  },
  viewStyle: {
    backgroundColor: "#EFEFF4",
    flex: 1
  },
  headerStyle: {
    marginTop: 15
  },
  titleText: {
    fontSize: 16
  }
});

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

export default connect(mapStateToProps, mapDispatchToProps)(Settings);