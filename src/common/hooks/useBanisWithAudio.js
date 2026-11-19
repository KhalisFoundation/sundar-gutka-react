import { useMemo } from "react";
import { useSelector } from "react-redux";
import { selectTracksForBani } from "../../services/audioApi";

// The ids of the banis that have at least one playable recording at the
// current bani length, read from the persisted audio catalog. The Reader picks
// tracks through the same `selectTracksForBani`, so a bani is marked here
// exactly when its player would have something to play. That matters for
// Chaupai, Rehras and Kirtan Sohila, whose recordings differ by length.
//
// Built from what the backend has actually returned, never from the candidate
// list in constant.AUDIO_BANI_IDS. Until the first catalog sync lands (a fresh
// install that has not been online yet) the set is empty and nothing is marked.
export const banisWithAudio = (catalog, baniLength) => {
  const ids = new Set();
  Object.entries(catalog || {}).forEach(([baniId, entry]) => {
    if (selectTracksForBani(entry?.groups, baniId, baniLength).length > 0) {
      ids.add(Number(baniId));
    }
  });
  return ids;
};

const useBanisWithAudio = () => {
  const catalog = useSelector((state) => state.audioCatalog);
  const baniLength = useSelector((state) => state.baniLength);
  return useMemo(() => banisWithAudio(catalog, baniLength), [catalog, baniLength]);
};

export default useBanisWithAudio;
