import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { View } from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import Database from "../utils/database";
import BaniList from "../components/BaniList";
import LoadingIndicator from "../components/LoadingIndicator";
import * as actions from "../actions/actions";

class Bookmarks extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      isLoading: false
    };
  }

  componentWillMount() {
    Database.getBookmarksForId(
      this.props.currentShabad,
      this.props.baniLength
    ).then(bookmarks => {
      this.setState({
        data: bookmarks,
        isLoading: false
      });
    });
  }

  handleOnPress(item, navigator) {
    this.props.setScrollIndex(item.shabadId);
    this.props.navigation.goBack();
  }

  render() {
    <LoadingIndicator isLoading={this.state.isLoading} />

    return (
      <View
        style={{
          flex: 1
        }}
      >
        <Header
          outerContainerStyles={{ borderBottomWidth: 0 }}
          backgroundColor={
            this.props.nightMode
              ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE
              : GLOBAL.COLOR.TOOLBAR_COLOR_ALT
          }
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: "Bookmarks",
            style: {
              color: GLOBAL.COLOR.TOOLBAR_TINT,
              fontSize: 18
            }
          }}
        />

        <BaniList
          data={this.state.data}
          nightMode={this.props.nightMode}
          fontSize={this.props.fontSize}
          fontFace={this.props.fontFace}
          romanized={this.props.romanized}
          navigation={this.props.navigation}
          isLoading={this.state.isLoading}
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
    fontFace: state.fontFace,
    baniLength: state.baniLength,
    currentShabad: state.currentShabad
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bookmarks);
