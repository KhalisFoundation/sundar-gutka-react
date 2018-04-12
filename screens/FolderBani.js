import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions/actions";
import BaniList from "../components/BaniList";

class FolderBani extends React.Component {
  handleOnPress(item, navigator) {
    this.props.setCurrentShabad(item.id);
    navigator.navigate("Reader");
  }

  render() {
    const { params } = this.props.navigation.state;

    return (
      <BaniList
        data={params.data}
        nightMode={this.props.nightMode}
        fontSize={this.props.fontSize}
        fontFace={this.props.fontFace}
        romanized={this.props.romanized}
        navigation={this.props.navigation}
        onPress={this.handleOnPress.bind(this)}
      />
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

export default connect(mapStateToProps, mapDispatchToProps)(FolderBani);