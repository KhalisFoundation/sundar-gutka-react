import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { logError, logMessage } from "@common";
import { getShabadFromID } from "@database";

// Every bani in a pothi, fetched and concatenated into ONE row array.
//
// This is what makes "Open Pothi" a continuous read rather than a stack of
// readers: `loadHTML` already turns a row array into the reader's page, so a
// pothi is just a longer array. Nothing about the rendering pipeline, the
// theme, vishraam, larivaar or the translation toggles has to know a pothi
// exists.
//
// Each bani's first row is tagged `pothiBaniStart` so the page can rule a
// divider between them; without it the banis run together with no seam and the
// reader cannot tell where one ends.
//
// Fetches run in parallel and are then reassembled in the pothi's own order —
// a serial loop over a ten-bani pothi is ten round trips to SQLite before the
// first line of text appears.
const useFetchPothi = (baniIds) => {
  const [shabad, setShabad] = useState([]);
  const [isLoading, setLoading] = useState(false);
  const baniLength = useSelector((state) => state.baniLength);
  const transliterationLanguage = useSelector((state) => state.transliterationLanguage);
  const vishraamSource = useSelector((state) => state.vishraamSource);
  const vishraamOption = useSelector((state) => state.vishraamOption);
  const isLarivaar = useSelector((state) => state.isLarivaar);
  const isLarivaarAssist = useSelector((state) => state.isLarivaarAssist);
  const isParagraphMode = useSelector((state) => state.isParagraphMode);
  const isVishraam = useSelector((state) => state.isVishraam);
  const padched = useSelector((state) => state.padched);

  // The array identity changes on every render of the caller; the contents are
  // what actually matter to the fetch.
  const key = (baniIds ?? []).join(",");

  const fetchPothi = useCallback(async () => {
    if (!key) {
      setShabad([]);
      return;
    }
    try {
      setLoading(true);
      const ids = key.split(",").map(Number);
      const parts = await Promise.all(
        ids.map(async (id) => {
          try {
            const rows = await getShabadFromID(
              id,
              baniLength,
              transliterationLanguage,
              vishraamSource,
              vishraamOption,
              isLarivaar,
              isLarivaarAssist,
              isParagraphMode,
              isVishraam,
              padched
            );
            return rows ?? [];
          } catch (error) {
            // One bani failing must not blank the whole pothi — the rest still
            // reads, and the gap is logged rather than thrown.
            logError(error);
            logMessage(`useFetchPothi: could not load bani ${id}`);
            return [];
          }
        })
      );
      setShabad(
        parts.flatMap((rows, index) =>
          rows.map((row, rowIndex) =>
            rowIndex === 0 ? { ...row, pothiBaniStart: true, pothiIndex: index } : row
          )
        )
      );
    } catch (error) {
      logError(error);
      logMessage("useFetchPothi: fetching pothi data error");
    } finally {
      setLoading(false);
    }
  }, [
    key,
    baniLength,
    transliterationLanguage,
    vishraamSource,
    vishraamOption,
    isLarivaar,
    isLarivaarAssist,
    isParagraphMode,
    isVishraam,
    padched,
  ]);

  useEffect(() => {
    fetchPothi();
  }, [fetchPothi]);

  return { shabad, isLoading, fetchPothi };
};

export default useFetchPothi;
