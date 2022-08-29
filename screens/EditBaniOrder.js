import React from "react";
import { StyleSheet, View, Dimensions, Platform, StatusBar } from "react-native";
import PropTypes from "prop-types";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import SortableList from "react-native-sortable-list";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import GLOBAL from "../utils/globals";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import { defaultBaniOrderArray } from "../utils/helpers";
import Strings from "../utils/localization";
import CONSTANT from "../utils/constant";
import Row from "./Row";
import { current } from "@reduxjs/toolkit";

const window = Dimensions.get("window");
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: GLOBAL.COLOR.BANI_ORDER_BACK_COLOR,

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

  image: {
    width: 50,
    height: 50,
    marginRight: 20,
  },
});
class EditBaniOrder extends React.Component {
  componentDidMount() {
    AnalyticsManager.getInstance().trackScreenView(CONSTANT.INDEX_REORDER, this.constructor.name);
  }

  renderRow = ({ data, active }) => {
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
    const { VIEW_BACK_COLOR } = GLOBAL.COLOR;
    return (
      <View
        style={{
          flex: 1,
        }}
      >
        <StatusBar backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2} barStyle="light-content" />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR_ALT2}
          containerStyle={[Platform.OS === CONSTANT.ANDROID && { height: 56, paddingTop: 0 }]}
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
        <View style={[styles.container, nightMode && { backgroundColor: VIEW_BACK_COLOR }]}>
          <SortableList
            style={styles.list}
            contentContainerStyle={styles.contentContainer}
            decelerationRate={null}
            data={mergedBaniData.baniOrder}
            onChangeOrder={(nextOrder) => {
              setBaniOrder(nextOrder);
            }}
            // onReleaseRow={(key, currentOrder) => {
            //   const newOrder = currentOrder.map((item) => {
            //     return Number(item);
            //   });
            //   console.log(newOrder);
            //   setBaniOrder(newOrder);
            // }}
            renderRow={this.renderRow}
            order={baniOrder}
          />
        </View>
      </View>
    );
  }
}

EditBaniOrder.propTypes = {
  nightMode: PropTypes.bool.isRequired,
  transliteration: PropTypes.bool.isRequired,
  fontFace: PropTypes.string.isRequired,
  navigation: PropTypes.shape().isRequired,
  setBaniOrder: PropTypes.func.isRequired,
  mergedBaniData: PropTypes.shape().isRequired,
  baniOrder: PropTypes.arrayOf(PropTypes.number).isRequired,
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
