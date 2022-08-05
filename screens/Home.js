import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import KeepAwake from "react-native-keep-awake";
import { SafeAreaView, View, Text, StatusBar, Platform } from "react-native";
import { Header } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import PropTypes from 'prop-types';
import VersionNumber from "react-native-version-number";
// import messaging from '@react-native-firebase/messaging';
import Sound from "react-native-sound";
import GLOBAL from "../utils/globals";
import AnalyticsManager from "../utils/analytics";
import NotificationsManager from "../utils/notifications";
import Database from "../utils/database";
import { mergedBaniList } from "../utils/helpers";
import * as actions from "../actions/actions";
import BaniList from "../components/BaniList";
import BaniLengthSelector from "../components/BaniLengthSelector";
import Strings from "../utils/localization";

class Home extends React.Component {
  static navigationOptions = { header: null };

  constructor(props) {
    super(props);

    this.state = {
      data: [],
      isLoading: true,
      showLengthSelector: false,
    };

    // Enable playback in silence mode
    Sound.setCategory("Ambient", true); // true = mixWithOthers
  }

  async componentDidMount() {
    await this.loadBaniList();
    let showBaniLengthSelector = false;
    const {appVersion,setAppVersion,baniLength,language,
      fontFace,setFontFace,screenAwake,autoScroll,statusBar,statistics,reminderSound,reminderBanis,reminders}=this.props
    if (appVersion !== VersionNumber.appVersion) {
      if (appVersion === "") {
        // Is first install
        showBaniLengthSelector = true;
      }
      setAppVersion(VersionNumber.appVersion);
    }
    if (showBaniLengthSelector || baniLength === "") {
      this.setState({ showLengthSelector: true });
    }

    if (language !== "DEFAULT") {
      Strings.setLanguage(language);
    }

    if(!fontFace || fontFace === "GurbaniAkharSG"){
      setFontFace("GurbaniAkharTrue");
    }

    this.changeKeepAwake(screenAwake || autoScroll);
    this.changeStatusBar(statusBar);
    AnalyticsManager.getInstance().allowTracking(statistics);

    NotificationsManager.getInstance().updateReminders(
      reminders,
      reminderSound,
      reminderBanis
    );
    AnalyticsManager.getInstance().trackScreenView(
      "Home Screen",
      this.constructor.name
    );
    NotificationsManager.getInstance().removeAllDeliveredNotifications();
  }

  componentDidUpdate(prevProps) {
    const {baniOrder,transliterationLanguage,screenAwake,autoScroll,statusBar,statistics,reminders,reminderBanis,reminderSound}=this.props
    if (prevProps.baniOrder !== baniOrder) {
      this.sortBani();
    } else if (
      prevProps.transliterationLanguage !== transliterationLanguage
    ) {
      this.loadBaniList();
    } else if (prevProps.screenAwake !== screenAwake) {
      this.changeKeepAwake(screenAwake);
    } else if (prevProps.autoScroll !== autoScroll) {
      if (autoScroll) {
        this.changeKeepAwake(true);
      } else {
        this.changeKeepAwake(screenAwake);
      }
    } else if (prevProps.statusBar !== statusBar) {
      this.changeStatusBar(statusBar);
    } else if (prevProps.statistics !==statistics) {
      AnalyticsManager.getInstance().allowTracking(statistics);
    } else if (prevProps.reminders !== reminders) {
      NotificationsManager.getInstance().checkPermissions(reminders);
      NotificationsManager.getInstance().updateReminders(
        reminders,
        reminderSound,
        reminderBanis
      );
    } else if (prevProps.reminderSound !== reminderSound) {
      NotificationsManager.getInstance().updateReminders(
        reminders,
        reminderSound,
        reminderBanis
      );

      if (actions.REMINDER_SOUNDS.indexOf(reminderSound) !== 0) {
        const sound = new Sound(
          reminderSound,
          Sound.MAIN_BUNDLE,
          (error) => {
            if (error) {
              return;
            }
            // loaded successfully
            sound.play(() => {
              sound.reset();
            });
          }
        );
      }
    }
  }

