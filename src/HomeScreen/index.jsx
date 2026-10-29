import React, { useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View, InteractionManager } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useDispatch, useSelector } from "react-redux";
import { paletteFor } from "@theme/screenPalettes";
import PropTypes from "prop-types";
import useTheme from "@common/context";
import useThemedStyles from "@common/hooks/useThemedStyles";
import {
  actions,
  BaniLengthSelector,
  constant,
  useKeepAwake,
  BaniList,
  validateBaniOrder,
  StatusBarComponent,
  SafeArea,
  STRINGS,
  allowTracking,
} from "@common";
import { setBaniOrder } from "../common/actions";
import { SegmentedTabs } from "../common/components/ui";
import CreatePothiSheet from "../Pothi/components/CreatePothiSheet";
import usePothiActions from "../Pothi/hooks/usePothiActions";
import PothiList from "../Pothi/PothiList";
import { getLanguages } from "../Settings/components/comon/strings";
import BaniHeader from "./components/BaniHeader";
import { useBaniLength, useBaniList, useDatabaseUpdateCheck } from "./hooks";
import createStyles from "./styles";

// The two lists this screen switches between. Folders is not the default: the
// bani list is what the app opens on and what most sessions want.
const TAB_BANIS = "banis";
const TAB_FOLDERS = "folders";

