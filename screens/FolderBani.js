import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { View, StatusBar, Platform } from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import GLOBAL from "../utils/globals";
import * as actions from "../actions/actions";
import BaniList from "../components/BaniList";
import constant from "../utils/constant";

class FolderBani extends React.Component {
  handleOnPress(item, navigator) {
    const { setCurrentShabad } = this.props;
    setCurrentShabad(item.id);
    navigator.navigate(constant.READER, {
      key: `Reader-${item.id}`,
      params: { item },
    });
  }

  render() {
    const { route, navigation, transliteration, fontFace, nightMode, fontSize } = this.props;
    const { goBack, navigate } = navigation;
    const { params } = route;
    const { title, data } = params;

    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <StatusBar backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR} barStyle="light-content" />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR}
          containerStyle={[Platform.OS === constant.ANDROID && { height: 56, paddingTop: 0 }]}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => goBack()}
            />
          }
          centerComponent={{
            text: `${title}`,
            style: [
              {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontFamily: !transliteration ? fontFace : null,
                fontSize: 24,
              },
            ],
          }}
          rightComponent={
            <Icon
              name="settings"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => navigate("Settings")}
            />
          }
        />
        <BaniList
          data={data}
          nightMode={nightMode}
          fontSize={fontSize}
          fontFace={fontFace}
          transliteration={transliteration}
          navigation={navigation}
          onPress={this.handleOnPress.bind(this)}
        />
      </View>
    );
  }
}

FolderBani.propTypes = {
  setCurrentShabad: PropTypes.func.isRequired,
  route: PropTypes.shape.isRequired,
  navigation: PropTypes.shape.isRequired,
  transliteration: PropTypes.bool.isRequired,
  fontFace: PropTypes.string.isRequired,
  nightMode: PropTypes.bool.isRequired,
  fontSize: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    transliteration: state.transliteration,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(FolderBani);
