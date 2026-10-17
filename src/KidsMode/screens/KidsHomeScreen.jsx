import React, { useCallback, useMemo, useRef, useState } from "react";
import { StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import catalog from "../design/bani-catalog.json";
import { regions } from "../design/content";
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

// The design shares `selected` between the Japji journey and the reader. parseExperience
// rejects a saved pauri past the journey's end, which would reset all progress, so a
// section of a longer bani is never saved as one.
const JOURNEY_PAURIS = regions[regions.length - 1].end;

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

  // The journey is Japji; the design's catalog can open any other bani in its reader.
  const [token, setToken] = useState("japji");
  const loaded = useBani(token, chosen);
  // Until a newly picked bani has loaded, the one already on screen stays, so KidsApp keeps
  // its state instead of unmounting.
  const shownRef = useRef(null);
  if (loaded.pauris.length) shownRef.current = { ...loaded, token };
  const bani = shownRef.current;
  const name = catalog.find((entry) => entry.token === bani?.token)?.name;

  const audio = useReferenceAudio(bani?.trackUrl, name);
  const clip = useClipPlayer();
  const recitation = useRecordedRecitation(bani?.pauris ?? [], {
    optedIn,
    reciter: bani?.reciter,
    bani: bani?.baniId,
  });

  const save = useCallback(
    (value) => {
      dispatch(
        setKidsExperience(
          value.selected > JOURNEY_PAURIS ? { ...value, selected: JOURNEY_PAURIS } : value
        )
      );
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
      bani: bani?.token,
      selectBani: setToken,
      reciterName: reciterOf(bani?.reciter).title,
    }),
    [
      storage,
      audio,
      clip,
      recitation,
      navigation,
      insets.top,
      insets.bottom,
      bani?.token,
      bani?.reciter,
    ]
  );

  return (
    <>
      {/* Transparent over the edge-to-edge window, so the design's surface-coloured inset shows through. */}
      <StatusBar
        hidden={statusBarHidden}
        barStyle={night ? "light-content" : "dark-content"}
        backgroundColor="transparent"
      />
      {bani && <KidsApp pauris={bani.pauris} host={host} />}
    </>
  );
};

export default KidsHomeScreen;
