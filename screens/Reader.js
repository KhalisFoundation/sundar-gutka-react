import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  FlatList,
  View,
  Text
} from "react-native";
import { connect } from "react-redux";
import { Header } from "react-native-elements";
import { bindActionCreators } from "redux";
import Database from "../utils/database";
import LoadingIndicator from "../components/LoadingIndicator";
import {
  fontSizeForReader,
  fontColorForReader,
  TextType
} from "../utils/helpers";
import * as actions from "../actions/actions";

const headerHeight = 80;
class Reader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: true,
      height: new Animated.Value(headerHeight), // The header height
      visible: true // Is the header currently visible
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
      toValue: this.state.visible ? 0 : headerHeight
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

  componentWillReceiveProps(nextProps) {
    if (nextProps.scrollIndex != -1) {
      this.scrollToItem(nextProps.scrollIndex);
      this.props.setScrollIndex(-1);
    }
  }

  scrollToItem(index) {
    var viewPosition;
    for (let i = 0; i < this.state.data.length; i++) {
      if (this.state.data[i].id == index) {
        viewPosition = i;
        break;
      }
    }
    this.flatListRef.scrollToIndex({ animated: false, index: viewPosition });
  }

  // getItemLayout = (data, index) => {
  //   return { length: 200, offset: 200 * index, index };
  // };

  render() {
    if (this.state.isLoading) {
      return <LoadingIndicator nightMode={this.props.nightMode} />;
    }

    return (
      <View
        style={[
          styles.container,
          this.props.nightMode && { backgroundColor: "#000" }
        ]}
      >
        <FlatList
          ref={ref => {
            this.flatListRef = ref;
          }}
          data={this.state.data}
          contentContainerStyle={[{ marginTop: headerHeight }, {paddingBottom: headerHeight}]}
          onScroll={this._onScroll.bind(this)}
          extraData={this.state}
          getItemLayout={this.getItemLayout}
          renderItem={({ item }) => (
            <View
              style={styles.itemBlock}
            >
              <Text
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
                        : item.header === 1 || item.header == 2
                          ? "center"
                          : "right"
                  },
                  {
                    fontSize: fontSizeForReader(
                      this.props.fontSize,
                      item.header
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
                          : item.header === 1 || item.header == 2
                            ? "center"
                            : "right"
                    },
                    {
                      fontSize: fontSizeForReader(
                        this.props.fontSize,
                        item.header
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
                            : item.header === 1 || item.header == 2
                              ? "center"
                              : "right"
                      },
                      {
                        fontSize: fontSizeForReader(
                          this.props.fontSize,
                          item.header
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
          leftComponent={{
            icon: "arrow-back",
            color: "#fff",
            onPress: () => this.props.navigation.goBack()
          }}
          centerComponent={{ text: "Reader", style: { color: "#fff" } }}
          rightComponent={{
            icon: "bookmark",
            color: "#fff",
            onPress: () => this.props.navigation.navigate("Bookmarks")
          }}
        />
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  itemBlock: {
    padding: 5
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
		height: 200
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
