import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { View, StatusBar } from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import * as actions from "../actions/actions";
import BaniList from "../components/BaniList";

class FolderBani extends React.Component {
  handleOnPress(item, navigator) {
    this.props.setCurrentShabad(item.id);
    navigator.navigate({
      key: "Reader-" + item.id,
      routeName: "Reader",
      params: { item: item }
    });
  }

  render() {
    const { params } = this.props.navigation.state;

    return (
      <View
        style={{
          flex: 1
        }}
      >
        <StatusBar
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR}
          barStyle={"light-content"}
        />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: `${this.props.navigation.state.params.title}`,
            style: [
              {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontFamily: "GurbaniAkharHeavySG",
                fontSize: 24
              }
            ]
          }}
          rightComponent={
            <Icon
              name="settings"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() =>
                this.props.navigation.navigate({
                  key: "Settings",
                  routeName: "Settings"
                })
              }
            />
          }
        />
        <BaniList
          data={params.data}
          nightMode={this.props.nightMode}
          fontSize={this.props.fontSize}
          fontFace={this.props.fontFace}
          romanized={this.props.romanized}
          navigation={this.props.navigation}
          onPress={this.handleOnPress.bind(this)}
        />
      </View>
    );
  }
}

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
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
)(FolderBani);
