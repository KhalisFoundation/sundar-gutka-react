import React from "react";
import {
  StyleSheet,
  Image,
  Text,
  Linking,
  ScrollView,
  TouchableHighlight
} from "react-native";
import { connect } from "react-redux";
import AnalyticsManager from "../utils/analytics";

class Home extends React.Component {
  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView("About");
  }

  render() {
    return (
      <ScrollView
        style={[
          styles.container,
          this.props.nightMode && { backgroundColor: "#000" }
        ]}
      >
        <Text style={[styles.title, this.props.nightMode && styles.nightMode]}>
          Sundar Gutka
        </Text>
        <Text style={[styles.small, this.props.nightMode && styles.nightMode]}>
          {"\n"}Created By:
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
            {"\n"}We welcome your comments, suggestions, and corrections!{"\n"}
            {"\n"}
            For information, suggestions, or help, visit us at{"\n"}
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
          {"\n"}Please respectfully cover your head and remove your shoes when
          using this app.
          {"\n"}
          {"\n"}
          Sundar Gutka utilizes{" "}
          <Text
            style={{ color: "#009bff" }}
            onPress={() => Linking.openURL("https://www.banidb.com/")}
          >
            BaniDB
          </Text>{" "}
          - the open source gurbani database and api used in many gurbani
          applications, such as SikhiToTheMax. {"\n"}
        </Text>
        <TouchableHighlight
          underlayColor={"#009bff"}
          onPress={() => Linking.openURL("https://www.banidb.com/")}
        >
          <Image source={require("../images/banidblogo.png")} />
        </TouchableHighlight>
        <Text style={this.props.nightMode && styles.nightMode}>
          {"\n"}Bhul Chuk Maaf!{"\n"}
        </Text>
        <Text style={[styles.small, this.props.nightMode && styles.nightMode]}>
          &copy; {new Date().getFullYear()} Khalis Foundation {"\n"}
        </Text>
      </ScrollView>
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
