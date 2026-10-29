import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Animated, Pressable, Text, useWindowDimensions } from "react-native";
import { useSelector } from "react-redux";
import { themeForScreen } from "@theme/screenPalettes";
import PropTypes from "prop-types";
import { ScreenHeader, Spinner } from "@common/components/ui";
import {
  SafeArea,
  StatusBarComponent,
  CustomText,
  GradientDivider,
  useTheme,
  useThemedStyles,
  STRINGS,
  openInAppBrowser,
  useCustomScrollbar,
} from "@common";
import { ChevronRight } from "../common/icons";
import { getSevaMeansPage } from "../services/sevaMeans";
import createStyles from "./sevaMeansStyles";
import { detectSocialBrand, SocialBadge } from "./socialIcons";
import { parseHtmlBlocks, blockText } from "./utils/parseHtmlBlocks";

/**
 * A "Seva by other means" page — server-driven UI rendered NATIVELY, mirroring
 * the Seva page's own content pipeline: the backend returns a constrained HTML
 * fragment, the app parses it (parseSevaContent → parseHtmlBlocks) and renders
 * real native, themed elements (no WebView). Content is cached / falls back
 * offline by services/sevaMeans.js. Only the header/back button are app-native
 * chrome. Links open in the in-app browser.
 */

// Route page key → the header title shown before content (and its language) load.
const TITLE_KEYS = {
  social: "SEVA_SPREAD_WORD",
  coding: "SEVA_FOR_CODERS",
  qa: "SEVA_BY_TESTING",
  other: "SEVA_OTHER_OPPORTUNITIES",
};

