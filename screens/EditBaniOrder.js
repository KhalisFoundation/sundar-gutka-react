/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
import React from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  Image,
  View,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import PropTypes from "prop-types";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import SortableList from "react-native-sortable-list";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import GLOBAL from "../utils/globals";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import { baseFontSize, defaultBaniOrderArray } from "../utils/helpers";
import Strings from "../utils/localization";

const window = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eee",

    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
    }),
  },

  list: {
    flex: 1,
  },

  contentContainer: {
    width: window.width,
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
        shadowRadius: 2,
      },

      android: {
        elevation: 0,
        marginHorizontal: 30,
      },
    }),
  },

  image: {
    width: 50,
    height: 50,
    marginRight: 20,
  },
});
class EditBaniOrder extends React.Component {
  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView("Index Reorder", this.constructor.name);
  }

  _renderRow = ({ data, active }) => {
    const { nightMode, transliteration, fontFace } = this.props;
    return (
      <Row
        data={data}
        active={active}
        nightMode={nightMode}
        transliteration={transliteration}
        fontFace={fontFace}
      />
    );
  };

  render() {
    const { navigation, setBaniOrder, nightMode, mergedBaniData, baniOrder } = this.props;
    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <StatusBar backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2} barStyle="light-content" />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          containerStyle={[Platform.OS === "android" && { height: 56, paddingTop: 0 }]}
          leftComponent={
            <Icon
              name="arrow-back"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => navigation.goBack()}
            />
          }
          centerComponent={{
            text: Strings.edit_bani_order,
            style: { color: GLOBAL.COLOR.TOOLBAR_TINT, fontSize: 18 },
          }}
          rightComponent={
            <Icon
              name="refresh"
              color={GLOBAL.COLOR.TOOLBAR_TINT}
              size={30}
              onPress={() => setBaniOrder(defaultBaniOrderArray)}
            />
          }
        />
        <View style={[styles.container, nightMode && { backgroundColor: "#464646" }]}>
          <SortableList
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            data={mergedBaniData.baniOrder}
            onChangeOrder={(nextOrder) => {
              this.newOrder = nextOrder;
            }}
            onReleaseRow={() => (this.newOrder !== undefined ? setBaniOrder(this.newOrder) : null)}
            // eslint-disable-next-line no-underscore-dangle
            renderRow={this._renderRow}
            order={baniOrder}
          />
        </View>
      </View>
    );
  }
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
                outputRange: [1, 1.1],
              }),
            },
          ],
          shadowRadius: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 10],
          }),
        },

        android: {
          transform: [
            {
              scale: this._active.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.07],
              }),
            },
          ],
          elevation: this._active.interpolate({
            inputRange: [0, 1],
            outputRange: [2, 6],
          }),
        },
      }),
    };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { active } = this.props;
    if (active !== nextProps.active) {
      Animated.timing(this._active, {
        duration: 300,
        easing: Easing.bounce,
        toValue: Number(nextProps.active),
      }).start();
    }
  }

  render() {
    const { data, nightMode, transliteration, fontFace } = this.props;

    return (
      <Animated.View style={[styles.row, nightMode && { backgroundColor: "#000" }, this._style]}>
        {data.folder && <Image source={require("../images/foldericon.png")} style={styles.image} />}

        <Text
          style={[
            { color: nightMode ? "#fff" : "#222222" },
            !transliteration && { fontFamily: fontFace },
            { fontSize: baseFontSize("MEDIUM", transliteration) },
          ]}
        >
          {transliteration ? data.translit : data.gurmukhi}
        </Text>
      </Animated.View>
    );
  }
}

EditBaniOrder.propTypes = {
  nightMode: PropTypes.bool.isRequired,
  transliteration: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  navigation: PropTypes.func.isRequired,
  setBaniOrder: PropTypes.func.isRequired,
  mergedBaniData: PropTypes.shape({
    baniOrder: PropTypes.arrayOf(
      PropTypes.shape({
        gurmukhi: PropTypes.string,
        id: PropTypes.number,
        translit: PropTypes.string,
      })
    ),
  }).isRequired,
  baniOrder: PropTypes.arrayOf(PropTypes.number).isRequired,
};

Row.propTypes = {
  data: PropTypes.shape().isRequired,
  nightMode: PropTypes.bool.isRequired,
  transliteration: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  active: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    mergedBaniData: state.mergedBaniData,
    transliteration: state.transliteration,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(EditBaniOrder);
