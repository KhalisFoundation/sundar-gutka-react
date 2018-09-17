import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  WebView,
  Platform,
  Text
} from "react-native";
import { connect } from "react-redux";
import { Header, Slider } from "react-native-elements";
import { bindActionCreators } from "redux";
import Icon from "react-native-vector-icons/MaterialIcons";
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

const HEADER_POSITION = -120; // From react-native-elements Header source
class Reader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      paused: true,
      scrollMultiplier: 1.0,
      isLoading: false,
      animationPosition: new Animated.Value(0), // The header and footer position
      visible: true // Is the header currently visible
    };

    // How long does the slide animation take
    this.slideDuration = 200;
    this.webView = null;
  }

  toggleHeader(state) {
    Animated.timing(this.state.animationPosition, {
      duration: this.slideDuration,
      toValue: state == "hide" ? HEADER_POSITION : 0
    }).start();
  }

  loadShabad() {
    Database.getShabadForId(
      this.props.currentShabad,
      this.props.baniLength,
      this.props.larivaar,
      this.props.padchhedSetting,
      this.props.manglacharanPosition,
      this.props.paragraphMode,
      this.props.visram
    ).then(shabad => {
      this.setState({
        data: shabad,
        isLoading: false
      });
    });
  }

  componentWillMount() {
    this.loadShabad();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.baniLength != this.props.baniLength ||
      prevProps.larivaar != this.props.larivaar ||
      prevProps.paragraphMode != this.props.paragraphMode ||
      prevProps.manglacharanPosition != this.props.manglacharanPosition ||
      prevProps.padchhedSetting != this.props.padchhedSetting ||
      prevProps.visram != this.props.visram
    ) {
      this.loadShabad();
    }
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

    this.webView.postMessage(JSON.stringify({ bookmark: viewPosition }));
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
      html += "* { -webkit-user-select: none; }";
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
          "pt; color: " +
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
            "pt; color: " +
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
            "pt; color: " +
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
    var autoScrollTimeout;
    var autoScrollSpeed = 0;
    var scrollMultiplier = 1.0;
    var dragging = false;
    var holding = false;
    var holdTimer;
    function setAutoScroll() {
      let speed = autoScrollSpeed;
      if(speed > 0) {
        window.scrollBy({
          behavior: "auto",
          left: 0,
          top: 1
        }); 
        autoScrollTimeout = setTimeout(function() {setAutoScroll()},(200-speed*2)/scrollMultiplier);
      } else {
        clearScrollTimeout();
      }
    }
    
    function clearScrollTimeout() {
      if(autoScrollTimeout != null) {
        clearTimeout(autoScrollTimeout);
      }
      autoScrollTimeout = null;
    }
    function scrollFunc(e) {
      if (window.scrollY == 0) { window.postMessage('show'); }
        
      if (typeof scrollFunc.y == 'undefined') {
            scrollFunc.y = window.pageYOffset;
        }
        if(autoScrollSpeed == 0) {
        var diffY = scrollFunc.y - window.pageYOffset;
        if(diffY < 0) {
            // Scroll down
            if(diffY < -3) {
              window.postMessage('hide');
            } 
        } else if(diffY > 5) {
            // Scroll up
            window.postMessage('show');
        }
      }
        scrollFunc.y = window.pageYOffset;
    }
    window.onscroll = scrollFunc;

    window.addEventListener('touchstart', function() {
      if(autoScrollSpeed != 0) {
        clearScrollTimeout();
      }
      dragging = false;
      holding = false;
      holdTimer = setTimeout(function() {holding = true}, 125); // Longer than 125 milliseconds is not a tap
    });
    window.addEventListener('touchmove', function() {
      dragging = true;
    });
    window.addEventListener('touchend', function() {
      if(autoScrollSpeed != 0 && autoScrollTimeout == null) {
        setAutoScroll();
      }
      if(!dragging && !holding)   
      {
        window.postMessage('toggle');
      }
      clearTimeout(holdTimer);
      dragging = false;
      holding = false;
    });

    document.addEventListener("message", function(event) {
      let message = JSON.parse(event.data);
      if(message.hasOwnProperty('bookmark')){
        location.hash = "#" + message.bookmark;
        setTimeout(function() { window.postMessage('hide'); }, 50);
      } else if(message.hasOwnProperty('autoScroll')){ 
        autoScrollSpeed = message.autoScroll;
        scrollMultiplier = message.scrollMultiplier;
        
        if(autoScrollTimeout == null) {
          setAutoScroll();
        }
      }
    }, false);
      `;
  }

  handleMessage(message) {
    if (message.nativeEvent.data === "toggle") {
      if (JSON.stringify(this.state.animationPosition) == 0) {
        this.toggleHeader("hide");
      } else {
        this.toggleHeader("show");
      }
    } else {
      this.toggleHeader(message.nativeEvent.data);
    }
  }

  onLayout(e) {
    var multiplier = 1.0;
    const { width, height } = Dimensions.get("window");
    if (width > height) {
      multiplier = height / width;
    }
    this.setState({
      scrollMultiplier: multiplier
    });

    if (!this.state.paused) {
      let autoScrollSpeed = {
        autoScroll: this.props.autoScrollShabadSpeed,
        scrollMultiplier: multiplier
      };
      this.webView.postMessage(JSON.stringify(autoScrollSpeed));
    }
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
        onLayout={this.onLayout.bind(this)}
      >
        <LoadingIndicator isLoading={this.state.isLoading} />

        <WebView
          originWhitelist={['*']}
          style={this.props.nightMode && { backgroundColor: "#000" }}
          ref={webView => (this.webView = webView)}
          source={{
            html: this.loadHTML(this.state.data),
            baseUrl: ""
          }}
          onMessage={this.handleMessage.bind(this)}
        />

        <Animated.View
          style={[
            styles.header,
            { position: "absolute", top: this.state.animationPosition }
          ]}
        >
          <Header
            outerContainerStyles={{ borderBottomWidth: 0 }}
            backgroundColor={GLOBAL.COLOR.READER_HEADER_COLOR}
            leftComponent={
              <Icon
                name="arrow-back"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={() => this.props.navigation.goBack()}
              />
            }
            centerComponent={{
              text: this.props.romanized
                ? this.truncate.apply(params.item.roman, [24])
                : this.truncate.apply(params.item.gurmukhi, [25]),
              style: {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontFamily: this.props.romanized ? null : this.props.fontFace,
                fontSize: 20
              }
            }}
            rightComponent={
              <View style={{ flexDirection: "row" }}>
                <Icon
                  name="settings"
                  color={GLOBAL.COLOR.TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    let autoScrollSpeed = {
                      autoScroll: 0,
                      scrollMultiplier: this.state.scrollMultiplier
                    };
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                    this.setState({
                      paused: true
                    });
                    this.props.navigation.navigate({
                      key: "Settings",
                      routeName: "Settings"
                    });
                  }}
                />
                <Icon
                  style={{ paddingLeft: 15 }}
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
              </View>
            }
          />
        </Animated.View>

        {this.props.autoScroll && (
          <Animated.View
            style={[
              styles.footer,
              {
                position: "absolute",
                bottom: this.state.animationPosition,
                paddingBottom: 10,
                backgroundColor: GLOBAL.COLOR.READER_FOOTER_COLOR
              }
            ]}
          >
            <View style={{ flexDirection: "row" }}>
              {this.state.paused && (
                <Icon
                  style={{ paddingTop: 15, paddingLeft: 25, width: 55 }}
                  name="play-arrow"
                  color={GLOBAL.COLOR.TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    var scrollSpeed = this.props.autoScrollShabadSpeed[this.props.currentShabad] ? this.props.autoScrollShabadSpeed[this.props.currentShabad] : 50;
                    if (scrollSpeed == 0) {
                      scrollSpeed = 1;
                      this.props.setAutoScrollSpeed(scrollSpeed, this.props.currentShabad);
                    }
                    let autoScrollSpeed = {
                      autoScroll: scrollSpeed,
                      scrollMultiplier: this.state.scrollMultiplier
                    };
                    this.setState({
                      paused: false
                    });
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                  }}
                />
              )}
              {!this.state.paused && (
                <Icon
                  style={{ paddingTop: 15, paddingLeft: 25, width: 55 }}
                  name="pause"
                  color={GLOBAL.COLOR.TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    let autoScrollSpeed = {
                      autoScroll: 0,
                      scrollMultiplier: this.state.scrollMultiplier
                    };
                    this.setState({
                      paused: true
                    });
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                  }}
                />
              )}
              <Slider
                style={[
                  { flex: 1, marginLeft: 25, marginRight: 25, marginTop: 10 }
                ]}
                minimumTrackTintColor={"#BFBFBF"}
                maximumTrackTintColor={"#464646"}
                thumbTintColor={"#fff"}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={this.props.autoScrollShabadSpeed[this.props.currentShabad] ? this.props.autoScrollShabadSpeed[this.props.currentShabad] : 50}
                onValueChange={value => {
                  this.props.setAutoScrollSpeed(value, this.props.currentShabad);
                  let speed = value;
                  speed === 0
                    ? this.setState({ paused: true })
                    : this.setState({ paused: false });
                  let autoScrollSpeed = {
                    autoScroll: speed,
                    scrollMultiplier: this.state.scrollMultiplier
                  };
                  this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                }}
                onSlidingComplete={value => {
                  AnalyticsManager.getInstance().trackReaderEvent(
                    "autoScrollSpeed",
                    value
                  );
                }}
              />
             <Text
                style={{
                  color: GLOBAL.COLOR.TOOLBAR_TINT,
                  paddingTop: 20,
                  paddingRight: 20
                }}
              >
                {this.props.autoScrollShabadSpeed[this.props.currentShabad] ? this.props.autoScrollShabadSpeed[this.props.currentShabad] : 50}
              </Text>
            </View>
          </Animated.View>
        )}
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
  },
  footer: {
    position: "absolute",
    bottom: 0,
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
    paragraphMode: state.paragraphMode,
    autoScroll: state.autoScroll,
    autoScrollShabadSpeed: state.autoScrollShabadSpeed,
    visram: state.visram
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Reader);
