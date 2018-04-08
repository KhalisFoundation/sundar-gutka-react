import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import KeepAwake from "react-native-keep-awake";
import Database from "../utils/database";
import { mergedBaniList } from "../utils/helpers";
import * as actions from "../actions/actions";
import BaniList from "../components/BaniList";

class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: true
    };
  }

  reorder(arr, index) {
    var ordered = new Array(index.length);

    for (var i = 0; i < index.length; i++) {
      ordered[i] = arr[index[i]];
    }
    return ordered;
  }

  sortBani() {
    this.setState({
      data: this.reorder(
        this.props.mergedBaniData.baniOrder,
        this.props.baniOrder
      )
    });
  }

  changeKeepAwake(shouldBeAwake) {
    if (shouldBeAwake) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }
  }

  componentWillMount() {
    this.changeKeepAwake(this.props.screenAwake);
    Database.getBaniList().then(baniList => {
      this.props.setMergedBaniData(mergedBaniList(baniList));
      this.sortBani();
      this.setState({
        isLoading: false
      });
    });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.baniOrder != this.props.baniOrder) {
      this.sortBani();
    } else if (prevProps.screenAwake != this.props.screenAwake) {
      this.changeKeepAwake(this.props.screenAwake);
    }
  }

  handleOnPress(item, navigator) {
    if (!item.folder) {
      this.props.setCurrentShabad(item.id);
      navigator.navigate("Reader");
    } else {
      navigator.navigate("FolderBani", { data: item.folder });
    }
  }

  render() {
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
    baniOrder: state.baniOrder,
    mergedBaniData: state.mergedBaniData,
    romanized: state.romanized,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    screenAwake: state.screenAwake
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
