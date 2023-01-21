import React from "react";
import { Animated, Dimensions, StyleSheet, View, Platform, Text, StatusBar } from "react-native";
import PropTypes from "prop-types";
import { WebView } from "react-native-webview";
import { connect } from "react-redux";
import Slider from "@react-native-community/slider";
import { bindActionCreators } from "redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import GLOBAL from "../utils/globals";
import Database from "../utils/database";
import { fontSizeForReader, fontColorForReader, TextType } from "../utils/helpers";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import CONSTANT from "../utils/constant";

const HEADER_POSITION = -120; // From react-native-elements Header source
class Reader extends React.Component {
  currentBani = {
    id: 0,
    translit: "",
    progress: 0,
  };

  constructor(props) {
    super(props);

    const isPortrait = () => {
      const dim = Dimensions.get("screen");
      return dim.height >= dim.width;
    };

    Dimensions.addEventListener("change", () => {
      this.setState({
        orientation: isPortrait() ? CONSTANT.PORTRAIT : CONSTANT.LANDSCAPE,
      });
    });

    this.state = {
      data: [],
      paused: true,
      scrollMultiplier: 1.0,
      orientation: isPortrait() ? CONSTANT.PORTRAIT : CONSTANT.LANDSCAPE,
      animationPosition: new Animated.Value(0), // The header and footer position
      viewLoaded: false,
    };

    // How long does the slide animation take
    this.slideDuration = 200;
    this.webView = null;
  }

  componentDidMount() {
    this.loadShabad();
    this.setPosition();
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    const { setScrollIndex } = this.props;
    if (nextProps.scrollIndex !== -1) {
      this.scrollToItem(nextProps.scrollIndex);
      setScrollIndex(-1);
    }
  }

  componentDidUpdate(prevProps) {
    const {
      baniLength,
      larivaar,
      larivaarAssist,
      paragraphMode,
      manglacharanPosition,
      padchhedSetting,
      visram,
      vishraamOption,
      vishraamSource,
      transliterationLanguage,
    } = this.props;
    if (
      prevProps.baniLength !== baniLength ||
      prevProps.larivaar !== larivaar ||
      prevProps.larivaarAssist !== larivaarAssist ||
      prevProps.paragraphMode !== paragraphMode ||
      prevProps.manglacharanPosition !== manglacharanPosition ||
      prevProps.padchhedSetting !== padchhedSetting ||
      prevProps.visram !== visram ||
      prevProps.vishraamOption !== vishraamOption ||
      prevProps.vishraamSource !== vishraamSource ||
      prevProps.transliterationLanguage !== transliterationLanguage
    ) {
      this.loadShabad();
    }
  }

  componentWillUnmount() {
    this.setState = () => {
      return "";
    };
  }

  handleBackPress = () => {
    const { navigation } = this.props;
    const { goBack } = navigation;
    this.webView.postMessage(JSON.stringify({ Back: true }));
    setTimeout(() => {
      goBack();
    }, 100);
  };

  handleMessage(message) {
    const { animationPosition } = this.state;
    if (message.nativeEvent.data.includes("save")) {
      this.savePositionToProps(message);
    }
    if (message.nativeEvent.data === "toggle") {
      if (JSON.stringify(animationPosition) === "0") {
        this.toggleHeader("hide");
      } else {
        this.toggleHeader("show");
      }
    } else {
      this.toggleHeader(message.nativeEvent.data);
    }
  }

  onLayout() {
    const { paused } = this.state;
    const { autoScrollShabadSpeed } = this.props;
    let multiplier = 1.0;
    const { width, height } = Dimensions.get("window");
    if (width > height) {
      multiplier = height / width;
    }
    this.setState({
      scrollMultiplier: multiplier,
    });

    if (!paused) {
      const autoScrollSpeed = {
        autoScroll: autoScrollShabadSpeed,
        scrollMultiplier: multiplier,
      };
      this.webView.postMessage(JSON.stringify(autoScrollSpeed));
    }
  }