  handleOnPress(item, navigator) {
    if (!item.folder) {
      const { setCurrentShabad} = this.props;
      setCurrentShabad(item.id);
      navigator.navigate('Reader', {
        key: `Reader-${item.id}`,
        params: { item },
      });
    } else {
      navigator.navigate('FolderBani', {
        key: `Folder-${item.roman}`,
        params: { data: item.folder, title: item.gurmukhi },
      });
    }
  }

   changeKeepAwake=(shouldBeAwake)=> {
    if (shouldBeAwake) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }
  }

  changeStatusBar=(shouldBeHidden)=> {
    StatusBar.setHidden(shouldBeHidden);
  }

  // handleNotificationEvent(notificationOpen) {
  //   let key = notificationOpen.notification.data["key"];
  //   let gurmukhi = notificationOpen.notification.data["gurmukhi"];
  //   let translit = notificationOpen.notification.data["translit"];
  //   let item = { id: key, gurmukhi: gurmukhi, translit: translit };

  //   NotificationsManager.getInstance().removeAllDeliveredNotifications();

  //   this.props.setCurrentShabad(item.id);
  //   this.props.navigation.navigate('Reader', {
  //     key: "Reader-" + item.id,
  //     params: { item: item },
  //   });
  // }
  
  sortBani() {
    const {mergedBaniData,baniOrder}=this.props;
    
    this.setState({
      data: this.reorder(
       mergedBaniData.baniOrder,
       baniOrder
      ),
    });
  }

  // async requestUserPermission() {
  //   const authStatus = await messaging().requestPermission();
  //   const enabled =
  //     authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //     authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  // }

  async loadBaniList() {
    const {transliterationLanguage,setMergedBaniData}=this.props
    const baniList=await Database.getBaniList(transliterationLanguage)
       setMergedBaniData(mergedBaniList(baniList));
        this.sortBani();
        this.setState({
          isLoading: false,
        });
  }

  reorder(arr, index) {
    const ordered = []
    const newIndex = []
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < index.length; i++) {
      if (arr[index[i]]) {
        ordered.push(arr[index[i]]);
        newIndex.push(index[i]);
      }
    }
    if (newIndex.length !== index.length) {
      const {baniOrder}=this.props
      baniOrder.setBaniOrder(newIndex);
    }
    return ordered;
  }

  render() {
    const {showLengthSelector,data,isLoading}=this.state;
    const {navigation,nightMode,fontSize,fontFace,transliteration}=this.props
    return (
      <SafeAreaView
        style={{
          flex: 1, 
          backgroundColor: GLOBAL.COLOR.TOOLBAR_COLOR
        }}>
         
        {showLengthSelector && <BaniLengthSelector />}

        <StatusBar
          barStyle="light-content"
        />
        <Header
          backgroundColor={GLOBAL.COLOR.TOOLBAR_COLOR}
          containerStyle={[
            { height: 0, borderBottomWidth: 0 },
            Platform.OS === "android" && { paddingTop: 10 },
          ]}
        />
        <View
          style={{
            backgroundColor: GLOBAL.COLOR.TOOLBAR_COLOR,
            paddingBottom: 10,
          }}>
          <Text
            style={[
              {
                color: GLOBAL.COLOR.TOOLBAR_TINT,
                fontFamily: "GurbaniAkharHeavyTrue",
                fontSize: 18,
                textAlign: "center",
                paddingBottom: 10,
              },
            ]}>
            {Strings.fateh}

          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
            }}>
            <Text
              style={[
                {
                  color: GLOBAL.COLOR.TOOLBAR_TINT,
                  fontFamily: "GurbaniAkharHeavyTrue",
                  fontSize: 28,
                },
              ]}>
              <Text
                style={[
                  {
                    fontSize: 32,
                  },
                ]}>
                Œ
              </Text>{" "}
              {Strings.sg_title}{" "}
              <Text
                style={[
                  {
                    fontSize: 32,
                  },
                ]}>
                ‰
              </Text>
            </Text>
          </View>
          <Icon
            name="settings"
            style={{
              position: "absolute",
              right: 10,
              bottom: 15,
            }}
            color={GLOBAL.COLOR.TOOLBAR_TINT}
            size={30}
            onPress={() =>
              navigation.navigate('Settings')
            }
          />
        </View>
        <BaniList
          data={data}
          nightMode={nightMode}
          fontSize={fontSize}
          fontFace={fontFace}
          transliteration={transliteration}
          navigation={navigation}
          isLoading={isLoading}
          // eslint-disable-next-line react/jsx-no-bind
          onPress={this.handleOnPress.bind(this)}
        />
      </SafeAreaView>
    );
  }
}

