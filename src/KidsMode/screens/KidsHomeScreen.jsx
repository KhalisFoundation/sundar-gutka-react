import React, { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import catalog from "../design/bani-catalog.json";
import { freshExperience, parseExperience } from "../design/experience";
import KidsApp from "../design/KidsApp";
import { useReferenceAudio, useClipPlayer } from "../host/audio";
import { useBani } from "../host/bani";
import { Icon } from "../host/icons";
import { image } from "../host/images";
import { Sheet, Scroll, HorizontalScroll } from "../host/layout";
import { useRecordedRecitation } from "../host/recitation";
import { DEFAULT_RECITER, reciterOf } from "../reciters";
import { setKidsExperience } from "../state/actions";

// The journey the design draws (map, regions, stories, progress by pauri) is Japji's; the
// data layer underneath takes any bani token.
const JOURNEY = "japji";

// Builds the HostPorts the design screens expect from this app's own stack.
// Storage goes through redux so redux-persist does the disk write; reading it
// once on mount keeps the synchronous load() the design relies on.
const KidsHomeScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const optedIn = useSelector((state) => state.kidsMode.scoringOptIn);
  const chosen = useSelector((state) => state.kidsMode.reciter) || DEFAULT_RECITER;
  const stored = useSelector((state) => state.kidsMode.experience);
  const [saved] = useState(() => parseExperience(stored) ?? { ...freshExperience(), kids: true });
  // Kids night mode lives inside KidsApp, apart from the app theme; its save keeps redux current.
  const night = stored?.night ?? saved.night;
  const statusBarHidden = useSelector((state) => state.isStatusBar);

  const bani = useBani(JOURNEY, chosen);
  const name = catalog.find((entry) => entry.token === JOURNEY)?.name;

  const audio = useReferenceAudio(bani.trackUrl, name);
  const clip = useClipPlayer();
  const recitation = useRecordedRecitation(bani.pauris, {
    optedIn,
    reciter: bani.reciter,
    bani: bani.baniId,
  });

  const save = useCallback(
    (value) => {
      dispatch(setKidsExperience(value));
      return true;
    },
    [dispatch]
  );

  // The design saves whenever host.storage changes identity, and a save re-renders this
  // screen through the store, so storage has to keep its identity across renders.
  const storage = useMemo(() => ({ load: () => saved, save }), [saved, save]);

  const host = useMemo(
    () => ({
      Sheet,
      Scroll,
      HorizontalScroll,
      Icon,
      image,
      storage,
      audio,
      clip,
      recitation,
      initialScreen: saved.started ? "world" : "character",
      exit: () => navigation.goBack(),
      safeArea: { top: insets.top, bottom: insets.bottom },
      reciterName: reciterOf(bani.reciter).title,
    }),
    [storage, audio, clip, recitation, navigation, insets.top, insets.bottom, bani.reciter]
  );

  let body;
  if (bani.error) {
    body = (
      <View style={styles.center}>
        <Text style={styles.message}>{String(bani.error.message || bani.error)}</Text>
        <Text style={styles.link} onPress={() => navigation.goBack()}>
          Back
        </Text>
      </View>
    );
  } else if (!bani.ready) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b45309" />
      </View>
    );
  } else {
    body = <KidsApp pauris={bani.pauris} host={host} />;
  }

  return (
    <>
      {/* Transparent over the edge-to-edge window, so the design's surface-coloured inset shows through. */}
      <StatusBar
        hidden={statusBarHidden}
        barStyle={night ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />
      {body}
    </>
  );
};

// The design's loading colours, so the wait looks like the screens it leads to.
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#faf9f6" },
  message: { color: "#1b1b1f", margin: 24, textAlign: "center" },
  link: { color: "#1e3a8a", padding: 12 },
});

export default KidsHomeScreen;
