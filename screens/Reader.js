import React from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  Platform,
  Text,
  StatusBar,
} from "react-native";
import { WebView } from "react-native-webview";
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
  TextType,
} from "../utils/helpers";
import * as actions from "../actions/actions";
import AnalyticsManager from "../utils/analytics";
import {Navigator} from 'react'

const HEADER_POSITION = -120; // From react-native-elements Header source
class Reader extends React.Component {

  currentBani = {
    id: 0,
    translit: '',
    progress: 0
  }
  constructor(props) {
    super(props);

    this.state = {
      data: [],
      paused: true,
      scrollMultiplier: 1.0,
      isLoading: false,
      animationPosition: new Animated.Value(0), // The header and footer position
      headerHeight: 0,
    };

    // How long does the slide animation take
    this.slideDuration = 200;
    this.webView = null;
  }

  toggleHeader(state) {
    Animated.timing(this.state.animationPosition, {
      duration: this.slideDuration,
      useNativeDriver: false,
      toValue: state == "hide" ? HEADER_POSITION : 0,
    }).start();

    StatusBar.setHidden(state == "hide", 'fade');
  }

  loadShabad() {
    Database.getShabadForId(
      this.props.currentShabad,
      this.props.baniLength,
      this.props.larivaar,
      this.props.larivaarAssist,
      this.props.padchhedSetting,
      this.props.manglacharanPosition,
      this.props.paragraphMode,
      this.props.visram,
      this.props.vishraamOption,
      this.props.vishraamSource,
      this.props.transliterationLanguage
    ).then((shabad) => {
      this.setState({
        data: shabad,
        isLoading: false,
      });
    }).catch(error => {
      console.log(error);
    });
  }

  componentDidMount() {
    this.loadShabad();
    this.setPosition();

  }

  setPosition() {
    const startBaniList = JSON.parse(this.props.startBani);
    let progress = 0;
    if (startBaniList.length > 0) {
      for (const bani of startBaniList) {
        if (bani.id == this.currentBani.id) {
            progress = bani.progress;
        }
      }
    }
    if(Number(progress)==1 || Number(progress)>"1"){
      progress=0
    }
    this.currentBani.progress = progress;
  }

  handleBackPress=()=> {
   this.webView.postMessage(JSON.stringify({ Back: true }));
    setTimeout(()=>{this.props.navigation.goBack();},100);
  }


  componentDidUpdate(prevProps) {
    if (
      prevProps.baniLength != this.props.baniLength ||
      prevProps.larivaar != this.props.larivaar ||
      prevProps.larivaarAssist != this.props.larivaarAssist ||
      prevProps.paragraphMode != this.props.paragraphMode ||
      prevProps.manglacharanPosition != this.props.manglacharanPosition ||
      prevProps.padchhedSetting != this.props.padchhedSetting ||
      prevProps.visram != this.props.visram ||
      prevProps.vishraamOption != this.props.vishraamOption ||
      prevProps.vishraamSource != this.props.vishraamSource ||
      prevProps.transliterationLanguage != this.props.transliterationLanguage
    ) {
      this.loadShabad();
    }
  }