Home.defaultProps={
    mergedBaniData: {
      "baniOrder": [{
        "gurmukhi": "gur mMqR",
        "id": 1,
        "translit": "gur ma(n)tr"
      }, {
        "gurmukhi": "jpujI swihb",
        "id": 2,
        "translit": "japujee saahib"
      }, {
        "gurmukhi": "Sbd hzwry",
        "id": 3,
        "translit": "shabadh hazaare"
      }, {
        "gurmukhi": "jwpu swihb",
        "id": 4,
        "translit": "jaap saahib"
      }, {
        "gurmukhi": "Sbd hzwry pwiqSwhI 10",
        "id": 5,
        "translit": "shabadh hazaare paatishaahee 10"
      }, {
        "gurmukhi": "qÍ pRswid sv`Xy (sRwvg su`D)",
        "id": 6,
        "translit": "tavai prasaadh sava'ye (sraavag su'dh)"
      }, {
        "gurmukhi": "qÍ pRswid sv`Xy (dInn kI)",
        "id": 7,
        "translit": "tavai prasaadh sava'ye (dheenan kee)"
      }, {
        "gurmukhi": "Akwl ausqq cOpeI",
        "id": 8,
        "translit": "akaal usatat chauapiee"
      }, {
        "gurmukhi": "bynqI cOpeI swihb",
        "id": 9,
        "translit": "benatee chauapiee saahib"
      }, {
        "gurmukhi": "Anµdu swihb",
        "id": 10,
        "translit": "ana(n)dh saahib"
      }, {
        "gurmukhi": "lwvW",
        "id": 11,
        "translit": "laavaa(n)"
      }, {
        "gurmukhi": "AQ cMfIcirqR",
        "id": 12,
        "translit": "ath cha(n)ddeecharitr"
      }, {
        "gurmukhi": "cMfI dI vwr",
        "id": 13,
        "translit": "cha(n)ddee dhee vaar"
      }, {
        "gurmukhi": "kucjI",
        "id": 14,
        "translit": "kuchajee"
      }, {
        "gurmukhi": "sucjI",
        "id": 15,
        "translit": "suchajee"
      }, {
        "gurmukhi": "guxvMqI",
        "id": 16,
        "translit": "gunava(n)tee"
      }, {
        "gurmukhi": "Punhy mhlw 5",
        "id": 17,
        "translit": "funahe mahalaa panjavaa"
      }, {
        "gurmukhi": "cauboly",
        "id": 18,
        "translit": "chaubole"
      }, {
        "gurmukhi": "SsqR nwm mwlw",
        "id": 19,
        "translit": "shasatr naam maalaa"
      }, {
        "gurmukhi": "Awsw dI vwr",
        "id": 90,
        "translit": "aasaa dhee vaar"
      }, {
        "gurmukhi": "rhrwis swihb",
        "id": 21,
        "translit": "raharaas saahib"
      }, {
        "gurmukhi": "AwrqI",
        "id": 22,
        "translit": "aaratee"
      }, {
        "gurmukhi": "soihlw swihb",
        "id": 23,
        "translit": "sohilaa saahib"
      }, {
        "gurmukhi": "Ardws",
        "id": 24,
        "translit": "aradhaas"
      }, {
        "gurmukhi": "sRI BgauqI AsqoqR (pMQ pRkwS)",
        "id": 25,
        "translit": "sree bhagautee asatotr (pa(n)th prakaash)"
      }, {
        "gurmukhi": "sRI BgauqI AsqoqR (sRI hzUr swihb)",
        "id": 26,
        "translit": "sree bhagautee asatotr (sree hazoor saahib)"
      }, {
        "gurmukhi": "bwrh mwhw mWJ",
        "id": 27,
        "translit": "baareh maahaa maa(n)jh"
      }, {
        "gurmukhi": "bwrh mwhw svYXw",
        "id": 28,
        "translit": "baareh maahaa savaiyaa"
      }, {
        "gurmukhi": "Akwl ausqq",
        "id": 29,
        "translit": "akaal usatat"
      }, {
        "gurmukhi": "slok mhlw 9",
        "id": 30,
        "translit": "salok mahalaa nauvaa"
      }, {
        "gurmukhi": "suKmnI swihb",
        "id": 31,
        "translit": "sukhamanee saahib"
      }, {
        "gurmukhi": "suKmnw swihb",
        "id": 32,
        "translit": "sukhamanaa saahib"
      }, {
        "gurmukhi": "bwvn AKrI",
        "id": 33,
        "translit": "baavan akharee"
      }, {
        "gurmukhi": "isD gosit",
        "id": 34,
        "translit": "sidh gosaT"
      }, {
        "gurmukhi": "dKxI EAMkwru",
        "id": 35,
        "translit": "dhakhanee oa(n)kaaru"
      }, {
        "gurmukhi": "duK BMjnI swihb",
        "id": 36,
        "translit": "dhukh bha(n)janee saahib"
      }, {
        "folder": [Array],
        "gurmukhi": "AMimRq bwxI",
        "translit": "amirat baaNee"
      }, {
        "folder": [Array],
        "gurmukhi": "Bgq bwxI",
        "translit": "bhagat baaNee"
      }, {
        "folder": [Array],
        "gurmukhi": "22 vwrW",
        "translit": "22 varaa(n)"
      }, {
        "folder": [Array],
        "gurmukhi": "sv`Xy",
        "translit": "sava'ye"
      }, {
        "gurmukhi": "rwg mwlw",
        "id": 38,
        "translit": "raag maalaa"
      }]
    }
}

