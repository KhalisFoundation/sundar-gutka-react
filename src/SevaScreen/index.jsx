import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  Text,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { useDispatch, useSelector } from "react-redux";
import {
  SafeArea,
  StatusBarComponent,
  CustomText,
  useTheme,
  useThemedStyles,
  STRINGS,
  openInAppBrowser,
  trackSevaEvent,
} from "@common";
import LinearGradient from "react-native-linear-gradient";
import { getSevaConfig, buildQgivUrl } from "../services/sevaConfig";
import { DonateIcon } from "../common/icons";
import createStyles from "./styles";

// Custom event tracker placeholder to match original branch structure
const SevaScreen = () => {
  const { theme } = useTheme();
  const isDarkMode = theme.mode === "dark";
  const styles = useThemedStyles(createStyles);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const titleWidth = screenWidth - 48;
  const headlineFontSize = Math.round(Math.min(72, Math.max(52, screenWidth * 0.16)));
  const vPad = Math.round(screenHeight * 0.07);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const language = useSelector((state) => state.language);

  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);

  const [selectedAmount, setSelectedAmount] = useState(10);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState("Monthly");

  // Tracks the URL currently open in InAppBrowser so we can re-open after app resume
  const pendingBrowserUrlRef = useRef(null);
  // True when the app went to background while the browser was open
  const appInBackgroundRef = useRef(false);
  // Always points to the latest openBrowserForUrl without needing it in useEffect deps
  const openBrowserForUrlRef = useRef(null);
  // Prevents concurrent open() calls (guards iOS where open() may not resolve on background)
  const isBrowserOpenRef = useRef(false);

  // ─── Analytics funnel (intent only) ────────────────────────────────────────
  // These measure in-app funnel behaviour. Actual payment truth lives on Qgiv —
  // we cannot observe completion from here, so "donate_tapped"/"payment_success"
  // represent intent, not confirmed donations.
  const hasDonatedRef = useRef(false);
  const hasInteractedRef = useRef(false);
  const lastFrequencyRef = useRef(frequency);

  // Load config on mount
  useEffect(() => {
    let active = true;
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(false);
        const cfg = await getSevaConfig();
        if (active) {
          setConfig(cfg);
          setSelectedAmount(cfg?.defaults?.selectedAmount ?? 10);
        }
      } catch (err) {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchConfig();
    return () => {
      active = false;
    };
  }, [language]);

  // Exposure on mount; abandonment on exit if the user never tapped donate.
  // Also tracks whether this is the user's first time opening the Seva screen
  // (persisted via AsyncStorage) and the initial donation type selection.
  useEffect(() => {
    const STORAGE_KEY = "@seva_screen_opened";
    (async () => {
      let isFirstOpen = false;
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === null) {
          isFirstOpen = true;
          await AsyncStorage.setItem(STORAGE_KEY, "1");
        }
      } catch (_) {
        // Non-critical — analytics fires without the flag if storage fails.
      }
      trackSevaEvent("opened", {
        is_first_open: isFirstOpen,
        donation_type: frequency === "One Time" ? "one_time" : "recurring",
      });
    })();
    return () => {
      if (!hasDonatedRef.current) {
        trackSevaEvent("screen_exited_without_donate", {
          interacted: hasInteractedRef.current,
          frequency_selected: lastFrequencyRef.current,
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAmountSelect = (amount, isOther = false) => {
    setIsOtherSelected(isOther);
    if (!isOther) {
      setSelectedAmount(amount);
      setCustomAmount("");
    }
    hasInteractedRef.current = true;
    trackSevaEvent("amount_selected", {
      amount: isOther ? null : amount,
      is_custom: isOther,
      donation_type: frequency === "One Time" ? "one_time" : "recurring",
    });
  };

  const handleCustomAmountChange = (val) => {
    // Only numeric input
    const cleaned = val.replace(/[^0-9]/g, "");
    setCustomAmount(cleaned);
  };

  const handleFrequencyChange = (freq) => {
    setFrequency(freq);
    lastFrequencyRef.current = freq;
    hasInteractedRef.current = true;
    trackSevaEvent("frequency_changed", {
      frequency: freq,
      donation_type: freq === "One Time" ? "one_time" : "recurring",
    });
  };

  const effectiveDonationType = frequency === "One Time" ? "one_time" : "recurring";

  // ─── Shared browser helper ─────────────────────────────────────────────────
  const openBrowserForUrl = useCallback(async (url) => {
    if (isBrowserOpenRef.current) return;

    const barColor = isDarkMode ? "#041126" : theme.colors.surface;
    const controlColor = isDarkMode ? "#FAF9F6" : "#113979";

    isBrowserOpenRef.current = true;
    pendingBrowserUrlRef.current = url;
    appInBackgroundRef.current = false;

    try {
      await openInAppBrowser(url, { barColor, controlColor });
    } finally {
      isBrowserOpenRef.current = false;
      // Only clear the pending URL if the browser closed because the user dismissed it,
      // not because the OS backgrounded the app (in which case we want to re-open on resume).
      if (!appInBackgroundRef.current) {
        pendingBrowserUrlRef.current = null;
      }
    }
  }, [isDarkMode, theme]);

  // Keep ref current so the AppState listener always calls the latest closure
  openBrowserForUrlRef.current = openBrowserForUrl;

  // Re-open the browser if the app was backgrounded while it was showing
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        appInBackgroundRef.current = true;
      } else if (nextState === "active" && appInBackgroundRef.current) {
        appInBackgroundRef.current = false;
        const url = pendingBrowserUrlRef.current;
        if (url) {
          // Brief delay to let the native bridge settle after the app resumes
          setTimeout(() => {
            if (pendingBrowserUrlRef.current) {
              openBrowserForUrlRef.current?.(url);
            }
          }, 300);
        }
      }
    });
    return () => {
      subscription.remove();
      pendingBrowserUrlRef.current = null;
      appInBackgroundRef.current = false;
      isBrowserOpenRef.current = false;
    };
  }, []);

  const handleDonate = useCallback(async () => {
    let finalAmount = isOtherSelected ? parseFloat(customAmount) : selectedAmount;
    if (isNaN(finalAmount) || finalAmount <= 0) {
      finalAmount = 10; // Fallback
    }

    hasDonatedRef.current = true;
    trackSevaEvent("donate_tapped", {
      amount: finalAmount,
      is_custom: isOtherSelected,
      donation_type: effectiveDonationType,
    });

    const url = buildQgivUrl({
      amount: finalAmount,
      isCustomAmount: isOtherSelected,
      donationType: effectiveDonationType,
      frequency,
    });

    // Platform split for the PAYMENT surface (see DonationWebView.jsx):
    // - Android: in-process WebView screen so the page survives backgrounding
    //   (Android kills the RN process when a Chrome Custom Tab runs on top).
    // - iOS: InAppBrowser/SFSafariViewController — no backgrounding kill there,
    //   and it preserves the web-handoff surface Apple review expects.
    // Both branches launch synchronously (no await) so payment_success fires at
    // the same point — on browser-open — on both platforms. openBrowserForUrl
    // manages its own async lifecycle (and the resume re-open) internally.
    if (Platform.OS === "android") {
      navigation.navigate("DonationWebView", { url });
    } else {
      openBrowserForUrl(url);
    }

    // NOTE: not a real success signal — Qgiv holds payment truth. Fired on
    // browser-open at the client's request to approximate conversion intent.
    trackSevaEvent("payment_success", {
      provider: "qgiv",
      donation_type: effectiveDonationType,
    });
  }, [
    isOtherSelected,
    customAmount,
    selectedAmount,
    effectiveDonationType,
    frequency,
    dispatch,
    navigation,
    openBrowserForUrl,
  ]);

  const handleOpenSource = () => {
    openBrowserForUrl("https://github.com/KhalisFoundation/sundar-gutka-react");
  };

  const content = config?.content ?? {};
  const hPad = Math.max(16, Math.min(28, screenWidth * 0.064));

  const renderDescription = () => {
    const text = content.description || "";
    const links = content.descriptionLinks || [];
    if (!links.length) return <Text style={styles.description}>{text}</Text>;

    const positioned = links
      .map((l) => ({ ...l, index: text.indexOf(l.text) }))
      .filter((l) => l.index !== -1)
      .sort((a, b) => a.index - b.index);

    const segments = [];
    let cursor = 0;
    positioned.forEach(({ text: linkText, url, index }) => {
      if (index > cursor) segments.push({ text: text.slice(cursor, index), link: false });
      segments.push({ text: linkText, url, link: true });
      cursor = index + linkText.length;
    });
    if (cursor < text.length) segments.push({ text: text.slice(cursor), link: false });

    return (
      <Text style={styles.description}>
        {segments.map((seg, i) =>
          seg.link ? (
            <Text key={i} style={styles.link} onPress={() => openBrowserForUrl(seg.url)}>
              {seg.text}
            </Text>
          ) : (
            <Text key={i}>{seg.text}</Text>
          )
        )}
      </Text>
    );
  };
  const FREQUENCY_LABELS = {
    Monthly: STRINGS.SEVA_MONTHLY,
    Annually: STRINGS.SEVA_ANNUALLY,
    "One Time": STRINGS.SEVA_ONE_TIME,
  };

  const getFrequencyLabel = () =>
    frequency === "Annually" ? STRINGS.SEVA_PER_YEAR : STRINGS.SEVA_PER_MONTH;

  // When Other is selected but user hasn't typed yet, show the last preset in the card
  const displayAmount =
    isOtherSelected && customAmount ? customAmount : String(selectedAmount ?? "");

  const amounts = config?.defaults?.amounts ?? [10, 50, 100];

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeArea backgroundColor={isDarkMode ? "#041126" : theme.colors.surface} edges={["left", "right"]}>
        <StatusBarComponent />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeArea>
    );
  }

  // ─── Error / offline ──────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeArea backgroundColor={isDarkMode ? "#041126" : theme.colors.surface} edges={["left", "right"]}>
        <StatusBarComponent />
        <View style={styles.centered}>
          <CustomText style={styles.description}>
            {STRINGS.SEVA_LOAD_ERROR}
          </CustomText>
          <Pressable onPress={() => Linking.openURL("https://khalisfoundation.org/donate")}>
            <CustomText style={[styles.description, { color: theme.colors.primary }]}>
              {STRINGS.SEVA_DONATE_DIRECTLY}
            </CustomText>
          </Pressable>
        </View>
      </SafeArea>
    );
  }

  // ─── Main screen ──────────────────────────────────────────────────────────
  return (
    <SafeArea backgroundColor={isDarkMode ? "#041126" : theme.colors.surface} edges={["left", "right"]}>
      <StatusBarComponent />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { paddingHorizontal: hPad, paddingTop: vPad }]}>
          {/* Title */}
          {isDarkMode ? (
            <CustomText
              style={[styles.headline, { fontSize: headlineFontSize, lineHeight: headlineFontSize * 1.4, width: titleWidth }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {content.headline}
            </CustomText>
          ) : (
            <Svg height={headlineFontSize + 20} width={titleWidth}>
              <Defs>
                <SvgLinearGradient id="headlineGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="#113979" stopOpacity="1" />
                  <Stop offset="1" stopColor="#1F69DF" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>
              <SvgText
                fill="url(#headlineGrad)"
                fontSize={headlineFontSize}
                fontWeight="800"
                fontFamily="BalooPaaji2-SemiBold"
                textAnchor="middle"
                x={titleWidth / 2}
                y={headlineFontSize + 4}
              >
                {content.headline}
              </SvgText>
            </Svg>
          )}

          {/* Description */}
          {renderDescription()}

          {/* Amount card — static display OR inline input when Other is selected */}
          <View style={styles.amountCard}>
            <View style={styles.amountContainer}>
              <View style={styles.amountRow}>
                <CustomText style={styles.currency}>$</CustomText>
                {isOtherSelected ? (
                  <View style={styles.amountInputWrap}>
                    <TextInput
                      style={styles.amountDisplay}
                      value={customAmount}
                      onChangeText={handleCustomAmountChange}
                      keyboardType="numeric"
                      cursorColor={isDarkMode ? theme.staticColors.WHITE_COLOR : "#2C5282"}
                      selectionColor={isDarkMode ? theme.staticColors.WHITE_COLOR : "#2C5282"}
                      autoFocus
                    />
                    {customAmount === "" && (
                      <CustomText
                        style={[styles.amountDisplay, styles.amountPlaceholder]}
                        pointerEvents="none"
                      >
                        0
                      </CustomText>
                    )}
                  </View>
                ) : (
                  <CustomText style={styles.amountDisplay}>{displayAmount}</CustomText>
                )}
              </View>
              {frequency !== "One Time" && (
                <CustomText style={styles.perMonth}>/{getFrequencyLabel()}</CustomText>
              )}
            </View>
          </View>

          {/* Preset amounts */}
          <View style={styles.amountButtons}>
            {amounts.map((amount) => (
              <Pressable
                key={amount}
                style={[
                  styles.amountButton,
                  selectedAmount === amount && !isOtherSelected && styles.amountButtonSelected,
                ]}
                onPress={() => handleAmountSelect(amount)}
              >
                <CustomText
                  style={[
                    styles.amountButtonText,
                    selectedAmount === amount &&
                      !isOtherSelected &&
                      styles.amountButtonTextSelected,
                  ]}
                >
                  ${amount}
                </CustomText>
              </Pressable>
            ))}
            <Pressable
              style={[styles.amountButton, isOtherSelected && styles.amountButtonSelected]}
              onPress={() => handleAmountSelect(null, true)}
            >
              <CustomText
                style={[
                  styles.amountButtonText,
                  isOtherSelected && styles.amountButtonTextSelected,
                ]}
              >
                {STRINGS.SEVA_OTHER}
              </CustomText>
            </Pressable>
          </View>

          {/* Frequency / donation type */}
          <View style={styles.frequencyContainer}>
            {["Monthly", "One Time"].map((freq) => (
              <Pressable
                key={freq}
                style={styles.frequencyOption}
                onPress={() => handleFrequencyChange(freq)}
              >
                <View style={styles.radioButton}>
                  {frequency === freq && <View style={styles.radioButtonSelected} />}
                </View>
                <CustomText style={styles.frequencyText}>{FREQUENCY_LABELS[freq]}</CustomText>
              </Pressable>
            ))}
          </View>

          {/* Donate button */}
          <Pressable style={styles.donateButton} onPress={handleDonate}>
            <LinearGradient
              colors={isDarkMode ? [theme.colors.primary, theme.colors.primary] : ["#113979", "#0C2958"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                borderRadius: 100,
                paddingHorizontal: 18,
                paddingVertical: 14,
              }}
            >
              <DonateIcon size={30} color="#FFFFFF" />
              <CustomText style={styles.donateButtonText}>{STRINGS.donate}</CustomText>
            </LinearGradient>
          </Pressable>

          {/* Open source footer */}
          <Pressable onPress={handleOpenSource}>
            <CustomText style={styles.footerText}>{content.footerText}</CustomText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeArea>
  );
};

export default SevaScreen;
