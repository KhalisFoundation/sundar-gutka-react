import React, { Component } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight,
  Animated
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";

class ReminderPanel extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: props.title,
      expanded: false,
      animation: new Animated.Value()
    };
  }

  toggle() {

    let initialValue = this.state.expanded
        ? this.state.maxHeight + this.state.minHeight
        : this.state.minHeight,
      finalValue = this.state.expanded
        ? this.state.minHeight
        : this.state.maxHeight + this.state.minHeight;

    this.setState({
      expanded: !this.state.expanded
    });

    this.state.animation.setValue(initialValue);
    Animated.spring(this.state.animation, {
      toValue: finalValue
    }).start();
  }

  _setMaxHeight(event) {
    this.setState({
      maxHeight: event.nativeEvent.layout.height
    });
  }

  _setMinHeight(event) {
    this.setState({
      minHeight: event.nativeEvent.layout.height
    });
  }

  componentDidMount() {
    //setTimeout(this._getContentHeight);
  }

  render() {
    const { nightMode, romanized, fontFace, fontSize } = this.props;
    return (
      <Animated.View
        style={[styles.container, { height: this.state.animation }]}
      >
        <View style={styles.container}>
          <View
            style={styles.titleContainer}
            onLayout={this._setMinHeight.bind(this)}
          >
            <Text style={styles.title}>{this.state.title}</Text>

            <TouchableHighlight
              style={styles.button}
              onPress={this.toggle.bind(this)}
              underlayColor="#f1f1f1"
            >
              <Icon
                name={
                  this.state.expanded
                    ? "keyboard-arrow-up"
                    : "keyboard-arrow-down"
                }
                color={
                  this.props.nightMode
                    ? GLOBAL.COLOR.TOOLBAR_COLOR_ALT
                    : GLOBAL.COLOR.TOOLBAR_COLOR_ALT_NIGHT_MODE
                }
                size={30}
              />
            </TouchableHighlight>
          </View>

          <View
            style={[styles.body]}
            onLayout={this._setMaxHeight.bind(this)}
          >
            <Text style={styles.title}>blak blah aslfdj a; f</Text>
            <Text style={styles.title}>blak blah aslfdj a; f</Text>
            <Text style={styles.title}>blak blah aslfdj a; f</Text>
          </View>
        </View>
      </Animated.View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    overflow: "hidden"
  },
  titleContainer: {
    flexDirection: "row"
  },
  title: {
    flex: 1,
    padding: 10,
    color: "#2a2f43",
    fontWeight: "bold"
  },
  button: {},
  buttonImage: {
    width: 30,
    height: 25
  },
  body: {
    padding: 10,
    paddingTop: 0
  }
});

export default ReminderPanel;
