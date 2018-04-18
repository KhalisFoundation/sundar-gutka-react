import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Database from "../utils/database";
import BaniList from "../components/BaniList";
import LoadingIndicator from "../components/LoadingIndicator";
import * as actions from "../actions/actions";

class FolderBani extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: true
    };
  }

  componentWillMount() {
    Database.getBookmarksForId(this.props.currentShabad, this.props.baniLength).then(bookmarks => {
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
    if (this.state.isLoading) {
      return <LoadingIndicator nightMode={this.props.nightMode} />;
    }
    return (
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

export default connect(mapStateToProps, mapDispatchToProps)(FolderBani);
