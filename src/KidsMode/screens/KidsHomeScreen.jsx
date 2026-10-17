import React, { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBarComponent } from "@common";
import { setKidsExperience } from "../state/actions";
import KidsApp from "../design/KidsApp";
import { freshExperience, parseExperience } from "../design/experience";
import bani from "../design/bani.json";
import { Sheet, Scroll, HorizontalScroll } from "../host/layout";
import { Icon } from "../host/icons";
import { image } from "../host/images";
import { useReferenceAudio, useClipPlayer, referenceTrackUrl } from "../host/audio";
import { useRecordedRecitation } from "../host/recitation";

// Builds the HostPorts the design screens expect from this app's own stack.
// Storage goes through redux so redux-persist does the disk write; reading it
// once on mount keeps the synchronous load() the design relies on.
const KidsHomeScreen = () => {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const optedIn = useSelector((state) => state.kidsMode.scoringOptIn);
  // bani.json timings are Bhai Jarnail Singh's, so the reciter is pinned here.
  const reciter = "bjs";
  const stored = useSelector((state) => state.kidsMode.experience);
  const [saved] = useState(() => parseExperience(stored) ?? { ...freshExperience(), kids: true });

  const audio = useReferenceAudio(referenceTrackUrl(reciter));
  const clip = useClipPlayer();
  const recitation = useRecordedRecitation(bani, { optedIn, reciter });

  const save = useCallback(
    (value) => {
      dispatch(setKidsExperience(value));
      return true;
    },
    [dispatch]
  );

  const host = useMemo(
    () => ({
      Sheet,
      Scroll,
      HorizontalScroll,
      Icon,
      image,
      storage: { load: () => saved, save },
      audio,
      clip,
      recitation,
      initialScreen: saved.started ? "world" : "character",
      statusBarBackground: "#ffffff",
      safeArea: { top: insets.top, bottom: insets.bottom },
    }),
    [saved, save, audio, clip, recitation, insets.top, insets.bottom]
  );

  return (
    <>
      <StatusBarComponent backgroundColor="#ffffff" />
      <KidsApp pauris={bani} host={host} />
    </>
  );
};

export default KidsHomeScreen;
