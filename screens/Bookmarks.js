import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { View, StatusBar, Platform } from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from "prop-types";
import ErrorBoundary from "react-native-error-boundary";
import GLOBAL from "../utils/globals";
import Database from "../utils/database";
import BaniList from "../components/BaniList";
import LoadingIndicator from "../components/LoadingIndicator";
import * as actions from "../actions/actions";
import Strings from "../utils/localization";
import errorHandler from "../utils/errorHandler";

class Bookmarks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      isLoading: false,
    };
  }

  componentDidMount() {
    const { currentShabad, baniLength, transliterationLanguage } = this.props;
    Database.getBookmarksForId(currentShabad, baniLength, transliterationLanguage).then(
      (bookmarks) => {
        this.setState({
          data: bookmarks,
          isLoading: false,
        });
      }
    );
  }

  handleOnPress(item) {
    const { setScrollIndex, navigation } = this.props;
    setScrollIndex(item.shabadId);
    navigation.goBack();
  }

  render() {
    const { isLoading, data } = this.state;
    const { nightMode, navigation, fontSize, fontFace, transliteration } = this.props;
    <LoadingIndicator isLoading={isLoading} />;

    return (
      <ErrorBoundary onError={errorHandler}>
        <View
          style={{
            flex: 1,
          }}
        >
          <StatusBar
            backgroundColor={
              nightMode ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
            }
            barStyle={nightMode ? "light-content" : "dark-content"}
          />
          <Header
            backgroundColor={
              nightMode ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
            }
            containerStyle={[Platform.OS === "android" && { height: 56, paddingTop: 0 }]}
            leftComponent={
              <Icon
                name="arrow-back"
                color={nightMode ? GLOBAL.COLOR.TOOLBAR_TINT : GLOBAL.COLOR.TOOLBAR_TINT_DARK}
                size={30}
                onPress={() => navigation.goBack()}
              />
            }
            centerComponent={{
              text: Strings.bookmarks,
              style: {
                color: nightMode ? GLOBAL.COLOR.TOOLBAR_TINT : GLOBAL.COLOR.TOOLBAR_TINT_DARK,
                fontSize: 18,
              },
            }}
          />

          <BaniList
            data={data}
            nightMode={nightMode}
            fontSize={fontSize}
            fontFace={fontFace}
            transliteration={transliteration}
            navigation={navigation}
            isLoading={isLoading}
            onPress={this.handleOnPress.bind(this)}
          />
        </View>
      </ErrorBoundary>
    );
  }
}

Bookmarks.propTypes = {
  currentShabad: PropTypes.number.isRequired,
  baniLength: PropTypes.string.isRequired,
  transliterationLanguage: PropTypes.string.isRequired,
  setScrollIndex: PropTypes.func.isRequired,
  navigation: PropTypes.shape({
    addEventListener: PropTypes.func,
    canGoBack: PropTypes.func,
    dispatch: PropTypes.func,
    getID: PropTypes.func,
    getParent: PropTypes.func,
    getState: PropTypes.func,
    goBack: PropTypes.func,
    isFocused: PropTypes.func,
    navigate: PropTypes.func,
    pop: PropTypes.func,
    popToTop: PropTypes.func,
    push: PropTypes.func,
    removeListener: PropTypes.func,
    replace: PropTypes.func,
    reset: PropTypes.func,
    setOptions: PropTypes.func,
    setParams: PropTypes.func,
  }).isRequired,
  nightMode: PropTypes.bool.isRequired,
  fontSize: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  transliteration: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    baniLength: state.baniLength,
    currentShabad: state.currentShabad,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Bookmarks);