Home.propTypes = {
  appVersion: PropTypes.string.isRequired,
  setAppVersion: PropTypes.func.isRequired,
  baniLength: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  fontFace: PropTypes.string.isRequired,
  setFontFace: PropTypes.func.isRequired,
  screenAwake: PropTypes.bool.isRequired,
  autoScroll: PropTypes.bool.isRequired,
  statusBar: PropTypes.bool.isRequired,
  statistics: PropTypes.bool.isRequired,
  reminderSound: PropTypes.string.isRequired,
  reminderBanis: PropTypes.string.isRequired,
  reminders: PropTypes.bool.isRequired,
  baniOrder: PropTypes.arrayOf(PropTypes.number).isRequired,
  transliterationLanguage: PropTypes.string.isRequired,
  setCurrentShabad: PropTypes.func.isRequired,
  mergedBaniData: PropTypes.shape({
    baniOrder: PropTypes.arrayOf(
      PropTypes.shape({
        gurmukhi: PropTypes.string,
        id: PropTypes.number,
        translit: PropTypes.string,
      })
    ),
  }),
  setMergedBaniData: PropTypes.func.isRequired,
  navigation: PropTypes.shape({
    addEventListener: PropTypes.func,
    canGoBack: PropTypes.func,
    dispatch: PropTypes.func,
    getID: PropTypes.func,
    getParent: PropTypes.func,
    getState: PropTypes.func,
    goBack: PropTypes.func,
    isFocused: PropTypes.func,
    navigate: PropTypes.func,
    pop: PropTypes.func,
    popToTop: PropTypes.func,
    push: PropTypes.func,
    removeListener: PropTypes.func,
    replace: PropTypes.func,
    reset: PropTypes.func,
    setOptions: PropTypes.func,
    setParams: PropTypes.func,
  }).isRequired,
  nightMode: PropTypes.bool.isRequired,
  fontSize: PropTypes.string.isRequired,
  transliteration: PropTypes.bool.isRequired,
};

function mapStateToProps(state) {
  return {
    data:state.data,
    nightMode: state.nightMode,
    baniOrder: state.baniOrder,
    mergedBaniData: state.mergedBaniData,
    transliteration: state.transliteration,
    transliterationLanguage: state.transliterationLanguage,
    fontSize: state.fontSize,
    fontFace: state.fontFace,
    language: state.language,
    screenAwake: state.screenAwake,
    statusBar: state.statusBar,
    statistics: state.statistics,
    autoScroll: state.autoScroll,
    appVersion: state.appVersion,
    baniLength: state.baniLength,
    reminders: state.reminders,
    reminderBanis: state.reminderBanis,
    reminderSound: state.reminderSound,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(actions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Home);