  setPosition() {
    const { startBani } = this.props;
    const startBaniList = JSON.parse(startBani);
    let progress = 0;
    if (startBaniList.length > 0) {
      const data = startBaniList.find((bani) => bani.id === this.currentBani.id);
      // eslint-disable-next-line prefer-destructuring
      if (data) progress = data.progress;
    }
    if (Number(progress) === 1 || Number(progress) > 1) {
      progress = 0;
    }
    this.currentBani.progress = progress;
  }

  toggleHeader(state) {
    const value = state === "hide" ? HEADER_POSITION : 0;
    const { animationPosition } = this.state;
    Animated.timing(animationPosition, {
      duration: this.slideDuration,
      useNativeDriver: false,
      toValue: value,
    }).start();
  }

  loadShabad() {
    const {
      baniLength,
      route,
      setCurrentShabad,
      larivaar,
      larivaarAssist,
      padchhedSetting,
      manglacharanPosition,
      paragraphMode,
      visram,
      vishraamOption,
      vishraamSource,
      transliterationLanguage,
    } = this.props;
    setCurrentShabad(Number(route.params.params.item.id));
    const shabadID = route.params.params.item.id;

    Database.getShabadForId(
      shabadID,
      baniLength,
      larivaar,
      larivaarAssist,
      padchhedSetting,
      manglacharanPosition,
      paragraphMode,
      visram,
      vishraamOption,
      vishraamSource,
      transliterationLanguage
    )
      .then((shabad) => {
        this.setState({
          data: shabad,
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  trackScreenForShabad(params) {
    const name = params.item.translit;
    AnalyticsManager.getInstance().trackScreenView(name, this.constructor.name);
    this.currentBani.id = params.item.id;
    this.currentBani.translit = params.item.translit;
  }

  scrollToItem(index) {
    let viewPosition;
    const { data } = this.state;
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < data.length; i++) {
      if (data[i].id <= index) {
        viewPosition = index;
      }
      if (data[i].id === index) {
        break;
      }
    }
    this.webView.postMessage(JSON.stringify({ bookmark: viewPosition }));
  }

  truncate(n) {
    return this.length > n ? `${this.substr(0, n - 1)}...` : `${this} `;
  }

  loadHTML(data, headerHeight) {
    const {
      fontSize,
      fontFace,
      nightMode,
      transliteration,
      larivaar,
      englishTranslations,
      punjabiTranslations,
      spanishTranslations,
    } = this.props;
    if (data.length > 0) {
      let html =
        "<!DOCTYPE html><html><head>" +
        "<meta name='viewport' content='width=device-width, user-scalable=no'>" +
        "<style type='text/css'>";
      const fileUri = Platform.select({
        ios: `${fontFace}.ttf`,
        android: `file:///android_asset/fonts/${fontFace}.ttf`,
      });
      html += `@font-face {
        font-family: '${fontFace}';
        src: local('${fontFace}'), url('${fileUri}') ;
        }`;

      html +=
        `${"body {background-color: "}${
          nightMode ? GLOBAL.COLOR.NIGHT_BLACK : GLOBAL.COLOR.WHITE_COLOR
        };` +
        `word-break: break-word;` +
        `color: ${nightMode ? GLOBAL.COLOR.WHITE_COLOR : GLOBAL.COLOR.NIGHT_BLACK};` +
        `padding-top: ${headerHeight}px; }`;

      html += "* { -webkit-user-select: none; }";
      html += `</style><script>${this.loadScrollJS()} </script>`;
      html += "</head><body>";
      data.forEach(function (item) {
        let textAlign = "left";
        switch (item.header) {
          case 0:
            textAlign = "left";
            break;
          case 1:
            textAlign = "center";
            break;
          case 2:
            textAlign = "center";
            break;
          default:
            textAlign = "right";
            break;
        }
        html += "<div style='padding-top: .5em'>";
        html += `<div id='${
          item.id
        }' style="padding-horizontal: .2em; font-family:'${fontFace}'; font-size: ${fontSizeForReader(
          fontSize,
          item.header,
          false,
          larivaar
        )}pt; color: ${fontColorForReader(
          item.header,
          nightMode,
          TextType.GURMUKHI
        )}; text-align: ${textAlign};margin:0.1em;margin-left:0.2em">${item.gurmukhi}</div>`;

        if (transliteration) {
          html += `<div style="padding: .2em; font-family:'Arial'; font-size: ${fontSizeForReader(
            fontSize,
            item.header,
            true
          )}pt; color: ${fontColorForReader(
            item.header,
            nightMode,
            TextType.TRANSLITERATION
          )}; text-align: ${textAlign}; font-weight: ${item.header === 0 ? "normal" : "bold"};">${
            item.translit
          }</div>`;
        }

        if (englishTranslations) {
          html += `<div style="padding: .2em; font-family:'Arial'; font-size: ${fontSizeForReader(
            fontSize,
            item.header,
            true
          )}pt; color: ${fontColorForReader(
            item.header,
            nightMode,
            TextType.ENGLISH_TRANSLATION
          )}; text-align: ${textAlign}; font-weight: ${item.header === 0 ? "normal" : "bold"};">${
            item.englishTranslations
          }</div>`;
        }

        if (punjabiTranslations) {
          html += `<div style="padding: .2em; font-family:'${fontFace}'; font-size: ${fontSizeForReader(
            fontSize,
            item.header,
            true
          )}pt; color: ${fontColorForReader(
            item.header,
            nightMode,
            TextType.ENGLISH_TRANSLATION
          )}; text-align: ${textAlign}; font-weight: ${item.header === 0 ? "normal" : "bold"};">${
            item.punjabiTranslations
          }</div>`;
        }

        if (spanishTranslations) {
          html += `<div style="padding: .2em; font-family:'Arial'; font-size: ${fontSizeForReader(
            fontSize,
            item.header,
            true
          )}pt; color: ${fontColorForReader(
            item.header,
            nightMode,
            TextType.ENGLISH_TRANSLATION
          )}; text-align: ${textAlign}; font-weight: ${item.header === 0 ? "normal" : "bold"};">${
            item.spanishTranslations
          }</div>`;
        }
        html += "</div>";
      });
      html += "</body></html>";
      return html;
    }
    return "";
  }

  loadScrollJS() {
    const listener = Platform.OS === "android" ? "document" : "window";
    const position = this.currentBani.progress;
    const { nightMode } = this.props;
    return `
    var autoScrollTimeout;
var autoScrollSpeed = 0;
var scrollMultiplier = 1.0;
var dragging = false;
var holding = false;
var holdTimer;
var curPosition = 0;
var isScrolling;
var isManuallyScrolling = false;
window.addEventListener(
  "orientationchange",
  function () {
    setTimeout(function () {
      var scrollY = (document.body.scrollHeight - window.innerHeight) * curPosition;
      window.scrollTo(0, scrollY);
      curPosition = scrollY;
    }, 50);
  },
  false
);

(function scrollToPosition() {
  setTimeout(function () {
    var scrollY = (document.body.scrollHeight - window.innerHeight) * ${position};
    window.scrollTo(0, scrollY);
    curPosition = scrollY;
  }, 50);
})();

function getScrollPercent() {
  return window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
}

//  Listen for scroll events
window.addEventListener(
  "scroll",
  function (event) {
    // Clear our timeout throughout the scroll
    window.clearTimeout(isScrolling);
    // Set a timeout to run after scrolling ends
    isScrolling = setTimeout(function () {
      isManuallyScrolling = false;
    }, 66);
  },
  false
);

if (${nightMode}) {
  //fade event
  window.addEventListener("load", fadeInEffect(), false);

  function fadeInEffect() {
    var fadeTarget = document.getElementsByTagName("HTML")[0];
    fadeTarget.style.opacity = 0;
    var fadeEffect = setInterval(function () {
      if (Number(fadeTarget.style.opacity) < 1) {
        fadeTarget.style.opacity = Number(fadeTarget.style.opacity) + 0.1;
        console.log(fadeTarget.style.opacity);
      } else {
        fadeTarget.style.opacity = 1;
      }
    }, 100);
  }
}
function setAutoScroll() {
  var speed = autoScrollSpeed;
  if (speed > 0) {
    if (!isManuallyScrolling) {
      window.scrollBy({
        behavior: "auto",
        left: 0,
        top: 1,
      });
    }
    autoScrollTimeout = setTimeout(function () {
      setAutoScroll();
    }, (200 - speed * 2) / scrollMultiplier);
  } else {
    clearScrollTimeout();
  }
}

function clearScrollTimeout() {
  if (autoScrollTimeout != null) {
    clearTimeout(autoScrollTimeout);
  }
  autoScrollTimeout = null;
}

function scrollFunc(e) {
  curPosition = getScrollPercent();
  if (window.scrollY == 0) {
    window.ReactNativeWebView.postMessage("show");
  }

  if (typeof scrollFunc.y == "undefined") {
    scrollFunc.y = window.pageYOffset;
  }
  if (autoScrollSpeed == 0) {
    var diffY = scrollFunc.y - window.pageYOffset;
    if (diffY < 0) {
      // Scroll down
      if (diffY < -3) {
        window.ReactNativeWebView.postMessage("hide");
      }
    } else if (diffY > 5) {
      // Scroll up
      window.ReactNativeWebView.postMessage("show");
    }
  }
  scrollFunc.y = window.pageYOffset;
}
window.onscroll = scrollFunc;

window.addEventListener("touchstart", function () {
  if (autoScrollSpeed !== 0) {
    clearScrollTimeout();
  }
  dragging = false;
  holding = false;
  holdTimer = setTimeout(function () {
    holding = true;
  }, 125); // Longer than 125 milliseconds is not a tap
});
window.addEventListener("touchmove", function () {
  isManuallyScrolling = true;
  dragging = true;
});
window.addEventListener("touchend", function () {
  if (autoScrollSpeed !== 0 && autoScrollTimeout === null) {
    setTimeout(function () {
      window.ReactNativeWebView.postMessage("hide");
    }, 5000);
    setAutoScroll();
  }
  if (!dragging && !holding) {
    window.ReactNativeWebView.postMessage("toggle");
  }
  clearTimeout(holdTimer);
  dragging = false;
  holding = false;
});

${listener}.addEventListener(
  "message",
  function (event) {
    var message = JSON.parse(event.data);

    if (message.hasOwnProperty("Back")) {
      currentPosition = getScrollPercent();
      window.ReactNativeWebView.postMessage("save-" + currentPosition);
    }

    if (message.hasOwnProperty("bookmark")) {
      location.hash = "#" + message.bookmark;
      setTimeout(() => {
        window.ReactNativeWebView.postMessage("hide");
      }, 50);
    }
    if (message.hasOwnProperty("autoScroll")) {
      autoScrollSpeed = message.autoScroll;
      scrollMultiplier = message.scrollMultiplier;
      if (autoScrollSpeed !== 0) {
        setTimeout(() => {
          window.ReactNativeWebView.postMessage("toggle");
        }, 5000);
      }
      if (autoScrollTimeout == null) {
        setAutoScroll();
      }
    }
  },
  false
);
      `;
  }

  savePositionToProps(message) {
    const { startBani, setStartBani } = this.props;
    const { data } = message.nativeEvent;
    const position = data.split("-")[1];

    const startBaniList = JSON.parse(startBani);
    if (startBaniList.length === 0) {
      this.currentBani.progress = position;
      startBaniList.push(this.currentBani);
    } else {
      let isFound = false;
      startBaniList.forEach((element) => {
        if (element.id === this.currentBani.id) {
          isFound = true;
        }
      });
      if (isFound) {
        startBaniList.forEach((element) => {
          if (element.id === this.currentBani.id) {
            // eslint-disable-next-line no-param-reassign
            element.progress = position;
          }
        });
      } else {
        this.currentBani.progress = position;
        startBaniList.push(this.currentBani);
      }
    }
    setStartBani(JSON.stringify(startBaniList));
  }

  render() {
    const {
      route,
      nightMode,
      transliteration,
      fontFace,
      navigation,
      autoScroll,
      autoScrollShabadSpeed,
      currentShabad,
      setAutoScrollSpeed,
    } = this.props;
    const { data, animationPosition, scrollMultiplier, paused, orientation, viewLoaded } =
      this.state;
    const { navigate } = navigation;
    const { params } = route.params;
    this.trackScreenForShabad(params);
    const styles = StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: "#fff",
      },
      header: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
        backgroundColor: "transparent",
      },
      footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
        backgroundColor: "transparent",
      },
    });
    const {
      READER_STATUS_BAR_COLOR_NIGHT_MODE,
      READER_STATUS_BAR_COLOR,
      READER_HEADER_COLOR,
      TOOLBAR_TINT,
      READER_FOOTER_COLOR,
    } = GLOBAL.COLOR;
    if (!this.headerHeight || this.headerHeight <= 55) {
      this.headerHeight = 74;
    }
    const isPortrait = orientation === CONSTANT.PORTRAIT;
    return (
      <SafeAreaView
        style={[styles.container, nightMode && { backgroundColor: GLOBAL.COLOR.NIGHT_BLACK }]}
        onLayout={this.onLayout.bind(this)}
      >
        <WebView
          originWhitelist={["*"]}
          style={[
            nightMode && {
              backgroundColor: GLOBAL.COLOR.NIGHT_BLACK,
              opacity: viewLoaded ? 1 : 0.1,
            },
          ]}
          onLoadStart={() => {
            setTimeout(() => {
              this.setState({ viewLoaded: true });
            }, 500);
          }}
          ref={(webView) => {
            this.webView = webView;
          }}
          decelerationRate="normal"
          source={{
            html: this.loadHTML(data, this.headerHeight),
            baseUrl: "",
          }}
          onMessage={this.handleMessage.bind(this)}
        />
        <Animated.View
          style={[
            styles.header,
            { position: "absolute", top: animationPosition },
            nightMode && { opacity: viewLoaded ? 1 : 0.2 },
          ]}
        >
          <StatusBar
            backgroundColor={
              nightMode ? READER_STATUS_BAR_COLOR_NIGHT_MODE : READER_STATUS_BAR_COLOR
            }
            barStyle={nightMode || Platform.OS === "android" ? "light-content" : "dark-content"}
          />
          <View style={{ backgroundColor: READER_HEADER_COLOR, height: 90 }}>
            <View
              style={{ flex: 1, flexDirection: "row", top: 50, justifyContent: "space-between" }}
            >
              <Icon
                name="arrow-back"
                color={TOOLBAR_TINT}
                size={30}
                style={[{ left: 10 }]}
                onPress={this.handleBackPress.bind(this)}
              />
              <Text
                style={{
                  color: TOOLBAR_TINT,
                  fontFamily: transliteration ? null : fontFace,
                  fontSize: 20,
                  textAlign: "center",
                }}
              >
                {transliteration
                  ? this.truncate.apply(params.item.translit, [isPortrait ? 24 : 48])
                  : this.truncate.apply(params.item.gurmukhi, [isPortrait ? 25 : 50])}
              </Text>
              <View style={{ flexDirection: "row" }}>
                <Icon
                  name="settings"
                  color={TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    const autoScrollSpeed = {
                      autoScroll: 0,
                      scrollMultiplier,
                    };
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                    this.setState({
                      paused: true,
                    });
                    navigate("Settings");
                  }}
                />
                <Icon
                  name="bookmark"
                  color={TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    this.trackScreenForShabad(params);
                    navigate("Bookmarks");
                  }}
                />
              </View>
            </View>
          </View>
        </Animated.View>
        {autoScroll && (
          <Animated.View
            style={[
              styles.footer,
              {
                position: "absolute",
                bottom: animationPosition,
                paddingBottom: 25,
                backgroundColor: READER_FOOTER_COLOR,
              },
            ]}
          >
            <View style={{ flexDirection: "row" }}>
              {paused && (
                <Icon
                  style={{ paddingTop: 15, paddingLeft: 25, width: 55 }}
                  name="play-arrow"
                  color={GLOBAL.COLOR.TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    let scrollSpeed = autoScrollShabadSpeed[currentShabad]
                      ? autoScrollShabadSpeed[currentShabad]
                      : 50;
                    if (scrollSpeed === 0) {
                      scrollSpeed = 1;
                      setAutoScrollSpeed(scrollSpeed, currentShabad);
                    }
                    const autoScrollSpeed = {
                      autoScroll: scrollSpeed,
                      scrollMultiplier,
                    };
                    this.setState({
                      paused: false,
                    });
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                  }}
                />
              )}
              {!paused && (
                <Icon
                  style={{ paddingTop: 15, paddingLeft: 25, width: 55 }}
                  name="pause"
                  color={GLOBAL.COLOR.TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    const autoScrollSpeed = {
                      autoScroll: 0,
                      scrollMultiplier,
                    };
                    this.setState({
                      paused: true,
                    });
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                  }}
                />
              )}
              <Slider
                style={[{ flex: 1, marginLeft: 25, marginRight: 25, marginTop: 10 }]}
                minimumTrackTintColor={GLOBAL.COLOR.SLIDER_TRACK_MIN_TINT}
                maximumTrackTintColor={GLOBAL.COLOR.SLIDER_TRACK_MAX_TINT}
                thumbTintColor={GLOBAL.COLOR.WHITE_COLOR}
                minimumValue={1}
                maximumValue={100}
                step={1}
                value={autoScrollShabadSpeed[currentShabad] || 50}
                onValueChange={(value) => {
                  setAutoScrollSpeed(value, currentShabad);
                  const speed = value;

                  if (speed === 0) {
                    this.setState({ paused: true });
                  } else {
                    this.setState({ paused: false });
                  }

                  const autoScrollSpeed = {
                    autoScroll: speed,
                    scrollMultiplier,
                  };
                  this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                }}
                onSlidingComplete={(value) => {
                  AnalyticsManager.getInstance().trackReaderEvent("autoScrollSpeed", value);
                }}
              />
              <Text
                style={{
                  color: GLOBAL.COLOR.TOOLBAR_TINT,
                  paddingTop: 20,
                  paddingRight: 20,
                }}
              >
                {autoScrollShabadSpeed[currentShabad] ? autoScrollShabadSpeed[currentShabad] : 50}
              </Text>
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    );
  }
}

