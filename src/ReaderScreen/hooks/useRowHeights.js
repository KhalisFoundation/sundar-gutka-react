import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Dimensions } from "react-native";
import { setRowHeights } from "../../common/actions";
import constant from "../../common/constant";
import usePrevious from "./usePrevious";
import { fontSizeForReader } from "../utils";

const useRowHeights = (shabadID, shabad) => {
  const {
    rowHeights,
    fontSize,
    isEnglishTranslation,
    isPunjabiTranslation,
    isSpanishTranslation,
    isTransliteration,
    isParagraphMode,
  } = useSelector((state) => state);
  const previousFontSize = usePrevious(fontSize);
  const previousEnglishTranslation = usePrevious(isEnglishTranslation);
  const previousPunjabiTranslation = usePrevious(isPunjabiTranslation);
  const previousSpanishTranslation = usePrevious(isSpanishTranslation);
  const previousTransliteration = usePrevious(isTransliteration);
  const previousParagraphMode = usePrevious(isParagraphMode);
  const dispatch = useDispatch();
  const windowWidth = Dimensions.get("window").width;
  const screenWidth = Dimensions.get("screen").width;
  const windowHeight = Dimensions.get("window").height;
  const screenHeight = Dimensions.get("screen").height;

  const {
    DEFAULT_TUK_HEIGHT_LARGE,
    DEFAULT_TUK_HEIGHT_MEDIUM,
    DEFAULT_TUK_HEIGHT_NORMAL,
    FONT_SIZE_MULTIPLIER,
  } = constant;

  const FONT_SIZE_MAP = {
    [constant.EXTRA_SMALL]: 1 / FONT_SIZE_MULTIPLIER,
    [constant.SMALL]: 1,
    [constant.MEDIUM]: FONT_SIZE_MULTIPLIER,
    [constant.LARGE]: FONT_SIZE_MULTIPLIER * 1.4,
    [constant.EXTRA_LARGE]: FONT_SIZE_MULTIPLIER * 1.6,
  };

  const calculateFontSizeMultiplier = () => {
    return FONT_SIZE_MAP[fontSize] || 1;
  };
  let multiplier = 1;

  const longGurmukhiLengthThreshold = 70;
  const calculateHeight = (str) => {
    const gurmukhiThresholds = {
      [constant.MEDIUM]: 35,
      [constant.LARGE]: 29,
      [constant.EXTRA_LARGE]: 25,
    };
    const gurmukhiLength = str.gurmukhiText.length;

    let tukHeight = DEFAULT_TUK_HEIGHT_MEDIUM;

    const shortGurmukhiLengthThreshold = gurmukhiThresholds[fontSize] || 41;
    if (gurmukhiLength <= shortGurmukhiLengthThreshold) {
      tukHeight = DEFAULT_TUK_HEIGHT_NORMAL;
    } else if (gurmukhiLength >= longGurmukhiLengthThreshold) {
      tukHeight = DEFAULT_TUK_HEIGHT_LARGE;
    }
    return tukHeight;
  };

  useEffect(() => {
    console.log("windowWidth", windowWidth);
    console.log("ScreenWidth", screenWidth);
    console.log("screen Height", screenHeight);
    console.log("window Height", windowHeight);
    const fontSizeMultiplier = calculateFontSizeMultiplier();

    if (isEnglishTranslation) {
      multiplier += 1;
    }
    if (isPunjabiTranslation) {
      multiplier += 1;
    }
    if (isSpanishTranslation) {
      multiplier += 1;
    }
    if (isTransliteration) {
      multiplier += 1;
    }

    if (
      !rowHeights[shabadID] ||
      (previousFontSize && previousFontSize !== fontSize) ||
      previousEnglishTranslation !== isEnglishTranslation ||
      previousPunjabiTranslation !== isPunjabiTranslation ||
      previousSpanishTranslation !== isSpanishTranslation ||
      previousTransliteration !== isTransliteration ||
      (previousParagraphMode !== isParagraphMode && isParagraphMode)
    ) {
      const array = shabad.map((str) =>
        Math.round(calculateHeight(str) * fontSizeMultiplier * multiplier)
      );
      if (array.length > 0) {
        dispatch(setRowHeights(array, shabadID));
      }
    }
  }, [
    shabad,
    shabadID,
    fontSize,
    previousFontSize,
    isEnglishTranslation,
    previousEnglishTranslation,
    isPunjabiTranslation,
    previousPunjabiTranslation,
    isSpanishTranslation,
    previousSpanishTranslation,
    isTransliteration,
    previousTransliteration,
    isParagraphMode,
    previousParagraphMode,
  ]);
};
export default useRowHeights;
