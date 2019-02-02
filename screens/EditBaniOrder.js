import React from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  Image,
  View,
  Dimensions,
  Platform
} from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import GLOBAL from "../utils/globals";
import SortableList from "react-native-sortable-list";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import { baseFontSize } from "../utils/helpers";
import { defaultBaniOrderArray } from "../utils/helpers";

const window = Dimensions.get("window");

class EditBaniOrder extends React.Component {
  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView(
      "Index Reorder",
      this.constructor.name
    );
  }

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        <Header
          barStyle="light-content"
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.navigation.goBack()}
            />
          }
          centerComponent={{
            text: "Edit Bani Order",
            style: { color: GLOBAL.COLOR.TOOLBAR_TINT, fontSize: 18 }
          }}
          rightComponent={
            <Icon
              name="refresh"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => this.props.setBaniOrder(defaultBaniOrderArray)}
            />
          }
        />
        <View
          style={[
            styles.container,
            this.props.nightMode && { backgroundColor: "#464646" }
          ]}
        >
          <SortableList
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            data={this.props.mergedBaniData.baniOrder}
            onChangeOrder={nextOrder => {
              this.newOrder = nextOrder;
            }}
            onReleaseRow={key =>
              this.newOrder !== undefined
                ? this.props.setBaniOrder(this.newOrder)
                : null
            }
            renderRow={this._renderRow}
            order={this.props.baniOrder}
          />
        </View>
      </View>
    );
  }

  _renderRow = ({ data, active }) => {
    return (
      <Row
        data={data}
        active={active}
        nightMode={this.props.nightMode}
        romanized={this.props.romanized}
        fontFace={this.props.fontFace}
      />
    );
  };
}

class Row extends React.Component {
  constructor(props) {
    super(props);

    this._active = new Animated.Value(0);

    this._style = {
      ...Platform.select({
        ios: {
          transform: [
            {
              scale: this._active.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.1]
              })
            }
          ],
          shadowRadius: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 10]
          })
        },

        android: {
          transform: [
            {
              scale: this._active.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.07]
              })
            }
          ],
          elevation: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 6]
          })
        }
      })
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.active !== nextProps.active) {
      Animated.timing(this._active, {
        duration: 300,
        easing: Easing.bounce,
        toValue: Number(nextProps.active)
      }).start();
    }
  }

  render() {
    const { data, active, nightMode, romanized, fontFace } = this.props;

    return (
      <Animated.View
        style={[
          styles.row,
          nightMode && { backgroundColor: "#000" },
          this._style
        ]}
      >
        {data.folder && (
          <Image
            source={require("../images/foldericon.png")}
            style={styles.image}
          />
        )}

        <Text
          style={[
            { color: nightMode ? "#fff" : "#222222" },
            !romanized && { fontFamily: fontFace },
            { fontSize: baseFontSize("MEDIUM", romanized) }
          ]}
        >
          {romanized ? data.roman : data.gurmukhi}
        </Text>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",

    ...Platform.select({
      ios: {
        paddingTop: 0
      }
    })
  },

  list: {
    flex: 1
  },

  contentContainer: {
    width: window.width
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    height: 80,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
    borderRadius: 4,

    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.2)",
        shadowOpacity: 1,
        shadowOffset: { height: 2, width: 2 },
        shadowRadius: 2
      },

      android: {
        elevation: 0,
        marginHorizontal: 30
      }
    })
  },

  image: {
    width: 50,
    height: 50,
    marginRight: 20
  }
});

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    mergedBaniData: state.mergedBaniData,
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
)(EditBaniOrder);
