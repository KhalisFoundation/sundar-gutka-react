import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Image, Pressable, FlatList, useWindowDimensions, BackHandler } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@rneui/themed";
import { pickByMode } from "@theme/colorUtils";
import { getLanguages } from "@settings/components/comon/strings";
import { androidLineHeight } from "@theme/lineHeight";
import { trackTourEvent } from "../../firebase/analytics";
import CustomText from "../CustomText";
import STRINGS from "../../localization";
import useTheme from "../../context";
import useThemedStyles from "../../hooks/useThemedStyles";
import constant from "../../constant";
import { setLanguage, setOnboardingSeen, setOnboardingVisible } from "../../actions";
import { ONBOARDING_SLIDES } from "./slides";
import createStyles from "./style";

// Concrete languages offered in the globe picker, in a fixed, intentional order
// (Gurmukhi/Devanagari first, then the Latin-script locales). "Default"
// (device-locale) is intentionally dropped — the picker is for an explicit pick.
const LANGUAGE_ORDER = ["pa", "en-US", "hi", "it", "es", "fr"];

/**
 * Full-screen onboarding carousel — the text + screenshot guide that replaced
 * the spotlight tour. Mounted once at the app root (see app.js) and shown
 * whenever redux `onboardingVisible` is true: on a genuine fresh install
 * (useOnboardingTrigger) and from the Settings "Revisit Tutorial" row.
 *
 * Top-right globe switches the app language in place (replacing the old
 * first-run language screen); bottom row has Skip + Next/Done; dots show
 * progress. Finishing or skipping marks it seen so first-run never re-opens it.
 */
