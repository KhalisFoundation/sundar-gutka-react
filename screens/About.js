import React from "react";
import {
  StyleSheet,
  Image,
  View,
  Text,
  Linking,
  ScrollView,
  TouchableHighlight,
  StatusBar,
  Platform
} from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import { connect } from "react-redux";
import VersionNumber from "react-native-version-number";
import AnalyticsManager from "../utils/analytics";
import Strings from "../utils/localization";

class Home extends React.Component {
  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView(
      "About",
      this.constructor.name
    );
  }

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        <StatusBar
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          barStyle={"light-content"}
        />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          containerStyle={[Platform.OS === "android" && { height: 56, paddingTop: 0 }]}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: Strings.about,
            style: { color: GLOBAL.COLOR.TOOLBAR_TINT, fontSize: 18 }
          }}
        />
        <ScrollView
          style={[
            styles.container,
            this.props.nightMode && { backgroundColor: "#000" }
          ]}
        >
          <Text
            style={[styles.title, this.props.nightMode && styles.nightMode]}
          >
            {Strings.sundar_gutka}
          </Text>
          <Text
            style={[styles.small, this.props.nightMode && styles.nightMode]}
          >
            {"\n"}{Strings.created_by}:
          </Text>
          <TouchableHighlight
            underlayColor={"#009bff"}
            onPress={() => Linking.openURL("https://khalisfoundation.org")}
          >
            <Image
              source={
                this.props.nightMode
                  ? require("../images/khalislogo150white.png")
                  : require("../images/khalislogo150.png")
              }
            />
          </TouchableHighlight>
          <Text style={this.props.nightMode && styles.nightMode}>
            <Text>
              {"\n"}{Strings.about_1}
              {"\n"}
              {"\n"}
              {Strings.about_2}{"\n"}
            </Text>
            <Text>
              <Text
                style={{ color: "#009bff" }}
                onPress={() => Linking.openURL("https://khalisfoundation.org")}
              >
                http://www.KhalisFoundation.org
              </Text>
              <Text>!</Text>
            </Text>
          </Text>
          <Text style={this.props.nightMode && styles.nightMode}>
            {"\n"}{Strings.about_3}
            {"\n"}
            {"\n"}
            {Strings.about_4}{" "}
            <Text
              style={{ color: "#009bff" }}
              onPress={() => Linking.openURL("https://www.banidb.com/")}
            >
              {Strings.baniDB}
            </Text>{" "}
            {Strings.about_5}
            {"\n"}
          </Text>
          <TouchableHighlight
            underlayColor={"#009bff"}
            onPress={() => Linking.openURL("https://www.banidb.com/")}
          >
            <Image source={require("../images/banidblogo.png")} />
          </TouchableHighlight>
          <Text style={this.props.nightMode && styles.nightMode}>
            {"\n"}{Strings.about_6}{"\n"}
          </Text>
          <Text
            style={[styles.small, this.props.nightMode && styles.nightMode]}
          />

          <View style={styles.singleLine}>
            <View style={styles.leftContainer}>
              <Text
                style={[styles.small, this.props.nightMode && styles.nightMode]}
              >
                &copy; {new Date().getFullYear()} {Strings.khalis_foundation}
              </Text>
            </View>
            <Text
              style={[styles.small, this.props.nightMode && styles.nightMode]}
            >
              {Strings.app_version}: {VersionNumber.appVersion} (
              {VersionNumber.buildVersion}){"\n"}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: "#fff"
  },
  nightMode: {
    backgroundColor: "#000",
    color: "#fff"
  },
  singleLine: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 20,
    fontWeight: "bold"
  },
  small: {
    fontSize: 11
  }
});

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode
  };
}

export default connect(mapStateToProps)(Home);