Reader.defaultProps = { currentShabad: null };

Reader.propTypes = {
  setScrollIndex: PropTypes.func.isRequired,
  scrollIndex: PropTypes.number.isRequired,
  baniLength: PropTypes.string.isRequired,
  larivaar: PropTypes.bool.isRequired,
  larivaarAssist: PropTypes.bool.isRequired,
  paragraphMode: PropTypes.bool.isRequired,
  manglacharanPosition: PropTypes.string.isRequired,
  padchhedSetting: PropTypes.string.isRequired,
  visram: PropTypes.bool.isRequired,
  vishraamOption: PropTypes.string.isRequired,
  vishraamSource: PropTypes.string.isRequired,
  transliterationLanguage: PropTypes.string.isRequired,
  navigation: PropTypes.shape().isRequired,
  autoScrollShabadSpeed: PropTypes.shape().isRequired,
  startBani: PropTypes.string.isRequired,
  currentShabad: PropTypes.number,
  fontSize: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  nightMode: PropTypes.bool.isRequired,
  transliteration: PropTypes.bool.isRequired,
  englishTranslations: PropTypes.bool.isRequired,
  punjabiTranslations: PropTypes.bool.isRequired,
  spanishTranslations: PropTypes.bool.isRequired,
  setStartBani: PropTypes.func.isRequired,
  route: PropTypes.shape().isRequired,
  autoScroll: PropTypes.bool.isRequired,
  setAutoScrollSpeed: PropTypes.func.isRequired,
  setCurrentShabad: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    currentShabad: state.currentShabad,
    scrollIndex: state.scrollIndex,
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    baniLength: state.baniLength,
    larivaar: state.larivaar,
    larivaarAssist: state.larivaarAssist,
    padchhedSetting: state.padchhedSetting,
    manglacharanPosition: state.manglacharanPosition,
    englishTranslations: state.englishTranslations,
    punjabiTranslations: state.punjabiTranslations,
    spanishTranslations: state.spanishTranslations,
    paragraphMode: state.paragraphMode,
    autoScroll: state.autoScroll,
    autoScrollShabadSpeed: state.autoScrollShabadSpeed,
    visram: state.visram,
    vishraamOption: state.vishraamOption,
    vishraamSource: state.vishraamSource,
    startBani: state.startBani,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Reader);