const SevaMeansScreen = ({ route, navigation }) => {
  const { theme } = useTheme();
  // The whole screen resolves the shared role names to Seva's own colours, so
  // nothing here names a literal and the sub-pages match the landing page.
  const { c } = themeForScreen(theme, "seva");
  const isDark = theme.mode === "dark";
  const styles = useThemedStyles(createStyles);
  // The app-wide themed scrollbar, not the unthemed native one.
  const { scrollViewProps, Indicator } = useCustomScrollbar();
  const language = useSelector((state) => state.language);

  // ─── Responsive vertical rhythm (mirrors the main Seva page) ────────────────
  // One consistent, viewport-derived gap owns ALL spacing between blocks —
  // instead of each element carrying its own hardcoded margin — so the page
  // reads as an even rhythm and scales from a small phone to a tablet. The few
  // deliberate group breaks (a section heading, the closing footer, the hero
  // top offset) are the SAME small multiples of that base everywhere.
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const hPad = Math.round(Math.max(16, Math.min(28, screenWidth * 0.064)));
  const gap = Math.round(Math.min(24, Math.max(14, screenHeight * 0.02)));
  const vPad = Math.round(Math.min(36, Math.max(18, screenHeight * 0.04)));
  const headingTop = Math.round(gap * 0.5); // extra space above a group heading
  const footerTop = Math.round(gap * 0.6); // sets the closing footer apart
  const heroTop = Math.round(vPad * 0.8); // top offset for the centered hero pages

  const page = route?.params?.page;
  // Bar background matches the page body (dark navy / cream), not a black strip.
  // Same bar as the Seva landing page. The shared `ScreenHeader` colours its own
  // title and back arrow from `headerFg`, so only the ground is supplied here.
  const headerBg = c.backgroundAlt;

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [data, setData] = useState(null);
  const isBrowserOpenRef = useRef(false);

  const fetchPage = useCallback(
    async (isActive) => {
      setLoading(true);
      setFailed(false);
      const res = await getSevaMeansPage({ page, lang: language });
      if (isActive && !isActive()) return;
      if (res?.segments?.length) {
        setData(res);
      } else {
        setFailed(true);
      }
      setLoading(false);
    },
    [page, language]
  );

  useEffect(() => {
    let active = true;
    fetchPage(() => active);
    return () => {
      active = false;
    };
  }, [fetchPage]);

  const openBrowserForUrl = useCallback(
    async (url) => {
      if (!url || isBrowserOpenRef.current) return;
      const barColor = c.surface;
      const controlColor = c.textPrimary;
      isBrowserOpenRef.current = true;
      try {
        await openInAppBrowser(url, { barColor, controlColor });
      } finally {
        isBrowserOpenRef.current = false;
      }
    },
    [isDark, theme]
  );

  // Renders one `{type:"html"}` segment (identical approach to SevaScreen's
  // renderHtmlSegment) into native Text/View using the fragment's class hints.
  const renderHtmlSegment = (html, keyPrefix) =>
    parseHtmlBlocks(html).map((block, i) => {
      const key = `${keyPrefix}-block-${i}`;
      const cls = block.className || "";
      const isHeading = block.tag === "h1" || block.tag === "h2" || block.tag === "h3";

      if (isHeading) {
        // Hero title (the "other" page) gets a top offset so it isn't glued to
        // the divider; a section heading gets a smaller group break above it.
        const isHero = cls.includes("seva-hero-title");
        return (
          <CustomText
            key={key}
            style={[
              isHero ? styles.heroTitle : styles.sectionHeading,
              { marginTop: isHero ? heroTop : headingTop },
            ]}
          >
            {blockText(block)}
          </CustomText>
        );
      }

      let blockStyle = styles.description;
      if (cls.includes("seva-hero-sub")) blockStyle = styles.heroSub;
      else if (cls.includes("seva-footer")) blockStyle = [styles.footer, { marginTop: footerTop }];
      else if (cls.includes("seva-intro")) blockStyle = styles.intro;

      const isLinkRow = cls.includes("seva-link");
      const rowStyle = isLinkRow ? styles.linkRow : null;

      const textEl = (
        <Text key={key} style={isLinkRow ? styles.linkRowText : blockStyle}>
          {block.segments.map((seg, j) =>
            seg.link ? (
              <Text
                // eslint-disable-next-line react/no-array-index-key
                key={j}
                style={styles.link}
                onPress={() => openBrowserForUrl(seg.url)}
              >
                {seg.text}
              </Text>
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <Text key={j}>{seg.text}</Text>
            )
          )}
        </Text>
      );

      // Link rows get a tappable card wrapper (whole row opens the first link),
      // with a trailing chevron. Social links (Instagram/Facebook/X/YouTube)
      // also get a leading brand badge in the platform's colour.
      if (isLinkRow) {
        const firstLink = block.segments.find((s) => s.link);
        const brand = detectSocialBrand(firstLink?.url);
        return (
          <Pressable key={key} style={rowStyle} onPress={() => openBrowserForUrl(firstLink?.url)}>
            {brand && <SocialBadge brand={brand} size={24} dark={isDark} />}
            <View style={styles.linkRowInner}>{textEl}</View>
            <ChevronRight size={20} color={c.accent} />
          </Pressable>
        );
      }
      return textEl;
    });

  const title = data?.title || STRINGS[TITLE_KEYS[page]] || STRINGS.SEVA;

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <Spinner size="large" color={c.accent} />
        </View>
      );
    }
    if (failed || !data) {
      return (
        <View style={styles.centered}>
          <CustomText style={styles.description}>{STRINGS.SEVA_MEANS_LOAD_ERROR}</CustomText>
          <Pressable onPress={() => fetchPage()}>
            <CustomText style={[styles.link, { marginTop: 12 }]}>{STRINGS.RETRY}</CustomText>
          </Pressable>
        </View>
      );
    }
    return (
      // The app's themed scrollbar, the same one the bani list and Settings
      // draw — the native bar cannot follow a designed theme. Indicator is a
      // SIBLING inside a flex:1 wrapper, as the hook requires.
      <View style={{ flex: 1 }}>
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...scrollViewProps}
        >
          {/* One wrapper owns the whole page's spacing: horizontal padding,
              top/bottom padding, and a single `gap` between every block. */}
          <View
            style={{
              paddingHorizontal: hPad,
              paddingTop: Math.round(vPad * 0.5),
              paddingBottom: vPad,
              gap,
            }}
          >
            {data.segments.map((seg, i) =>
            seg.type === "html" ? (
              // eslint-disable-next-line react/no-array-index-key
              <React.Fragment key={`seg-${i}`}>
                {renderHtmlSegment(seg.value, `seg-${i}`)}
              </React.Fragment>
            ) : null
            )}
          </View>
        </Animated.ScrollView>
        {Indicator}
      </View>
    );
  };

  return (
    <SafeArea backgroundColor={headerBg} edges={["bottom"]}>
      <StatusBarComponent backgroundColor={headerBg} />
      {/* The shared header — same clearance, row height and back control as
          every other screen. */}
      <ScreenHeader
        title={title}
        surface={headerBg}
        onBack={() => navigation.goBack()}
        backAccessibilityLabel={STRINGS.GO_BACK}
        showBorder={false}
      />
      <GradientDivider />
      <View style={styles.container}>{renderBody()}</View>
    </SafeArea>
  );
};

SevaMeansScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({ page: PropTypes.string }),
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }).isRequired,
};

export default SevaMeansScreen;