const HomeScreen = React.memo(({ navigation }) => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { navigate } = navigation;
  const { baniListData } = useBaniList();
  const language = useSelector((state) => state.language);
  const baniOrder = useSelector((state) => state.baniOrder);
  const fontFace = useSelector((state) => state.fontFace);
  const isStatistics = useSelector((state) => state.isStatistics);
  const [tab, setTab] = useState(TAB_BANIS);
  // Shared with the standalone My Pothis screen, so the two entry points into
  // the same list cannot drift apart.
  const { openPothi, onPinLimit, creating, openCreate, closeCreate, onCreated } =
    usePothiActions(navigate);
  useDatabaseUpdateCheck();

  useKeepAwake();
  const { baniLengthSelector } = useBaniLength();
  const dispatch = useDispatch();

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: baniLengthSelector ? { display: "none" } : undefined,
    });
  }, [baniLengthSelector, navigation]);

  useEffect(() => {
    // Deferred past the first interactive frame: setAnalyticsCollectionEnabled()
    // is the app's first Firebase Analytics call, which can trigger Play
    // Services' Analytics "dynamite" module to load over a synchronous Binder
    // call. Running it on HomeScreen's very first mount — the highest-contention
    // moment of cold start — risked blocking the main thread long enough to ANR.
    const task = InteractionManager.runAfterInteractions(() => {
      allowTracking(isStatistics);
    });
    return () => task.cancel();
  }, [isStatistics]);

  useEffect(() => {
    const validLanguages = getLanguages(STRINGS);
    const validLanguageKeys = validLanguages.map((lang) => lang.key);
    const isLanguageValid = language && validLanguageKeys.includes(language);

    if (!language || !isLanguageValid) {
      dispatch(actions.setLanguage("DEFAULT"));
    }
  }, [language]);

  // The app UI (Home/Bookmarks lists, Reader header/title) is fixed to Baloo
  // Paaji — there is no longer a Font Face setting. The only font control left
  // ("Bani Font") drives just the Reader scripture text via `baniFontFace`.
  // Reset any previously-persisted non-Baloo value here on the entry screen.
  useEffect(() => {
    if (fontFace !== constant.BALOO_PAAJI) {
      dispatch(actions.setFontFace(constant.BALOO_PAAJI));
    }
  }, [fontFace]);

  useEffect(() => {
    const order = validateBaniOrder(baniOrder);
    dispatch(setBaniOrder(order));
  }, []);

  // With My Pothi ON, `baniRows` filters the folders out and every row here is
  // a bani. With it OFF the bundled folders are back in this list, so opening
  // one has to reach FolderScreen again — the branch this screen carried before
  // the Folders tab took the folders over.
  const onPress = (row) => {
    const bani = row.item;
    dispatch(actions.toggleAudio(false));
    if (bani.folder) {
      navigate(constant.FOLDERSCREEN, {
        key: `Folder-${bani.gurmukhi}`,
        // No `pothiId`: a bundled folder is not editable. `titleVariant`
        // defaults to the GurbaniAkhar face, which is what these ASCII names
        // need — see FolderScreen.
        params: { data: bani.folder, title: bani.gurmukhi },
      });
      return;
    }
    navigate(constant.READER, {
      key: `Reader-${bani.id}`,
      params: {
        id: bani.id,
        title: bani.gurmukhi,
        titleUni: bani.gurmukhiUni,
      },
    });
  };

  // With My Pothi on, All Banis lists banis only: the bundled folders (Amrit
  // Bani, Bhagat Bani and the rest) are rendered by the Folders tab, so listing
  // them here as well showed the same four rows twice on one screen. With it
  // off there is no Folders tab, so they belong here — see POTHI_ENABLED.
  //
  // Filtered at the render, NOT in `baniListData` itself: `systemPothis` builds
  // the Folders tab from these very rows, so dropping them upstream would empty
  // the tab this change exists to defer to.
  const baniRows = useMemo(
    () => (constant.POTHI_ENABLED ? baniListData.filter((bani) => !bani.folder) : baniListData),
    [baniListData]
  );

  // One list and no tab bar with the feature off, so Home looks exactly as it
  // did before My Pothi: the bundled folders sit among the banis.
  const showPothis = constant.POTHI_ENABLED && tab === TAB_FOLDERS;

  // Swiping between the two tabs, the way a pager reads: both lists sit side by
  // side on one row and the row MOVES WITH THE FINGER, rather than the screen
  // cutting from one to the other on release.
  //
  // `page` is the continuous position, 0 on All Banis and 1 on Folders. It
  // drives the row's offset and is handed to the tab bar, so the underline
  // slides the same distance at the same moment — one value, so the two can
  // never disagree. It lives on the UI thread, which is what lets the drag
  // track at 60fps without a render per frame.
  const { width } = useWindowDimensions();
  const page = useSharedValue(0);
  const pageStart = useSharedValue(0);

  // Snapping is by DISTANCE or by THROW: past a third of the screen commits,
  // and so does a fast flick that never got that far. Anything less settles
  // back where it came from.
  const settle = useMemo(
    () => (next) => {
      "worklet";

      page.value = withTiming(next, { duration: 220 });
      runOnJS(setTab)(next === 1 ? TAB_FOLDERS : TAB_BANIS);
    },
    [page]
  );

  // A PAN with both axes pinned. A fling with a direction fired on a straight
  // vertical drag — verified on a Pixel 9, where pulling the Folders list down
  // threw the screen back to All Banis. These two thresholds keep the gesture
  // off the list underneath:
  //
  //   activeOffsetX  it does not begin until the finger has travelled 20px
  //                  sideways, so a tap or a short drag is never a swipe
  //   failOffsetY    it gives up the moment the finger travels 16px vertically,
  //                  so a scroll cancels it outright
  const swipeTabs = useMemo(
    () =>
      Gesture.Pan()
        // With pothis switched off there is only one page to be on.
        .enabled(constant.POTHI_ENABLED)
        .activeOffsetX([-20, 20])
        .failOffsetY([-16, 16])
        .onStart(() => {
          pageStart.value = page.value;
        })
        .onUpdate((event) => {
          const next = pageStart.value - event.translationX / width;
          // Clamped, so neither end rubber-bands past its own list.
          page.value = Math.min(1, Math.max(0, next));
        })
        .onEnd((event) => {
          const thrown = Math.abs(event.velocityX) > 500;
          const forward = event.translationX < 0;
          if (thrown) settle(forward ? 1 : 0);
          else settle(page.value > 0.5 ? 1 : 0);
        }),
    [page, pageStart, settle, width]
  );

  // Tapping a tab moves the same value, so the two ways in agree.
  const selectTab = useMemo(
    () => (key) => {
      setTab(key);
      page.value = withTiming(key === TAB_FOLDERS ? 1 : 0, { duration: 220 });
    },
    [page]
  );

  const pagerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -page.value * width }],
  }));

  // The bani list keeps its own ground on every surface of this screen, so no
  // strip of the semantic background shows above or behind the header.
  const baniGround = paletteFor("baniList", theme).surface;

  // No "bottom" edge below: this screen is a TAB, and the tab bar the navigator
  // draws under it is a `BottomNavigation`, which reserves and paints the bottom
  // inset itself. Reserving it here as well banded the foot of the list with a
  // second strip of `baniGround` for the rows to disappear behind. It went
  // unnoticed for as long as the app hid the system navigation bar and the inset
  // was always zero.
  return baniLengthSelector ? (
    <BaniLengthSelector />
  ) : (
    <SafeArea backgroundColor={baniGround} edges={["left", "right"]}>
      <StatusBarComponent backgroundColor={baniGround} />
      <View style={[{ backgroundColor: baniGround }, styles.container]}>
        <BaniHeader navigate={navigate} />
        {constant.POTHI_ENABLED && (
          <SegmentedTabs
            tabs={[
              { key: TAB_BANIS, label: STRINGS.ALL_BANIS },
              { key: TAB_FOLDERS, label: STRINGS.POTHIS_TAB },
            ]}
            value={tab}
            onChange={selectTab}
            progress={page}
            style={styles.tabs}
          />
        )}
        {/* Wraps the CONTENT, not the whole screen: the header and the tab bar
            keep their own taps, and the gesture composes with the list's
            scrolling underneath rather than replacing it.

            Both pages are mounted and laid out side by side in a row twice the
            screen's width, which the pan slides. A tab is therefore something
            the user can see themselves arriving at, whether they swiped to it
            or tapped its title. PothiList is told when it is the one on
            screen — being mounted no longer means being looked at. */}
        <GestureDetector gesture={swipeTabs}>
          <Animated.View
            style={[
              styles.container,
              styles.pager,
              { width: width * (constant.POTHI_ENABLED ? 2 : 1) },
              pagerStyle,
            ]}
          >
            <View style={{ width }}>
              <BaniList data={baniRows} onPress={onPress} />
            </View>
            {constant.POTHI_ENABLED && (
              <View style={{ width }}>
                <PothiList
                  active={showPothis}
                  baniListData={baniListData}
                  onOpenPothi={openPothi}
                  onCreatePress={openCreate}
                  onPinLimit={onPinLimit}
                />
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
      <CreatePothiSheet
        visible={creating}
        onClose={closeCreate}
        onCreated={onCreated}
        baniListData={baniListData}
      />
    </SafeArea>
  );
});

HomeScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};

export default HomeScreen;
