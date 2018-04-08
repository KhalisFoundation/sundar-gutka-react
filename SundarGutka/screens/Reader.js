import React from "react";
import { StyleSheet, FlatList, View, Text } from "react-native";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import Database from "../utils/database";
import LoadingIndicator from "../components/LoadingIndicator";
import {
  fontSizeForReader,
  fontColorForReader,
  TextType
} from "../utils/helpers";
import * as actions from "../actions/actions";

class Reader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: true
    };
  }

  componentWillMount() {
    Database.getShabadForId(
      this.props.currentShabad,
      this.props.baniLength,
      this.props.larivaar
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
          extraData={this.state}
          getItemLayout={this.getItemLayout}
          renderItem={({ item }) => (
            <View style={styles.itemBlock}>
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
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10
  },
  itemBlock: {
    padding: 5
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
    englishTranslations: state.englishTranslations
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Reader);