  trackScreenForShabad(params) {
    const name = params.item.translit
    AnalyticsManager.getInstance().trackScreenView(name, this.constructor.name);
    this.currentBani.id = params.item.id
    this.currentBani.translit = params.item.translit
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
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

  loadHTML(data, headerHeight) {
    if (data.length > 0) {
      let fontSize = this.props.fontSize;
      let fontFace = this.props.fontFace;
      let nightMode = this.props.nightMode;
      let transliteration = this.props.transliteration;
      let larivaar=this.props.larivaar;
      let larivaarAssist=this.props.larivaarAssist
      let englishTranslations = this.props.englishTranslations;
      let punjabiTranslations = this.props.punjabiTranslations;
      let spanishTranslations = this.props.spanishTranslations;
      
      var html =
        "<!DOCTYPE html><html><head>" +
        "<meta name='viewport' content='width=device-width, user-scalable=no'>" +
        "<style type='text/css'>";
      let fileUri = Platform.select({
        ios: `${fontFace}.ttf`,
        android: `file:///android_asset/fonts/${fontFace}.ttf`,
      });
      html +=
        `@font-face {
        font-family: '${fontFace}';
        src: local('${fontFace}'), url('${fileUri}') ;
        }` ;

      html +=
        "body { " +
        "background-color: " +
        (nightMode ? "#000" : "#fff") +
        ";" +
        "word-break: break-word;" +
        "color: " +
        (nightMode ? "#fff" : "#000") +
        ";" +
        "padding-top: " +
        headerHeight +
        "px; }";
      html += "* { -webkit-user-select: none; }";
      html += "</style><script>" + this.loadScrollJS() + "</script>";
      html += "</head><body>";

      data.forEach(function (item) {
        html += "<div style='padding-top: .5em'>";
        html +=
          "<div id='" +
          item.id +
          "' style=\"padding: .2em; font-family:'" +
          fontFace +
          "'; font-size: " +
          fontSizeForReader(fontSize, item.header, false,larivaar) +
          "pt; color: " +
          fontColorForReader(item.header, nightMode, TextType.GURMUKHI) +
          "; text-align: " +
          (item.header === 0
            ? "left"
            : item.header === 1 || item.header === 2
              ? "center"
              : "right") +
          ';margin:0.1em;margin-left:0.2em">' +
          item.gurmukhi +
          "</div>";

        if (transliteration) {
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
            item.translit +
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

        if (punjabiTranslations) {
          html +=
            "<div style=\"padding: .2em; font-family:'" +
            fontFace +
            "'; font-size: " +
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
            item.punjabiTranslations +
            "</div>";
        }

        if (spanishTranslations) {
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
            item.spanishTranslations +
            "</div>";
        }
        html += "</div>";
      });
      html += "</body></html>";
      return html;
    }
  }

  loadScrollJS() {
    let listener = Platform.OS === "android" ? "document" : "window";
    const position = this.currentBani.progress
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
    window.addEventListener("orientationchange", function() {
      setTimeout(function(){        
        let scrollY = (document.body.scrollHeight - window.innerHeight) * curPosition;
        window.scrollTo(0, scrollY);
        curPosition = scrollY;
        
      }, 50);
    }, false);

    (function scrollToPosition(){
      setTimeout(function(){        
        let scrollY = (document.body.scrollHeight - window.innerHeight) * ${position};
        window.scrollTo(0, scrollY);
        curPosition = scrollY;
        
      }, 50);

    })();
    function getScrollPercent() {
      return (window.pageYOffset / (document.body.scrollHeight - window.innerHeight));
    }

    // Listen for scroll events
    window.addEventListener('scroll', function ( event ) {
      // Clear our timeout throughout the scroll
      window.clearTimeout( isScrolling );
      // Set a timeout to run after scrolling ends
      isScrolling = setTimeout(function() {
        isManuallyScrolling = false;
      }, 66);

    }, false);

    function setAutoScroll() {
      let speed = autoScrollSpeed;
      if(speed > 0) {
        if(!isManuallyScrolling) {
          window.scrollBy({
            behavior: "auto",
            left: 0,
            top: 1
          }); 
        }
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
      curPosition = getScrollPercent();
      if (window.scrollY == 0) { window.ReactNativeWebView.postMessage('show'); }
        
      if (typeof scrollFunc.y == 'undefined') {
            scrollFunc.y = window.pageYOffset;
        }
        if(autoScrollSpeed == 0) {
        var diffY = scrollFunc.y - window.pageYOffset;
        if(diffY < 0) {
            // Scroll down
            if(diffY < -3) {
              window.ReactNativeWebView.postMessage('hide');
            } 
        } else if(diffY > 5) {
            // Scroll up
            window.ReactNativeWebView.postMessage('show');
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
      isManuallyScrolling = true;
      dragging = true;
    });
    window.addEventListener('touchend', function() {
      if(autoScrollSpeed != 0 && autoScrollTimeout == null) {
        setAutoScroll();
      }
      if(!dragging && !holding)   
      {
        window.ReactNativeWebView.postMessage('toggle');
      }
      clearTimeout(holdTimer);
      dragging = false;
      holding = false;
    });

    ${listener}.addEventListener("message", function(event) {
      let message = JSON.parse(event.data);

      if(message.hasOwnProperty('Back')){
        currentPosition=getScrollPercent();
        window.ReactNativeWebView.postMessage("save-"+currentPosition);
      }
   
      if(message.hasOwnProperty('bookmark')){
        location.hash = "#" + message.bookmark;
        setTimeout(function() { window.ReactNativeWebView.postMessage('hide'); }, 50);
      } 
      if(message.hasOwnProperty('autoScroll')){ 
        autoScrollSpeed = message.autoScroll;
        scrollMultiplier = message.scrollMultiplier;
        
        if(autoScrollTimeout == null) {
          setAutoScroll();
        }
      }
    }, false);
      `;
  }
  savePositionToProps(message) {
    let data = message.nativeEvent.data
    let position = data.split('-')[1]

    const startBaniList = JSON.parse(this.props.startBani)
      if (startBaniList.length == 0) {
        this.currentBani.progress = position
        startBaniList.push(this.currentBani)
      }
      else {
        let isFound = false
        startBaniList.forEach(element => {
          if (element.id == this.currentBani.id) {
            isFound = true
          }
        });
        if (isFound) {
          startBaniList.forEach(element => {
            if (element.id == this.currentBani.id) {

              element.progress = position
            }
          })
        }
        else {
          this.currentBani.progress = position
          startBaniList.push(this.currentBani)
        }
      }
    this.props.setStartBani(JSON.stringify(startBaniList))
  }

  handleMessage(message) {
    if (message.nativeEvent.data.includes('save')) {
      this.savePositionToProps(message)
    }


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
      scrollMultiplier: multiplier,
    });

    if (!this.state.paused) {
      let autoScrollSpeed = {
        autoScroll: this.props.autoScrollShabadSpeed,
        scrollMultiplier: multiplier,
      };
      this.webView.postMessage(JSON.stringify(autoScrollSpeed));
    }
  }
  componentWillUnmount() {
    this.setState = (state, callback) => {
      return;
    };
  }

  render() {
    const { params } = this.props.route.params;
    {
      this.trackScreenForShabad(params);
    }

    return (
      <View
        style={[
          styles.container,
          this.props.nightMode && { backgroundColor: "#000" },
        ]}
        onLayout={this.onLayout.bind(this)}>
        <LoadingIndicator isLoading={this.state.isLoading} />

        <WebView
          originWhitelist={["*"]}
          style={this.props.nightMode && { backgroundColor: "#000" }}
          ref={(webView) => (this.webView = webView)}
          decelerationRate='normal'
          source={{
            html: this.loadHTML(this.state.data, this.headerHeight),
            baseUrl: "",
          }}
          onMessage={this.handleMessage.bind(this)}
        />

        <Animated.View
          style={[
            styles.header,
            { position: "absolute", top: this.state.animationPosition },
          ]}>
          <StatusBar
            backgroundColor={
              this.props.nightMode
                ? GLOBAL.COLOR.READER_STATUS_BAR_COLOR_NIGHT_MODE
                : GLOBAL.COLOR.READER_STATUS_BAR_COLOR
            }
            barStyle={
              this.props.nightMode ||
                Platform.OS === "android"
                ? "light-content"
                : "dark-content"
            }
          />
          <Header
            backgroundColor={GLOBAL.COLOR.READER_HEADER_COLOR}
            containerStyle={[
              Platform.OS === "android" && { height: 86, paddingTop: 0 },
            ]}
            onLayout={(event) => {
              this.headerHeight = event.nativeEvent.layout.height;
            }}
            leftComponent={
              <Icon
                name="arrow-back"
                color={GLOBAL.COLOR.TOOLBAR_TINT}
                size={30}
                onPress={this.handleBackPress.bind(this)}
              />
            }
            centerComponent={{
              text: this.props.transliteration
                ? this.truncate.apply(params.item.translit, [24])
                : this.truncate.apply(params.item.gurmukhi, [25]),
              style: {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontFamily: this.props.transliteration
                  ? null
                  : this.props.fontFace,
                fontSize: 20,
              },
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
                      scrollMultiplier: this.state.scrollMultiplier,
                    };
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                    this.setState({
                      paused: true,
                    });
                    this.props.navigation.navigate('Settings');
                  }}
                />
                <Icon
                  style={{ paddingLeft: 15 }}
                  name="bookmark"
                  color={GLOBAL.COLOR.TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    this.trackScreenForShabad(
                      params
                    );
                    this.props.navigation.navigate('Bookmarks');
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
                paddingBottom: 25,
                backgroundColor: GLOBAL.COLOR.READER_FOOTER_COLOR,
              },
            ]}>
            <View style={{ flexDirection: "row" }}>
              {this.state.paused && (
                <Icon
                  style={{ paddingTop: 15, paddingLeft: 25, width: 55 }}
                  name="play-arrow"
                  color={GLOBAL.COLOR.TOOLBAR_TINT}
                  size={30}
                  onPress={() => {
                    var scrollSpeed = this.props.autoScrollShabadSpeed[
                      this.props.currentShabad
                    ]
                      ? this.props.autoScrollShabadSpeed[
                      this.props.currentShabad
                      ]
                      : 50;
                    if (scrollSpeed == 0) {
                      scrollSpeed = 1;
                      this.props.setAutoScrollSpeed(
                        scrollSpeed,
                        this.props.currentShabad
                      );
                    }
                    let autoScrollSpeed = {
                      autoScroll: scrollSpeed,
                      scrollMultiplier: this.state.scrollMultiplier,
                    };
                    this.setState({
                      paused: false,
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
                      scrollMultiplier: this.state.scrollMultiplier,
                    };
                    this.setState({
                      paused: true,
                    });
                    this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                  }}
                />
              )}
              <Slider
                style={[
                  { flex: 1, marginLeft: 25, marginRight: 25, marginTop: 10 },
                ]}
                minimumTrackTintColor={"#BFBFBF"}
                maximumTrackTintColor={"#464646"}
                thumbTintColor={"#fff"}
                minimumValue={0}
                maximumValue={100}
                step={1}
                value={
                  this.props.autoScrollShabadSpeed[this.props.currentShabad]
                    ? this.props.autoScrollShabadSpeed[this.props.currentShabad]
                    : 50
                }
                onValueChange={(value) => {
                  this.props.setAutoScrollSpeed(
                    value,
                    this.props.currentShabad
                  );
                  let speed = value;
                  speed === 0
                    ? this.setState({ paused: true })
                    : this.setState({ paused: false });
                  let autoScrollSpeed = {
                    autoScroll: speed,
                    scrollMultiplier: this.state.scrollMultiplier,
                  };
                  this.webView.postMessage(JSON.stringify(autoScrollSpeed));
                }}
                onSlidingComplete={(value) => {
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
                  paddingRight: 20,
                }}>
                {this.props.autoScrollShabadSpeed[this.props.currentShabad]
                  ? this.props.autoScrollShabadSpeed[this.props.currentShabad]
                  : 50}
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

function mapStateToProps(state) {
  return {
    nightMode: state.nightMode,
    currentShabad: state.currentShabad,
    scrollIndex: state.scrollIndex,
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
    fontSize: state.fontSize,
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Reader);
