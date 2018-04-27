import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  FlatList,
  View,
  Modal,
  Text
} from "react-native";
import { connect } from "react-redux";
import { Header } from "react-native-elements";
import { bindActionCreators } from "redux";
import Icon from "react-native-vector-icons/FontAwesome";
import GLOBAL from "../utils/globals";
import Database from "../utils/database";
import LoadingIndicator from "../components/LoadingIndicator";
import {
  fontSizeForReader,
  fontColorForReader,
  TextType
} from "../utils/helpers";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";

const HEADER_HEIGHT = 70; // From react-native-elements Header source
class Reader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: false,
      height: new Animated.Value(HEADER_HEIGHT), // The header height
      visible: true, // Is the header currently visible
      isScrolling: false,
      scrollingIndex: -1,
      scrollingFailed: false
    };

    // How long does the slide animation take
    this.slideDuration = this.props.slideDuration || 400;
  }

  _onScroll(event) {
    const currentOffset = event.nativeEvent.contentOffset.y;

    // Ignore scroll events outside the scrollview
    if (
      currentOffset < 0 ||
      currentOffset >
        event.nativeEvent.contentSize.height -
          event.nativeEvent.layoutMeasurement.height
    ) {
      return;
    }

    if (
      (this.state.visible && currentOffset > this.offset) ||
      (!this.state.visible && currentOffset < this.offset)
    ) {
      this._toggleHeader();
    }

    this.offset = currentOffset;
  }

  _toggleHeader() {
    Animated.timing(this.state.height, {
      duration: this.slideDuration,
      toValue: this.state.visible ? 0 : HEADER_HEIGHT
    }).start();
    this.setState({ visible: !this.state.visible });
  }

  componentWillMount() {
    Database.getShabadForId(
      this.props.currentShabad,
      this.props.baniLength,
      this.props.larivaar,
      this.props.padchhedSetting,
      this.props.manglacharanPosition,
      this.props.paragraphMode
    ).then(shabad => {
      this.setState({
        data: shabad,
        isLoading: false
      });
    });
  }

  trackScreenForShabad(name) {
    AnalyticsManager.getInstance().trackScreenView(name);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.scrollIndex != -1) {
      this.scrollToItem(nextProps.scrollIndex);
      this.props.setScrollIndex(-1);
    }
  }

  scrollToItem(index) {
    var viewPosition;
    for (let i = 0; i < this.state.data.length; i++) {
      if (this.state.data[i].id <= index) {
        viewPosition = i;
      }

      if (this.state.data[i].id == index) {
        break;
      }
    }
    this.state.scrollingIndex = viewPosition;
    this.state.isScrolling = true;
    this.flatListRef.scrollToIndex({ animated: false, index: viewPosition });
  }

  truncate(n) {
    return this.length > n ? this.substr(0, n - 1) + "..." : this + "";
  }

  onScrollToIndexFailed = info => {
    if (this.state.isScrolling && !this.state.scrollingFailed) {
      //this.state.isLoading = true;
      this.state.scrollingFailed = true;
      this.flatListRef.scrollToIndex({
        animated: false,
        index: info.highestMeasuredFrameIndex
      });
    }
  };

  onViewableItemsChanged = info => {
    if (info.viewableItems[0]) {
      if (this.state.isScrolling && this.state.scrollingFailed) {
        if (info.viewableItems[0].index !== this.state.scrollingIndex) {
          var that = this;
          that.state.scrollingFailed = false;
          setTimeout(function() {
            that.flatListRef.scrollToIndex({
              animated: false,
              index: that.state.scrollingIndex
            });
          }, 100);
        }
      } 
      if (info.viewableItems[0].index == this.state.scrollingIndex) {
        this.state.isScrolling = false;
      }
      this.state.isLoading = false;
    }
    
  };

  render() {
    const { params } = this.props.navigation.state;

    {
      this.trackScreenForShabad(params.item.roman);
    }

    return (
      <View
        style={[
          styles.container,
          this.props.nightMode && { backgroundColor: "#000" }
        ]}
      >
        <LoadingIndicator isLoading={this.state.isLoading} />

        <FlatList
          ref={ref => {
            this.flatListRef = ref;
          }}
          data={this.state.data}
          contentContainerStyle={[
            { marginTop: HEADER_HEIGHT },
            { paddingBottom: HEADER_HEIGHT }
          ]}
          onScroll={this._onScroll.bind(this)}
          extraData={this.state}
          onScrollToIndexFailed={this.onScrollToIndexFailed}
          onViewableItemsChanged={this.onViewableItemsChanged}
          //initialNumToRender={this.state.data.length}
          //getItemLayout={this.getItemLayout}
          renderItem={({ item }) => (
            <View style={styles.itemBlock}>
              <Text
                selectable={true}
                style={[
                  {
                    color: fontColorForReader(
                      item.header,
                      this.props.nightMode,
                      TextType.GURMUKHI
                    )
                  },
                  { fontFamily: this.props.fontFace },
                  { padding: 5 },
                  {
                    textAlign:
                      item.header === 0
                        ? "left"
                        : item.header === 1 || item.header === 2
                          ? "center"
                          : "right"
                  },
                  {
                    fontSize: fontSizeForReader(
                      this.props.fontSize,
                      item.header,
                      false
                    )
                  }
                ]}
              >
                {item.gurmukhi}
              </Text>
              {this.props.romanized && (
                <Text
                  style={[
                    {
                      color: fontColorForReader(
                        item.header,
                        this.props.nightMode,
                        TextType.TRANSLITERATION
                      )
                    },
                    { padding: 5 },
                    { fontWeight: item.header === 0 ? "normal" : "bold" },
                    {
                      textAlign:
                        item.header === 0
                          ? "left"
                          : item.header === 1 || item.header === 2
                            ? "center"
                            : "right"
                    },
                    {
                      fontSize: fontSizeForReader(
                        this.props.fontSize,
                        item.header,
                        true
                      )
                    }
                  ]}
                >
                  {item.roman}
                </Text>
              )}
              {this.props.englishTranslations &&
                item.englishTranslations && (
                  <Text
                    style={[
                      {
                        color: fontColorForReader(
                          item.header,
                          this.props.nightMode,
                          TextType.ENGLISH_TRANSLATION
                        )
                      },
                      { padding: 5 },
                      { fontWeight: item.header === 0 ? "normal" : "bold" },
                      {
                        textAlign:
                          item.header === 0
                            ? "left"
                            : item.header === 1 || item.header === 2
                              ? "center"
                              : "right"
                      },
                      {
                        fontSize: fontSizeForReader(
                          this.props.fontSize,
                          item.header,
                          true
                        )
                      }
                    ]}
                  >
                    {item.englishTranslations}
                  </Text>
                )}
            </View>
          )}
          keyExtractor={item => item.id}
        />
        <Animated.View style={[styles.header, { height: this.state.height }]}>
          <Header
            backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR}
            leftComponent={
              <Icon
                name="arrow-left"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this.props.navigation.goBack()}
              />
            }
            centerComponent={{
              text: this.props.romanized
                ? this.truncate.apply(params.item.roman, [30])
                : this.truncate.apply(params.item.gurmukhi, [30]),
              style: {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontFamily: this.props.romanized ? null : this.props.fontFace,
                fontSize: 20
              }
            }}
            rightComponent={
              <Icon
                name="bookmark"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => {
                  this.trackScreenForShabad(
                    "Bookmarks for " + params.item.roman
                  );
                  this.props.navigation.navigate({
                    key: "Bookmarks",
                    routeName: "Bookmarks"
                  });
                }}
              />
            }
          />
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },
  itemBlock: {
    padding: 5
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    backgroundColor: "transparent"
  }
});

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    currentShabad: state.currentShabad,
    scrollIndex: state.scrollIndex,
    romanized: state.romanized,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    baniLength: state.baniLength,
    larivaar: state.larivaar,
    padchhedSetting: state.padchhedSetting,
    manglacharanPosition: state.manglacharanPosition,
    englishTranslations: state.englishTranslations,
    paragraphMode: state.paragraphMode
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Reader);