const OnboardingCarousel = () => {
  const { theme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const visible = useSelector((state) => state.onboardingVisible);
  // Subscribe to language so picking a new one re-renders the slides + labels.
  const language = useSelector((state) => state.language);

  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const [langOpen, setLangOpen] = useState(false);

  const slides = ONBOARDING_SLIDES;
  const isLast = index >= slides.length - 1;

  const byKey = getLanguages(STRINGS).reduce((acc, lang) => {
    acc[lang.key] = lang;
    return acc;
  }, {});
  const languages = LANGUAGE_ORDER.map((key) => byKey[key]).filter(Boolean);
  const effectiveLanguage = language === "DEFAULT" ? "en-US" : language;
  const currentLangTitle = byKey[effectiveLanguage]?.title;

  // Every exit reports which one it was, and where. Skipping on the first
  // slide and finishing the last are the same "seen" to the store and opposite
  // outcomes to a report, so the reason is a parameter rather than one event.
  const finish = useCallback(
    (reason) => {
      trackTourEvent(reason, {
        step_id: slides[index]?.key,
        step_index: index,
        step_count: slides.length,
      });
      dispatch(setOnboardingSeen(constant.ONBOARDING_VERSION));
      dispatch(setOnboardingVisible(false));
    },
    [dispatch, slides, index]
  );

  // Reset to the first slide whenever the carousel (re)opens. Opening IS the
  // start — the carousel is mounted at the app root for the whole session, so
  // a mount is not a viewing and only this transition is.
  useEffect(() => {
    if (!visible) return;
    trackTourEvent("started", { step_count: slides.length });
    setIndex(0);
    setLangOpen(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [visible]);

  // Android back closes the carousel (counts as "seen").
  useEffect(() => {
    if (!visible) return;

    const onBack = () => {
      // Its own outcome: backing out is not the same intent as tapping Skip.
      finish("dismissed");
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => backHandler.remove();
  }, [visible, finish]);

  const goNext = useCallback(() => {
    if (isLast) {
      finish("completed");
      return;
    }
    listRef.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
  }, [isLast, finish, index, width]);

  const onMomentumEnd = useCallback(
    (e) => {
      const x = e.nativeEvent.contentOffset.x;
      setIndex(width > 0 ? Math.round(x / width) : 0);
    },
    [width]
  );

  const getItemLayout = useCallback(
    (_, i) => ({ length: width, offset: width * i, index: i }),
    [width]
  );

  const renderItem = useCallback(
    ({ item }) => {
      // Scale type to the device width (clamped) so it reads well from small
      // phones to tablets, and longer translations (fr/it/es) still fit. Body
      // text wraps freely (no numberOfLines), and the image area flexes/shrinks
      // to make room, so nothing clips regardless of locale or font scale.
      const scale = Math.min(Math.max(width / 375, 0.85), 1.25);
      const titleSize = Math.round(22 * scale);
      const bodySize = Math.round(15 * scale);
      const bodyLineHeight = androidLineHeight(Math.round(22 * scale));
      const screenshot = pickByMode(theme, { dark: item.imageDark, light: item.imageLight }, item.image);
      return (
        <View style={{ width, height: listHeight }}>
          <View style={styles.slide}>
            <View style={styles.imageWrap}>
              {screenshot ? (
                <View style={[styles.imageBorder, { aspectRatio: item.aspectRatio }]}>
                  <Image source={screenshot} style={styles.image} resizeMode="cover" />
                </View>
              ) : (
                <View style={styles.placeholder}>
                  <Icon name="image" type="material" size={Math.round(48 * scale)} color={theme.c.primary} />
                  <CustomText style={styles.placeholderText}>{item.key}</CustomText>
                </View>
              )}
            </View>
            <View style={styles.textBlock}>
              {!!STRINGS[item.titleKey] && (
                <CustomText style={[styles.title, { fontSize: titleSize }]}>
                  {STRINGS[item.titleKey]}
                </CustomText>
              )}
              {!!STRINGS[item.bodyKey] && (
                <CustomText style={[styles.body, { fontSize: bodySize, lineHeight: bodyLineHeight }]}>
                  {STRINGS[item.bodyKey]}
                </CustomText>
              )}
            </View>
          </View>
        </View>
      );
    },
    [width, listHeight, styles, theme]
  );

  if (!visible) return null;

  return (
    <View style={[styles.overlay, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.globeButton}
          onPress={() => setLangOpen((open) => !open)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="change-language"
        >
          <Icon
            name="language"
            type="material"
            size={20}
            color={theme.c.headerFg}
          />
          {!!currentLangTitle && <CustomText style={styles.globeLabel}>{currentLangTitle}</CustomText>}
        </Pressable>
      </View>

      <View style={{ flex: 1 }} onLayout={(e) => setListHeight(e.nativeEvent.layout.height)}>
        {listHeight > 0 && (
          <FlatList
            ref={listRef}
            data={slides}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumEnd}
            getItemLayout={getItemLayout}
          />
        )}
      </View>

      <View style={styles.dotsRow}>
        {slides.map((slide, i) => (
          <View key={slide.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.controls}>
        {!isLast ? (
          <Pressable style={styles.skipButton} onPress={() => finish("skipped")} hitSlop={8}>
            <CustomText style={styles.skipText}>{STRINGS.TOUR_SKIP}</CustomText>
          </Pressable>
        ) : (
          <View style={styles.skipButton} />
        )}
        <Pressable style={styles.nextButton} onPress={goNext} hitSlop={8}>
          <CustomText style={styles.nextText}>{isLast ? STRINGS.TOUR_DONE : STRINGS.TOUR_NEXT}</CustomText>
        </Pressable>
      </View>

      {langOpen && (
        <>
          <Pressable style={styles.langBackdrop} onPress={() => setLangOpen(false)} />
          <View style={[styles.langCard, { top: insets.top + 52 }]}>
            {languages.map(({ key, title }) => (
              <Pressable
                key={key}
                style={styles.langItem}
                onPress={() => {
                  dispatch(setLanguage(key));
                  setLangOpen(false);
                }}
              >
                <CustomText
                  style={[styles.langItemText, effectiveLanguage === key && styles.langItemTextActive]}
                >
                  {title}
                </CustomText>
                {effectiveLanguage === key && (
                  <Icon name="check" type="material" size={18} color={theme.c.primary} />
                )}
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

export default OnboardingCarousel;
