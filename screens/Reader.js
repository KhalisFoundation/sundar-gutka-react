import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Modal,
  View,
  WebView,
  Platform
} from "react-native";
import { connect } from "react-redux";
import { Header } from "react-native-elements";
import { bindActionCreators } from "redux";
import Icon from "react-native-vector-icons/FontAwesome";
import GLOBAL from "../utils/globals";
import Database from "../utils/database";
import LoadingIndicator from "../components/LoadingIndicator";
import ReaderBaniItem from "../components/ReaderBaniItem";
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
      visible: true // Is the header currently visible
    };

    // How long does the slide animation take
    this.slideDuration = 400;
    this.webView = null;
  }

  toggleHeader(state) {
    Animated.timing(this.state.height, {
      duration: this.slideDuration,
      toValue: state == "hide" ? 0 : HEADER_HEIGHT
    }).start();
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
        viewPosition = index;
      }

      if (this.state.data[i].id == index) {
        break;
      }
    }
    this.webView.postMessage(viewPosition);
  }

  truncate(n) {
    return this.length > n ? this.substr(0, n - 1) + "..." : this + "";
  }

  loadHTML(data) {
    if (data.length > 0) {
      let fontSize = this.props.fontSize;
      let fontFace = this.props.fontFace;
      let nightMode = this.props.nightMode;
      let romanized = this.props.romanized;
      let englishTranslations = this.props.englishTranslations;
      var html =
        "<!DOCTYPE html><html><head>" +
        "<meta name='viewport' content='width=device-width, maximum-scale=1.0, user-scalable=yes'>" +
        "<style type='text/css'>";
      if (Platform.OS === "android") {
        html +=
          "@font-face{font-family: '" +
          fontFace +
          "'; " +
          "src: url('file:///android_asset/fonts/" +
          fontFace +
          ".ttf');}";
      }
      html +=
        "body { " +
        "background-color: " +
        (nightMode ? "#000" : "#fff") +
        ";" +
        "color: " +
        (nightMode ? "#fff" : "#000") +
        ";" +
        "padding-top: 3.5em; }";
      html += "</style><script>" + this.loadScrollJS() + "</script>";
      html += "</head><body>";

      data.forEach(function(item) {
        html += "<div style='padding-top: .5em'>";
        html +=
          "<div id='" +
          item.id +
          "' style=\"padding: .2em; font-family:'" +
          fontFace +
          "'; font-size: " +
          fontSizeForReader(fontSize, item.header, false) +
          "em; color: " +
          fontColorForReader(item.header, nightMode, TextType.GURMUKHI) +
          "; text-align: " +
          (item.header === 0
            ? "left"
            : item.header === 1 || item.header === 2
              ? "center"
              : "right") +
          ';">' +
          item.gurmukhi +
          "</div>";

        if (romanized) {
          html +=
            "<div style=\"padding: .2em; font-family:'Arial'; font-size: " +
            fontSizeForReader(fontSize, item.header, true) +
            "em; color: " +
            fontColorForReader(
              item.header,
              nightMode,
              TextType.TRANSLITERATION
            ) +
            "; text-align: " +
            (item.header === 0
              ? "left"
              : item.header === 1 || item.header === 2
                ? "center"
                : "right") +
            "; font-weight: " +
            (item.header === 0 ? "normal" : "bold") +
            ';">' +
            item.roman +
            "</div>";
        }

        if (englishTranslations) {
          html +=
            "<div style=\"padding: .2em; font-family:'Arial'; font-size: " +
            fontSizeForReader(fontSize, item.header, true) +
            "em; color: " +
            fontColorForReader(
              item.header,
              nightMode,
              TextType.ENGLISH_TRANSLATION
            ) +
            "; text-align: " +
            (item.header === 0
              ? "left"
              : item.header === 1 || item.header === 2
                ? "center"
                : "right") +
            "; font-weight: " +
            (item.header === 0 ? "normal" : "bold") +
            ';">' +
            item.englishTranslations +
            "</div>";
        }
        html += "</div>";
      });
      html += "</body></html>";
      return html;
    }
  }

  loadScrollJS() {
    return `
    function scrollFunc(e) {
      if (window.scrollY == 0) { window.postMessage('show'); }
        
      if ( typeof scrollFunc.y == 'undefined' ) {
            scrollFunc.y=window.pageYOffset;
        }
        
        var diffY=scrollFunc.y-window.pageYOffset;
    
    
        if( diffY<0 ) {
            // Scroll down
            if(diffY<-3) {
              window.postMessage('hide');
            }
        } else if( diffY>5 ) {
            // Scroll up
            window.postMessage('show');
        } else {
            // First scroll event
        }
        scrollFunc.y=window.pageYOffset;
    }
    window.onscroll = scrollFunc;

    document.addEventListener("message", function(event) {
      location.hash = "#" + event.data;
      setTimeout(function() { window.postMessage('hide'); }, 50);
      
        }, false);
      `;
  }

  handleMessage(message) {
    this.toggleHeader(message.nativeEvent.data);
  }

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

        <WebView
          ref={webView => (this.webView = webView)}
          source={{
            html: this.loadHTML(this.state.data),
            baseUrl: ""
          }}
          //injectedJavaScript={this.loadScrollJS()}
          onMessage={this.handleMessage.bind(this)}
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
