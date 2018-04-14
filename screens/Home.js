import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import KeepAwake from "react-native-keep-awake";
import { StatusBar } from "react-native";
import SplashScreen from "react-native-splash-screen";
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
    var ordered = new Array();
    var newIndex = new Array();
    for (var i = 0; i < index.length; i++) {
      if (arr[index[i]]) {
        ordered.push(arr[index[i]]);
        newIndex.push(index[i]);
      }
    }
    if(newIndex.length != index.length) {
      this.props.setBaniOrder(newIndex);
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

  changeStatusBar(shouldBeHidden) {
    StatusBar.setHidden(shouldBeHidden);
  }

  componentWillMount() {
    this.changeKeepAwake(this.props.screenAwake);
    this.changeStatusBar(this.props.statusBar);
    Database.getBaniList().then(baniList => {
      this.props.setMergedBaniData(mergedBaniList(baniList));
      this.sortBani();
      this.setState({
        isLoading: false
      });
    });
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.baniOrder != this.props.baniOrder) {
      this.sortBani();
    } else if (prevProps.screenAwake != this.props.screenAwake) {
      this.changeKeepAwake(this.props.screenAwake);
    } else if (prevProps.statusBar != this.props.statusBar) {
      this.changeStatusBar(this.props.statusBar);
    }
  }

  handleOnPress(item, navigator) {
    if (!item.folder) {
      this.props.setCurrentShabad(item.id);
      navigator.navigate("Reader", { item: item });
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
    screenAwake: state.screenAwake,
    statusBar: state.statusBar
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Home);
